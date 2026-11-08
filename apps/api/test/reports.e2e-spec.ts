import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { EvidenceStatus, ReportCategory, ReportStatus, UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";
import { StorageService } from "../src/reports/storage.service";

interface StoredReport {
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
}

interface StoredEvidence {
  id: string;
  report_id: string;
  object_key: string;
  content_type: string;
  size_bytes: number;
  status: EvidenceStatus;
  created_at: Date;
  updated_at: Date;
}

describe("Reports & Evidence Upload (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const user1 = { id: "user-alpha", role: UserRole.USER };
  const user2 = { id: "user-beta", role: UserRole.USER };
  const rateLimitUser = { id: "user-throttled", role: UserRole.USER };
  const venueId = "venue-central-campus";

  let tokenUser1: string;
  let tokenUser2: string;
  let tokenRateLimitUser: string;

  const storedReports: Map<string, StoredReport> = new Map();
  const storedEvidence: Map<string, StoredEvidence> = new Map();
  const mockS3Storage: Map<string, { contentLength: number; contentType: string }> = new Map();

  const mockStorageService = {
    getPresignedPutUrl: jest.fn(
      async (objectKey: string, contentType: string, sizeBytes: number) => {
        return `https://s3.local/pathpulse-evidence/${objectKey}?X-Amz-Signature=mock-put&Content-Type=${contentType}&Content-Length=${sizeBytes}`;
      },
    ),
    getPresignedGetUrl: jest.fn(async (objectKey: string) => {
      return `https://s3.local/pathpulse-evidence/${objectKey}?X-Amz-Signature=mock-get`;
    }),
    headObject: jest.fn(async (objectKey: string) => {
      const item = mockS3Storage.get(objectKey);
      if (!item) return null;
      return { contentLength: item.contentLength, contentType: item.contentType };
    }),
    deleteObject: jest.fn(async (objectKey: string) => {
      mockS3Storage.delete(objectKey);
    }),
  };

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        evidence: {
          count: jest.fn(
            async ({
              where,
            }: {
              where: { report_id: string; status: { not: EvidenceStatus } };
            }) => {
              let count = 0;
              for (const ev of storedEvidence.values()) {
                if (ev.report_id === where.report_id && ev.status !== where.status.not) {
                  count++;
                }
              }
              return count;
            },
          ),
          create: jest.fn(async ({ data }: { data: StoredEvidence }) => {
            const record = { ...data, created_at: new Date(), updated_at: new Date() };
            storedEvidence.set(record.id, record);
            return record;
          }),
        },
      };
      return cb(tx);
    }),
    venue: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === venueId) {
          return { id: venueId, name: "Central Campus Center" };
        }
        return null;
      }),
    },
    facility: {
      findUnique: jest.fn(async () => null),
    },
    issueReport: {
      create: jest.fn(
        async ({ data }: { data: Omit<StoredReport, "id" | "created_at" | "updated_at"> }) => {
          const id = randomUUID();
          const record: StoredReport = {
            ...data,
            id,
            created_at: new Date(),
            updated_at: new Date(),
          };
          storedReports.set(id, record);
          return {
            ...record,
            evidence: [],
          };
        },
      ),
      findUnique: jest.fn(async ({ where }: { where: { tracking_code?: string; id?: string } }) => {
        if (where.tracking_code) {
          for (const r of storedReports.values()) {
            if (r.tracking_code === where.tracking_code) return { ...r };
          }
        }
        if (where.id) {
          const r = storedReports.get(where.id);
          return r ? { ...r } : null;
        }
        return null;
      }),
      findFirst: jest.fn(
        async ({
          where,
        }: {
          where: {
            id?: string;
            user_id?: string;
            OR?: Array<{ user_id?: string }>;
          };
        }) => {
          if (!where.id) return null;
          const report = storedReports.get(where.id);
          if (!report) return null;

          if (where.user_id && report.user_id !== where.user_id) {
            return null;
          }

          if (where.OR) {
            const matched = where.OR.some((clause) => clause.user_id === report.user_id);
            if (!matched) return null;
          }

          const evList: StoredEvidence[] = [];
          for (const ev of storedEvidence.values()) {
            if (ev.report_id === report.id) {
              evList.push({ ...ev });
            }
          }

          return {
            ...report,
            evidence: evList,
            venue: { id: venueId, name: "Central Campus Center", organization_id: "org-1" },
            facility: null,
          };
        },
      ),
      findMany: jest.fn(async ({ where }: { where: { user_id: string } }) => {
        const results: Array<
          StoredReport & {
            evidence: StoredEvidence[];
            venue: { id: string; name: string } | null;
            facility: null;
          }
        > = [];
        for (const r of storedReports.values()) {
          if (r.user_id === where.user_id) {
            const evList: StoredEvidence[] = [];
            for (const ev of storedEvidence.values()) {
              if (ev.report_id === r.id) {
                evList.push({ ...ev });
              }
            }
            results.push({
              ...r,
              evidence: evList,
              venue: { id: venueId, name: "Central Campus Center" },
              facility: null,
            });
          }
        }
        return results;
      }),
      count: jest.fn(async ({ where }: { where: { user_id: string } }) => {
        let count = 0;
        for (const r of storedReports.values()) {
          if (r.user_id === where.user_id) count++;
        }
        return count;
      }),
    },
    evidence: {
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; report?: { user_id: string } } }) => {
          const ev = storedEvidence.get(where.id);
          if (!ev) return null;
          const report = storedReports.get(ev.report_id);
          if (!report) return null;
          if (where.report?.user_id && report.user_id !== where.report.user_id) {
            return null;
          }
          return {
            ...ev,
            report: {
              id: report.id,
              user_id: report.user_id,
            },
          };
        },
      ),
      update: jest.fn(
        async ({ where, data }: { where: { id: string }; data: { status: EvidenceStatus } }) => {
          const ev = storedEvidence.get(where.id);
          if (!ev) throw new Error("Evidence not found");
          ev.status = data.status;
          ev.updated_at = new Date();
          return { ...ev };
        },
      ),
      count: jest.fn(
        async ({ where }: { where: { report_id: string; status: { not: EvidenceStatus } } }) => {
          let count = 0;
          for (const ev of storedEvidence.values()) {
            if (ev.report_id === where.report_id && ev.status !== where.status.not) {
              count++;
            }
          }
          return count;
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
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
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
    tokenUser1 = jwtService.sign(
      { sub: user1.id, role: user1.role },
      { secret: process.env.JWT_ACCESS_SECRET },
    );
    tokenUser2 = jwtService.sign(
      { sub: user2.id, role: user2.role },
      { secret: process.env.JWT_ACCESS_SECRET },
    );
    tokenRateLimitUser = jwtService.sign(
      { sub: rateLimitUser.id, role: rateLimitUser.role },
      { secret: process.env.JWT_ACCESS_SECRET },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  let createdReportId: string;
  let createdTrackingCode: string;

  it("1. Create a report returns 201, status SUBMITTED, and a tracking code", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({
        category: "BROKEN_LIFT",
        description: "The primary passenger lift in Building A is out of order.",
        venueId,
        latitude: 12.9716,
        longitude: 77.5946,
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("SUBMITTED");
    expect(res.body.category).toBe("BROKEN_LIFT");
    expect(res.body.tracking_code).toMatch(/^PP-\d{4}-[A-Z0-9]+$/);
    expect(res.body.user_id).toBe(user1.id);

    createdReportId = res.body.id;
    createdTrackingCode = res.body.tracking_code;
  });

  let evidence1Id: string;
  let evidence1Key: string;

  it("2. A reporter can request evidence and receive a presigned PUT URL", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/${createdReportId}/evidence`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({
        contentType: "image/jpeg",
        sizeBytes: 20480,
      })
      .expect(201);

    expect(res.body).toHaveProperty("evidenceId");
    expect(res.body).toHaveProperty("uploadUrl");
    expect(res.body.uploadUrl).toContain("https://s3.local/pathpulse-evidence/");
    expect(res.body.uploadUrl).toContain("mock-put");
    expect(res.body).not.toHaveProperty("objectKey");

    evidence1Id = res.body.evidenceId;
    const record = storedEvidence.get(evidence1Id);
    expect(record).toBeDefined();
    evidence1Key = record!.object_key;
    expect(evidence1Key).toBe(`reports/${createdReportId}/${evidence1Id}.jpg`);
  });

  it("3. Completing evidence with a real uploaded object sets RECEIVED", async () => {
    mockS3Storage.set(evidence1Key, {
      contentLength: 20480,
      contentType: "image/jpeg",
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/evidence/${evidence1Id}/complete`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .expect(200);

    expect(res.body.evidenceId).toBe(evidence1Id);
    expect(res.body.status).toBe("RECEIVED");
    expect(res.body.verified).toBe(true);

    const record = storedEvidence.get(evidence1Id);
    expect(record?.status).toBe("RECEIVED");
  });

  it("4. Completing evidence where the object is missing or size differs sets REJECTED", async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/reports/${createdReportId}/evidence`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({
        contentType: "image/png",
        sizeBytes: 40960,
      })
      .expect(201);

    const evidence2Id = createRes.body.evidenceId;
    const record = storedEvidence.get(evidence2Id);
    const evidence2Key = record!.object_key;

    mockS3Storage.set(evidence2Key, {
      contentLength: 1024,
      contentType: "image/png",
    });

    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/evidence/${evidence2Id}/complete`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .expect(422);

    expect(completeRes.body.message).toContain("verification failed");

    const updatedRecord = storedEvidence.get(evidence2Id);
    expect(updatedRecord?.status).toBe("REJECTED");
    expect(mockStorageService.deleteObject).toHaveBeenCalledWith(evidence2Key);
  });

  it("5. A second user gets 404 for the first user's report", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/reports/${createdReportId}`)
      .set("Authorization", `Bearer ${tokenUser2}`)
      .expect(404);
  });

  it("6. The sixth evidence item is rejected with 400 Bad Request", async () => {
    let activeCount = 0;
    for (const ev of storedEvidence.values()) {
      if (ev.report_id === createdReportId && ev.status !== EvidenceStatus.REJECTED) {
        activeCount++;
      }
    }
    while (activeCount < 5) {
      const evId = randomUUID();
      storedEvidence.set(evId, {
        id: evId,
        report_id: createdReportId,
        object_key: `reports/${createdReportId}/${evId}.jpg`,
        content_type: "image/jpeg",
        size_bytes: 2048,
        status: EvidenceStatus.RECEIVED,
        created_at: new Date(),
        updated_at: new Date(),
      });
      activeCount++;
    }

    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/${createdReportId}/evidence`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({
        contentType: "image/jpeg",
        sizeBytes: 5000,
      })
      .expect(400);

    expect(res.body.message).toContain("Maximum 5 evidence items");
  });

  it("7. Repeated report submissions beyond the rate limit return 429", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${tokenRateLimitUser}`)
        .send({
          category: "BLOCKED_RAMP",
          description: `Blocked ramp report number ${i + 1} submission.`,
          venueId,
        })
        .expect(201);
    }

    const throttledRes = await request(app.getHttpServer())
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${tokenRateLimitUser}`)
      .send({
        category: "BLOCKED_RAMP",
        description: "Exceeded submissions limit test payload.",
        venueId,
      })
      .expect(429);

    expect(throttledRes.body.statusCode).toBe(429);
  });

  it("8. Responses never contain a public URL or raw object key for non-admins", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/${createdReportId}`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .expect(200);

    expect(res.body.id).toBe(createdReportId);
    expect(res.body.tracking_code).toBe(createdTrackingCode);

    for (const ev of res.body.evidence) {
      expect(ev).not.toHaveProperty("object_key");
      expect(ev).not.toHaveProperty("objectKey");
      expect(ev).not.toHaveProperty("presigned_url");
      expect(ev).not.toHaveProperty("presignedUrl");
      expect(ev).not.toHaveProperty("url");
    }

    const jsonString = JSON.stringify(res.body);
    expect(jsonString).not.toContain("reports/");
    expect(jsonString).not.toContain("https://s3.");
  });
});
