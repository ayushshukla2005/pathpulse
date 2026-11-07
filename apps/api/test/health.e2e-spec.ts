import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";

describe("Health (e2e)", () => {
  let app: INestApplication;
  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
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
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health returns 200 and status ok with x-request-id header", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("database", "connected");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("version");
    expect(res.headers).toHaveProperty("x-request-id");
  });

  it("GET /api/v1/health returns 503 and degraded when database query fails", async () => {
    mockPrismaService.$queryRaw.mockRejectedValueOnce(new Error("Database disconnected"));

    const res = await request(app.getHttpServer()).get("/api/v1/health").expect(503);

    expect(res.body).toHaveProperty("status", "degraded");
    expect(res.body).toHaveProperty("database", "disconnected");
    expect(res.headers).toHaveProperty("x-request-id");
  });

  it("GET /api/v1/does-not-exist returns 404 with consistent error shape and x-request-id", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/does-not-exist").expect(404);

    expect(res.body).toHaveProperty("statusCode", 404);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("path", "/api/v1/does-not-exist");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("requestId");
    expect(res.headers).toHaveProperty("x-request-id");
  });
});
