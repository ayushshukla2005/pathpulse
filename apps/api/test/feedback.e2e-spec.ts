import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";

describe("Feedback (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const createdRows: Array<{
    id: string;
    message: string;
    category: string;
    user_id: string | null;
  }> = [];

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    feedback: {
      create: jest
        .fn()
        .mockImplementation(
          (args: { data: { message: string; category: string; user_id: string | null } }) => {
            const row = {
              id: `feedback-${createdRows.length + 1}`,
              message: args.data.message,
              category: args.data.category,
              user_id: args.data.user_id,
              created_at: new Date(),
            };
            createdRows.push(row);
            return Promise.resolve(row);
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

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/v1/feedback succeeds anonymously without returning stored content or storing user identity", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/feedback")
      .send({
        message: "The entrance ramp on North Quad is slightly too steep for manual wheelchairs.",
        category: "ACCESSIBILITY",
      })
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      message: "Thank you for your feedback. Our team has received your message.",
    });
    expect(res.body.id).toBeUndefined();
    expect(res.body.content).toBeUndefined();
    expect(res.body.message_text).toBeUndefined();

    expect(mockPrisma.feedback.create).toHaveBeenCalledWith({
      data: {
        message: "The entrance ramp on North Quad is slightly too steep for manual wheelchairs.",
        category: "ACCESSIBILITY",
        user_id: null,
      },
    });
  });

  it("POST /api/v1/feedback associates user identity when authenticated", async () => {
    const token = jwtService.sign(
      { sub: "usr-logged-in-123", role: "USER" },
      { secret: process.env.JWT_ACCESS_SECRET },
    );

    const res = await request(app.getHttpServer())
      .post("/api/v1/feedback")
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Braille signage in science building elevator is partially damaged.",
        category: "ACCESSIBILITY",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(mockPrisma.feedback.create).toHaveBeenCalledWith({
      data: {
        message: "Braille signage in science building elevator is partially damaged.",
        category: "ACCESSIBILITY",
        user_id: "usr-logged-in-123",
      },
    });
  });

  it("POST /api/v1/feedback silently drops submission when honeypot field is filled", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/feedback")
      .send({
        message: "Buy cheap products at this malicious url",
        honeypot: "http://bot.com/spam",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(mockPrisma.feedback.create).not.toHaveBeenCalled();
  });

  it("POST /api/v1/feedback enforces rate limiting and returns 429 after limit is reached", async () => {
    const agent = request(app.getHttpServer());

    for (let i = 0; i < 5; i++) {
      await agent.post("/api/v1/feedback").send({
        message: `Rapid test feedback item number ${i + 1}`,
        category: "GENERAL",
      });
    }

    const res = await agent.post("/api/v1/feedback").send({
      message: "This request should exceed the limit of 5 requests per minute",
      category: "GENERAL",
    });

    expect(res.status).toBe(429);
  });
});
