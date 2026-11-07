import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaService } from "../database/prisma.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
    decode: jest.Mock;
  };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest
        .fn()
        .mockImplementation((payload) =>
          Promise.resolve(`signed-${payload.sub}-${payload.jti ?? "access"}`),
        ),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === "jwtAccessSecret") return "access-secret-minimum-32-characters-test";
        if (key === "jwtRefreshSecret") return "refresh-secret-minimum-32-characters-test";
        return null;
      }),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe("Password Hashing", () => {
    it("should hash and verify passwords using bcrypt", async () => {
      const password = "StrongPassword123";
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      const isInvalid = await bcrypt.compare("WrongPassword123", hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Token Generation", () => {
    it("should issue access and refresh tokens with unique jti", async () => {
      const tokens1 = await service.generateTokenPair("user-1", UserRole.USER);
      const tokens2 = await service.generateTokenPair("user-1", UserRole.USER);

      expect(tokens1.accessToken).toBeDefined();
      expect(tokens1.refreshToken).toBeDefined();
      expect(tokens1.refreshToken).not.toEqual(tokens2.refreshToken);
    });
  });

  describe("Refresh Rotation", () => {
    it("should rotate token and mark old token revoked", async () => {
      const oldRefreshToken = "valid-refresh-token";
      const tokenHash = service.hashToken(oldRefreshToken);

      jwtService.verifyAsync.mockResolvedValue({
        sub: "user-1",
        jti: "token-uuid-1",
      });

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-record-1",
        user_id: "user-1",
        token_hash: tokenHash,
        revoked: false,
        revoked_at: null,
        expires_at: new Date(Date.now() + 100000),
      });

      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        role: UserRole.USER,
      });

      prisma.refreshToken.create.mockResolvedValue({
        id: "rt-record-2",
      });

      const result = await service.refresh({ refreshToken: oldRefreshToken });

      expect(result.tokens).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rt-record-1" },
          data: expect.objectContaining({
            revoked: true,
            replaced_by_token_id: "rt-record-2",
          }),
        }),
      );
    });

    it("should revoke all user sessions when a revoked token is reused", async () => {
      const stolenToken = "stolen-refresh-token";
      const tokenHash = service.hashToken(stolenToken);

      jwtService.verifyAsync.mockResolvedValue({
        sub: "user-victim",
        jti: "token-uuid-stolen",
      });

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-record-old",
        user_id: "user-victim",
        token_hash: tokenHash,
        revoked: true,
        revoked_at: new Date(Date.now() - 50000),
        expires_at: new Date(Date.now() + 100000),
      });

      await expect(service.refresh({ refreshToken: stolenToken })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: "user-victim", revoked: false },
        data: expect.objectContaining({ revoked: true }),
      });
    });
  });
});
