import { getQueueToken } from "@nestjs/bullmq";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { EvidenceStatus, ReportCategory, ReportStatus, UserRole } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";
import { NotificationsProcessor } from "../src/notifications/notifications.processor";
import { StorageService } from "../src/reports/storage.service";
import { AiClientService } from "../src/ai/ai-client.service";
import { AiProcessor } from "../src/ai/ai.processor";

describe("AI Service Resilience & Fallback (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let moduleFixture: TestingModule;

  const testUser = { id: "user-submitter-1", role: UserRole.USER };
  const moderator = { id: "user-mod-1", role: UserRole.MODERATOR };

  let tokenUser: string;
  let tokenModerator: string;

  const storedReports = new Map<
    string,
    {
      id: string;
      tracking_code: string;
      user_id: string;
      venue_id: string | null;
      facility_id: string | null;
      category: ReportCategory;
      title: string | null;
      description: string;
      status: ReportStatus;
      latitude: number | null;
      longitude: number | null;
      created_at: Date;
      updated_at: Date;
      reopen_count: number;
      assigned_to_user_id: string | null;
      verified_by_user_id: string | null;
      resolved_at: Date | null;
    }
  >();

  const storedEvidence = new Map<
    string,
    {
      id: string;
      report_id: string;
      object_key: string;
      content_type: string;
      size_bytes: number;
      status: EvidenceStatus;
      created_at: Date;
      updated_at: Date;
    }
  >();

  const seedReportId = "11111111-2222-3333-4444-555555555555";

  beforeAll(async () => {
    storedReports.set(seedReportId, {
      id: seedReportId,
      tracking_code: "PP-2026-SEED1",
      user_id: testUser.id,
      venue_id: "ven-1",
      facility_id: null,
      category: ReportCategory.BROKEN_LIFT,
      title: "Broken Lift",
      description: "Main passenger elevator is completely out of service on floor 1.",
      status: ReportStatus.SUBMITTED,
      latitude: 40.7128,
      longitude: -74.006,
      created_at: new Date(),
      updated_at: new Date(),
      reopen_count: 0,
      assigned_to_user_id: null,
      verified_by_user_id: null,
      resolved_at: null,
    });

    const txObj = {
      venue: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "ven-1", name: "Science Complex", organization_id: "org-1" }),
      },
      facility: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      issueReport: {
        findUnique: jest.fn(
          async ({ where }: { where: { id?: string; tracking_code?: string } }) => {
            if (where.id) return storedReports.get(where.id) ?? null;
            if (where.tracking_code) {
              return (
                Array.from(storedReports.values()).find(
                  (r) => r.tracking_code === where.tracking_code,
                ) ?? null
              );
            }
            return null;
          },
        ),
        findFirst: jest.fn(async ({ where }: { where: { id?: string } }) => {
          if (!where.id) return null;
          const r = storedReports.get(where.id);
          if (!r) return null;
          const ev = Array.from(storedEvidence.values()).filter((e) => e.report_id === r.id);
          return {
            ...r,
            evidence: ev,
            ai_suggestions: [],
            venue: { id: "ven-1", name: "Science Complex", organization_id: "org-1" },
            facility: null,
          };
        }),
        findMany: jest.fn(async () => {
          return Array.from(storedReports.values());
        }),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const id = `rep-${Date.now()}`;
          const newReport = {
            id,
            tracking_code: data.tracking_code as string,
            user_id: data.user_id as string,
            venue_id: (data.venue_id as string) || null,
            facility_id: (data.facility_id as string) || null,
            category: data.category as ReportCategory,
            title: (data.title as string) || null,
            description: data.description as string,
            status: ReportStatus.SUBMITTED,
            latitude: (data.latitude as number) || null,
            longitude: (data.longitude as number) || null,
            created_at: new Date(),
            updated_at: new Date(),
            reopen_count: 0,
            assigned_to_user_id: null,
            verified_by_user_id: null,
            resolved_at: null,
          };
          storedReports.set(id, newReport);
          return { ...newReport, evidence: [] };
        }),
        update: jest.fn(
          async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const existing = storedReports.get(where.id);
            if (!existing) throw new Error("Report not found");
            const updated = { ...existing, ...data, updated_at: new Date() };
            storedReports.set(where.id, updated);
            return updated;
          },
        ),
      },
      evidence: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const id = `ev-${Date.now()}`;
          const newEv = {
            id,
            report_id: data.report_id as string,
            object_key: data.object_key as string,
            content_type: data.content_type as string,
            size_bytes: data.size_bytes as number,
            status: EvidenceStatus.PENDING_UPLOAD,
            created_at: new Date(),
            updated_at: new Date(),
          };
          storedEvidence.set(id, newEv);
          return newEv;
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" }),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      aiSuggestion: {
        create: jest.fn().mockResolvedValue({ id: "sug-1" }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      organizationMember: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $queryRaw: jest.fn(async () => {
        const r = storedReports.get(seedReportId);
        return r ? [r] : [];
      }),
    };

    const mockPrisma = {
      ...txObj,
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn(async (cb: (tx: typeof txObj) => Promise<unknown>) => {
        return cb(txObj);
      }),
    };

    const mockStorage = {
      getPresignedPutUrl: jest.fn().mockResolvedValue("https://s3.local/test-upload-key"),
      getPresignedGetUrl: jest.fn().mockResolvedValue("https://s3.local/test-get-key"),
      headObject: jest.fn().mockResolvedValue({ contentLength: 1024, contentType: "image/jpeg" }),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const mockAiClient = {
      classifyReport: jest.fn().mockRejectedValue(new Error("AI service connection refused")),
      scoreDuplicates: jest.fn().mockRejectedValue(new Error("AI service timeout")),
      summarizeReports: jest.fn().mockRejectedValue(new Error("AI service unavailable")),
      checkHealth: jest.fn().mockResolvedValue(null),
      getCircuitBreakerState: jest.fn().mockReturnValue("OPEN"),
      resetCircuitBreaker: jest.fn(),
    };

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(StorageService)
      .useValue(mockStorage)
      .overrideProvider(AiClientService)
      .useValue(mockAiClient)
      .overrideProvider(getQueueToken("report-notifications"))
      .useValue({ add: jest.fn().mockResolvedValue({ id: "job-notif" }) })
      .overrideProvider(NotificationsProcessor)
      .useValue({})
      .overrideProvider(getQueueToken("report-ai-processing"))
      .useValue({ add: jest.fn().mockRejectedValue(new Error("Redis offline")) })
      .overrideProvider(AiProcessor)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    const secret = process.env.JWT_ACCESS_SECRET || "dev-pathpulse-jwt-access-secret-32-chars-long";

    tokenUser = jwtService.sign({ sub: testUser.id, role: testUser.role }, { secret });
    tokenModerator = jwtService.sign({ sub: moderator.id, role: moderator.role }, { secret });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should create report successfully when AI service and queue are offline", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${tokenUser}`)
      .send({
        venueId: "ven-1",
        category: "BROKEN_LIFT",
        description: "Elevator doors are stuck and cannot open.",
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe("SUBMITTED");
    expect(res.body.category).toBe("BROKEN_LIFT");
  });

  it("should generate presigned evidence upload url normally when AI service is down", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/${seedReportId}/evidence`)
      .set("Authorization", `Bearer ${tokenUser}`)
      .send({
        contentType: "image/jpeg",
        sizeBytes: 2048,
      })
      .expect(201);

    expect(res.body.evidenceId).toBeDefined();
    expect(res.body.uploadUrl).toBe("https://s3.local/test-upload-key");
  });

  it("should execute moderator REVIEW transition without hindrance when AI service is down", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/${seedReportId}/review`)
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(200);

    expect(res.body.status).toBe("UNDER_REVIEW");
  });

  it("should fall back to token duplicate candidates when AI service duplicate scoring fails", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/${seedReportId}/duplicates`)
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    for (const dup of res.body) {
      expect(dup.source).toBe("token");
    }
  });

  it("should return report details with empty aiSuggestions when no suggestions exist", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/${seedReportId}`)
      .set("Authorization", `Bearer ${tokenUser}`)
      .expect(200);

    expect(res.body.id).toBe(seedReportId);
    expect(Array.isArray(res.body.aiSuggestions)).toBe(true);
    expect(res.body.aiSuggestions.length).toBe(0);
  });
});
