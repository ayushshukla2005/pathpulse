import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { MobilityProfile, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrst";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserSummary;
  tokens: TokenPair;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async generateTokenPair(userId: string, role: UserRole): Promise<TokenPair> {
    const accessSecret = this.configService.get<string>("jwtAccessSecret");
    const refreshSecret = this.configService.get<string>("jwtRefreshSecret");
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, role }, { secret: accessSecret, expiresIn: "15m" }),
      this.jwtService.signAsync({ sub: userId, jti }, { secret: refreshSecret, expiresIn: "7d" }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        name: dto.name,
        role: UserRole.USER,
        preferences: {
          create: {
            mobility_profile: MobilityProfile.CUSTOM,
            avoid_stairs: false,
            prefer_voice_guidance: false,
            high_contrast: false,
            text_scale: 1.0,
          },
        },
      },
    });

    const tokens = await this.generateTokenPair(user.id, user.role);
    const tokenHash = this.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked: false,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.generateTokenPair(user.id, user.role);
    const tokenHash = this.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked: false,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      },
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<{ tokens: TokenPair }> {
    const refreshSecret = this.configService.get<string>("jwtRefreshSecret");
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!storedToken || storedToken.user_id !== payload.sub) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (storedToken.revoked || storedToken.revoked_at !== null) {
      await this.prisma.refreshToken.updateMany({
        where: { user_id: payload.sub, revoked: false },
        data: { revoked: true, revoked_at: new Date() },
      });
      throw new UnauthorizedException("Revoked token reused. All sessions terminated.");
    }

    if (storedToken.expires_at < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const newTokens = await this.generateTokenPair(user.id, user.role);
    const newTokenHash = this.hashToken(newTokens.refreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newTokenRecord = await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: newTokenHash,
        expires_at: newExpiresAt,
        revoked: false,
      },
    });

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revoked: true,
        revoked_at: new Date(),
        replaced_by_token_id: newTokenRecord.id,
      },
    });

    return { tokens: newTokens };
  }

  async logout(dto: LogoutDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked: true, revoked_at: new Date() },
    });

    return { message: "Logged out successfully" };
  }
}
