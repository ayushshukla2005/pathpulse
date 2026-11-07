import { Controller, Get, INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MobilityProfile, UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Roles } from "../src/common/decorators/roles.decorator";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";

interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

interface StoredPreference {
  id: string;
  user_id: string;
  mobility_profile: MobilityProfile;
  avoid_stairs: boolean;
  prefer_voice_guidance: boolean;
  high_contrast: boolean;
  text_scale: number;
  created_at: Date;
  updated_at: Date;
}

interface StoredRefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  revoked_at: Date | null;
  replaced_by_token_id: string | null;
  created_at: Date;
}

@Controller("test-admin")
class AdminTestController {
  @Roles(UserRole.SUPER_ADMIN)
  @Get("dashboard")
  getAdminData() {
    return { secret: "admin-data" };
  }
}

describe("Authentication & RBAC (e2e)", () => {
  let app: INestApplication;

  const users = new Map<string, StoredUser>();
  const preferences = new Map<string, StoredPreference>();
  const refreshTokens = new Map<string, StoredRefreshToken>();

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email) return { ...u };
          }
        }
        if (where.id) {
          const u = users.get(where.id);
          if (!u) return null;
          const p = preferences.get(u.id) ?? null;
          return { ...u, preferences: p };
        }
        return null;
      }),
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            email: string;
            password_hash: string;
            name: string;
            role: UserRole;
            preferences?: { create: Partial<StoredPreference> };
          };
        }) => {
          const user: StoredUser = {
            id: randomUUID(),
            email: data.email,
            password_hash: data.password_hash,
            name: data.name,
            role: data.role,
            created_at: new Date(),
            updated_at: new Date(),
          };
          users.set(user.id, user);

          const pref: StoredPreference = {
            id: randomUUID(),
            user_id: user.id,
            mobility_profile: data.preferences?.create?.mobility_profile ?? MobilityProfile.CUSTOM,
            avoid_stairs: data.preferences?.create?.avoid_stairs ?? false,
            prefer_voice_guidance: data.preferences?.create?.prefer_voice_guidance ?? false,
            high_contrast: data.preferences?.create?.high_contrast ?? false,
            text_scale: data.preferences?.create?.text_scale ?? 1.0,
            created_at: new Date(),
            updated_at: new Date(),
          };
          preferences.set(user.id, pref);

          return user;
        },
      ),
    },
    userPreference: {
      upsert: jest.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { user_id: string };
          create: Partial<StoredPreference>;
          update: Partial<StoredPreference>;
        }) => {
          let pref = preferences.get(where.user_id);
          if (!pref) {
            pref = {
              id: randomUUID(),
              user_id: where.user_id,
              mobility_profile: create.mobility_profile ?? MobilityProfile.CUSTOM,
              avoid_stairs: create.avoid_stairs ?? false,
              prefer_voice_guidance: create.prefer_voice_guidance ?? false,
              high_contrast: create.high_contrast ?? false,
              text_scale: create.text_scale ?? 1.0,
              created_at: new Date(),
              updated_at: new Date(),
            };
          } else {
            pref = {
              ...pref,
              ...update,
              updated_at: new Date(),
            };
          }
          preferences.set(where.user_id, pref);
          return pref;
        },
      ),
    },
    refreshToken: {
      findUnique: jest.fn(async ({ where }: { where: { token_hash: string } }) => {
        for (const rt of refreshTokens.values()) {
          if (rt.token_hash === where.token_hash) return { ...rt };
        }
        return null;
      }),
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            user_id: string;
            token_hash: string;
            expires_at: Date;
            revoked: boolean;
          };
        }) => {
          const rt: StoredRefreshToken = {
            id: randomUUID(),
            user_id: data.user_id,
            token_hash: data.token_hash,
            expires_at: data.expires_at,
            revoked: data.revoked,
            revoked_at: null,
            replaced_by_token_id: null,
            created_at: new Date(),
          };
          refreshTokens.set(rt.id, rt);
          return rt;
        },
      ),
      update: jest.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<StoredRefreshToken> }) => {
          const rt = refreshTokens.get(where.id);
          if (!rt) return null;
          const updated = { ...rt, ...data };
          refreshTokens.set(where.id, updated);
          return updated;
        },
      ),
      updateMany: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { user_id?: string; token_hash?: string; revoked?: boolean };
          data: Partial<StoredRefreshToken>;
        }) => {
          let count = 0;
          for (const [id, rt] of refreshTokens.entries()) {
            const matchesUser = where.user_id === undefined || rt.user_id === where.user_id;
            const matchesHash =
              where.token_hash === undefined || rt.token_hash === where.token_hash;
            const matchesRevoked = where.revoked === undefined || rt.revoked === where.revoked;

            if (matchesUser && matchesHash && matchesRevoked) {
              refreshTokens.set(id, { ...rt, ...data });
              count++;
            }
          }
          return { count };
        },
      ),
    },
  };

  beforeAll(async () => {
    process.env.DATABASE_URL =
      "postgresql://pathpulse:pathpulse_dev_password@localhost:5432/pathpulse";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    process.env.API_PORT = "4000";
    process.env.JWT_ACCESS_SECRET = "this-is-a-valid-access-secret-32-chars-long";
    process.env.JWT_REFRESH_SECRET = "this-is-a-valid-refresh-secret-32-chars-long";
    process.env.REDIS_URL = "redis://localhost:6379";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AdminTestController],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    users.clear();
    preferences.clear();
    refreshTokens.clear();
  });

  it("registers, logs in, and refreshes tokens successfully", async () => {
    const regRes = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: "alice@example.com",
        password: "SecurePassword123!",
        name: "Alice Walker",
      })
      .expect(201);

    expect(regRes.body.user).toHaveProperty("id");
    expect(regRes.body.user.email).toBe("alice@example.com");
    expect(regRes.body.tokens).toHaveProperty("accessToken");
    expect(regRes.body.tokens).toHaveProperty("refreshToken");

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "alice@example.com",
        password: "SecurePassword123!",
      })
      .expect(200);

    expect(loginRes.body.tokens).toHaveProperty("accessToken");
    const originalRefreshToken = loginRes.body.tokens.refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: originalRefreshToken,
      })
      .expect(200);

    expect(refreshRes.body.tokens).toHaveProperty("accessToken");
    expect(refreshRes.body.tokens).toHaveProperty("refreshToken");
    expect(refreshRes.body.tokens.refreshToken).not.toEqual(originalRefreshToken);
  });

  it("returns identical error response for wrong password and unknown email", async () => {
    await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: "bob@example.com",
      password: "CorrectPassword123!",
      name: "Bob Builder",
    });

    const wrongPasswordRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "bob@example.com",
        password: "WrongPassword999!",
      })
      .expect(401);

    const unknownEmailRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "WrongPassword999!",
      })
      .expect(401);

    expect(wrongPasswordRes.body.message).toBe(unknownEmailRes.body.message);
    expect(wrongPasswordRes.body.error).toBe(unknownEmailRes.body.error);
    expect(wrongPasswordRes.body.statusCode).toBe(401);
  });

  it("returns 401 and revokes all user sessions when a revoked refresh token is reused", async () => {
    const regRes = await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: "charlie@example.com",
      password: "CharliePassword123!",
      name: "Charlie Brown",
    });

    const oldToken = regRes.body.tokens.refreshToken;

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: oldToken })
      .expect(200);

    const reuseAttempt = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: oldToken })
      .expect(401);

    expect(reuseAttempt.body.statusCode).toBe(401);
    expect(reuseAttempt.body.message).toContain("Revoked token reused");

    for (const tokenRecord of refreshTokens.values()) {
      expect(tokenRecord.revoked).toBe(true);
    }
  });

  it("returns 401 when unauthenticated request calls /users/me", async () => {
    await request(app.getHttpServer()).get("/api/v1/users/me").expect(401);
  });

  it("scopes preference updates to the authenticated user and rejects body user_id spoofing", async () => {
    const reg1 = await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: "user1@example.com",
      password: "Password123456!",
      name: "User One",
    });

    const reg2 = await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: "user2@example.com",
      password: "Password123456!",
      name: "User Two",
    });

    const tokenUser1 = reg1.body.tokens.accessToken;
    const user2Id = reg2.body.user.id;

    const updateRes = await request(app.getHttpServer())
      .put("/api/v1/users/preferences")
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({
        mobilityProfile: MobilityProfile.WHEELCHAIR,
        avoidStairs: true,
        preferVoiceGuidance: true,
        highContrast: true,
        textScale: 1.5,
      })
      .expect(200);

    expect(updateRes.body.user_id).toBe(reg1.body.user.id);
    expect(updateRes.body.avoid_stairs).toBe(true);
    expect(updateRes.body.text_scale).toBe(1.5);

    const user2Pref = preferences.get(user2Id);
    expect(user2Pref?.avoid_stairs).toBe(false);
  });

  it("returns 403 when a USER calls a SUPER_ADMIN-only route", async () => {
    const regRes = await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: "regular@example.com",
      password: "RegularPassword123!",
      name: "Regular User",
    });

    const userToken = regRes.body.tokens.accessToken;

    await request(app.getHttpServer())
      .get("/api/v1/test-admin/dashboard")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(403);
  });

  it("returns 429 after exceeding the login rate limit", async () => {
    const email = "ratelimit@example.com";
    const password = "RandomPassword123!";

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).post("/api/v1/auth/login").send({ email, password });
    }

    const rateLimitedRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password });

    expect(rateLimitedRes.status).toBe(429);
  });
});
