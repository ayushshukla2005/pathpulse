import { getQueueToken } from "@nestjs/bullmq";
import { INestApplication, NotFoundException, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { EvidenceStatus, ReportCategory, ReportStatus, UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";
import { NotificationsProcessor } from "../src/notifications/notifications.processor";
import { NotificationsService } from "../src/notifications/notifications.service";
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
  assigned_to_user_id: string | null;
  verified_by_user_id: string | null;
  resolved_at: Date | null;
  reopen_count: number;
  created_at: Date;
  updated_at: Date;
}

interface StoredAudit {
  id: string;
  actor_user_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  venue_id: string | null;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  changes: unknown;
  created_at: Date;
}

interface StoredNotification {
  id: string;
  user_id: string;
  report_id: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: Date | null;
  created_at: Date;
}

describe("Report Verification Workflow, Audit Log, and Notifications (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const reporterUser = { id: "user-reporter", role: UserRole.USER };
  const moderatorUser = { id: "user-moderator", role: UserRole.MODERATOR };
  const secondModeratorUser = { id: "user-mod-2", role: UserRole.MODERATOR };
  const orgAdminUser = { id: "user-org-admin", role: UserRole.ORGANIZATION_ADMIN };
  const assigneeWorker = { id: "user-worker-1", role: UserRole.USER };
  const outsideUser = { id: "user-outsider", role: UserRole.USER };

  const organizationId = "org-main-campus";
  const venueId = "venue-main-hall";

  let tokenReporter: string;
  let tokenModerator: string;
  let tokenSecondModerator: string;
  let tokenOrgAdmin: string;

  const storedReports: Map<string, StoredReport> = new Map();
  const storedAudits: StoredAudit[] = [];
  const storedNotifications: Map<string, StoredNotification> = new Map();
  const storedEvidence: Map<string, { id: string; report_id: string; status: EvidenceStatus }> =
    new Map();
  const enqueuedNotificationJobs: Array<{ reportId: string; toStatus: string }> = [];

  const mockStorageService = {
    getPresignedPutUrl: jest.fn().mockResolvedValue("https://s3.local/put"),
    getPresignedGetUrl: jest.fn().mockResolvedValue("https://s3.local/get"),
    headObject: jest.fn().mockResolvedValue({ contentLength: 1000, contentType: "image/jpeg" }),
    deleteObject: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $queryRaw: jest.fn(async () => {
          return [];
        }),
        issueReport: {
          findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
            const r = storedReports.get(where.id);
            return r ? { ...r } : null;
          }),
          update: jest.fn(
            async ({
              where,
              data,
            }: {
              where: { id: string };
              data: {
                status?: ReportStatus;
                verified_by?: { connect?: { id?: string } };
                assigned_to?: { connect?: { id?: string } };
                resolved_at?: Date | null;
                reopen_count?: { increment?: number };
              };
            }) => {
              const r = storedReports.get(where.id);
              if (!r) throw new Error("Report not found");
              const updated: StoredReport = {
                ...r,
                status: data.status ?? r.status,
                verified_by_user_id: data.verified_by?.connect?.id ?? r.verified_by_user_id,
                assigned_to_user_id: data.assigned_to?.connect?.id ?? r.assigned_to_user_id,
                resolved_at: data.resolved_at !== undefined ? data.resolved_at : r.resolved_at,
                reopen_count: data.reopen_count?.increment
                  ? r.reopen_count + data.reopen_count.increment
                  : r.reopen_count,
                updated_at: new Date(),
              };
              storedReports.set(where.id, updated);
              return updated;
            },
          ),
        },
        venue: {
          findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
            if (where.id === venueId) {
              return { id: venueId, organization_id: organizationId };
            }
            return null;
          }),
        },
        organizationMember: {
          findFirst: jest.fn(
            async ({ where }: { where: { organization_id: string; user_id: string } }) => {
              if (
                where.organization_id === organizationId &&
                (where.user_id === orgAdminUser.id || where.user_id === assigneeWorker.id)
              ) {
                return {
                  id: "member-1",
                  organization_id: organizationId,
                  user_id: where.user_id,
                  role: UserRole.ORGANIZATION_ADMIN,
                };
              }
              return null;
            },
          ),
        },
        evidence: {
          count: jest.fn(async ({ where }: { where: { report_id: string; status: string } }) => {
            let count = 0;
            for (const ev of storedEvidence.values()) {
              if (ev.report_id === where.report_id && ev.status === where.status) {
                count++;
              }
            }
            return count;
          }),
        },
        auditLog: {
          findFirst: jest.fn(
            async ({ where }: { where: { entity_id: string; action: string } }) => {
              for (let i = storedAudits.length - 1; i >= 0; i--) {
                const a = storedAudits[i];
                if (a && a.entity_id === where.entity_id && a.action === where.action) {
                  return a;
                }
              }
              return null;
            },
          ),
          create: jest.fn(async ({ data }: { data: Omit<StoredAudit, "id" | "created_at"> }) => {
            const audit: StoredAudit = {
              ...data,
              id: randomUUID(),
              created_at: new Date(),
            };
            storedAudits.push(audit);
            return audit;
          }),
        },
        maintenanceTask: {
          create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
            return {
              id: randomUUID(),
              ...data,
              created_at: new Date(),
              updated_at: new Date(),
            };
          }),
        },
      };
      return cb(tx);
    }),
    issueReport: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const r = storedReports.get(where.id);
        return r ? { ...r } : null;
      }),
      findMany: jest.fn(async () => {
        return Array.from(storedReports.values());
      }),
    },
    venue: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === venueId) {
          return { id: venueId, organization_id: organizationId };
        }
        return null;
      }),
    },
    organizationMember: {
      findFirst: jest.fn(
        async ({ where }: { where: { organization_id: string; user_id: string } }) => {
          if (where.organization_id === organizationId && where.user_id === orgAdminUser.id) {
            return {
              id: "member-1",
              organization_id: organizationId,
              user_id: where.user_id,
              role: UserRole.ORGANIZATION_ADMIN,
            };
          }
          return null;
        },
      ),
    },
    evidence: {
      count: jest.fn(async ({ where }: { where: { report_id: string; status: string } }) => {
        let count = 0;
        for (const ev of storedEvidence.values()) {
          if (ev.report_id === where.report_id && ev.status === where.status) {
            count++;
          }
        }
        return count;
      }),
    },
    auditLog: {
      findFirst: jest.fn(async ({ where }: { where: { entity_id: string; action: string } }) => {
        for (let i = storedAudits.length - 1; i >= 0; i--) {
          const a = storedAudits[i];
          if (a && a.entity_id === where.entity_id && a.action === where.action) {
            return a;
          }
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }: { where: { entity_id: string } }) => {
        return storedAudits
          .filter((a) => a.entity_id === where.entity_id)
          .map((a) => ({
            ...a,
            user: { id: a.actor_user_id, name: "Test Actor", email: "actor@pathpulse.local" },
          }));
      }),
    },
    notification: {
      findMany: jest.fn(async ({ where }: { where: { user_id: string } }) => {
        return Array.from(storedNotifications.values())
          .filter((n) => n.user_id === where.user_id)
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      }),
      count: jest.fn(async ({ where }: { where: { user_id: string; read_at: null } }) => {
        return Array.from(storedNotifications.values()).filter(
          (n) => n.user_id === where.user_id && n.read_at === null,
        ).length;
      }),
      findFirst: jest.fn(async ({ where }: { where: { id: string; user_id: string } }) => {
        const n = storedNotifications.get(where.id);
        if (n && n.user_id === where.user_id) {
          return { ...n };
        }
        return null;
      }),
      update: jest.fn(
        async ({ where, data }: { where: { id: string }; data: { read_at: Date | null } }) => {
          const n = storedNotifications.get(where.id);
          if (!n) throw new Error("Not found");
          const updated = { ...n, read_at: data.read_at };
          storedNotifications.set(where.id, updated);
          return updated;
        },
      ),
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            user_id: string;
            report_id?: string | null;
            type: string;
            title: string;
            message: string;
            link?: string | null;
          };
        }) => {
          const id = randomUUID();
          const record: StoredNotification = {
            id,
            ...data,
            report_id: data.report_id ?? null,
            link: data.link ?? null,
            read_at: null,
            created_at: new Date(),
          };
          storedNotifications.set(id, record);
          return record;
        },
      ),
    },
  };

  const mockNotificationsService = {
    enqueueReportNotification: jest.fn(
      async (jobData: {
        reportId: string;
        reporterId: string;
        trackingCode: string;
        toStatus: string;
      }) => {
        enqueuedNotificationJobs.push(jobData);
        await mockPrisma.notification.create({
          data: {
            user_id: jobData.reporterId,
            report_id: jobData.reportId,
            type: `REPORT_${jobData.toStatus}`,
            title: `Report ${jobData.toStatus}`,
            message: `Your report ${jobData.trackingCode} is now ${jobData.toStatus}.`,
            link: `/reports/${jobData.reportId}`,
          },
        });
      },
    ),
    getNotificationsForUser: jest.fn(async (userId: string) => {
      const rows = await mockPrisma.notification.findMany({ where: { user_id: userId } });
      const unreadCount = await mockPrisma.notification.count({
        where: { user_id: userId, read_at: null },
      });
      return {
        items: rows.map((r: StoredNotification) => ({
          id: r.id,
          reportId: r.report_id,
          type: r.type,
          title: r.title,
          message: r.message,
          link: r.link,
          readAt: r.read_at ? r.read_at.toISOString() : null,
          createdAt: r.created_at.toISOString(),
        })),
        unreadCount,
      };
    }),
    markAsRead: jest.fn(async (id: string, userId: string) => {
      const existing = await mockPrisma.notification.findFirst({ where: { id, user_id: userId } });
      if (!existing) {
        throw new NotFoundException("Notification not found");
      }
      const updated = await mockPrisma.notification.update({
        where: { id },
        data: { read_at: new Date() },
      });
      return {
        id: updated.id,
        reportId: updated.report_id,
        type: updated.type,
        title: updated.title,
        message: updated.message,
        link: updated.link,
        readAt: updated.read_at.toISOString(),
        createdAt: updated.created_at.toISOString(),
      };
    }),
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET = "test_access_secret_longer_than_32_characters_ok";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_longer_than_32_characters_ok";
    process.env.REDIS_URL = "redis://localhost:6379";

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideProvider(NotificationsService)
      .useValue(mockNotificationsService)
      .overrideProvider(NotificationsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(getQueueToken("report-notifications"))
      .useValue({
        add: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
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

    jwtService = moduleRef.get(JwtService);

    const secret = process.env.JWT_ACCESS_SECRET;
    tokenReporter = jwtService.sign(
      {
        sub: reporterUser.id,
        email: "reporter@pathpulse.local",
        role: reporterUser.role,
      },
      { secret },
    );
    tokenModerator = jwtService.sign(
      {
        sub: moderatorUser.id,
        email: "moderator@pathpulse.local",
        role: moderatorUser.role,
      },
      { secret },
    );
    tokenSecondModerator = jwtService.sign(
      {
        sub: secondModeratorUser.id,
        email: "mod2@pathpulse.local",
        role: secondModeratorUser.role,
      },
      { secret },
    );
    tokenOrgAdmin = jwtService.sign(
      {
        sub: orgAdminUser.id,
        email: "admin@org.local",
        role: orgAdminUser.role,
      },
      { secret },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    storedReports.clear();
    storedAudits.length = 0;
    storedNotifications.clear();
    storedEvidence.clear();
    enqueuedNotificationJobs.length = 0;
  });

  function seedTestReport(status: ReportStatus = ReportStatus.SUBMITTED): StoredReport {
    const report: StoredReport = {
      id: "report-alpha",
      tracking_code: "REP-20261108-AAA1",
      user_id: reporterUser.id,
      venue_id: venueId,
      facility_id: "fac-elev-1",
      category: ReportCategory.BROKEN_LIFT,
      title: "Broken elevator at east corridor",
      description: "Lift is completely non-operational and display is blank",
      status,
      assigned_to_user_id: null,
      verified_by_user_id: null,
      resolved_at: null,
      reopen_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    storedReports.set(report.id, report);
    return report;
  }

  test("Moderator reviews submitted report (SUBMITTED -> UNDER_REVIEW)", async () => {
    seedTestReport(ReportStatus.SUBMITTED);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/review")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(200);

    expect(res.body.status).toBe("UNDER_REVIEW");
    expect(res.body.allowedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "VERIFY" }),
        expect.objectContaining({ action: "REJECT" }),
      ]),
    );

    expect(storedAudits).toHaveLength(1);
    expect(storedAudits[0]?.action).toBe("REVIEW");
    expect(storedAudits[0]?.to_status).toBe("UNDER_REVIEW");
    expect(enqueuedNotificationJobs).toHaveLength(1);
    expect(enqueuedNotificationJobs[0]?.toStatus).toBe("UNDER_REVIEW");
  });

  test("Reporter cannot verify their own report (403 Forbidden)", async () => {
    seedTestReport(ReportStatus.UNDER_REVIEW);

    const tokenReporterAsMod = jwtService.sign(
      {
        sub: reporterUser.id,
        email: "reporter@pathpulse.local",
        role: UserRole.MODERATOR,
      },
      { secret: process.env.JWT_ACCESS_SECRET },
    );

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/verify")
      .set("Authorization", `Bearer ${tokenReporterAsMod}`)
      .expect(403);

    expect(res.body.message).toContain("cannot verify");
  });

  test("Independent moderator verifies barrier (UNDER_REVIEW -> VERIFIED)", async () => {
    seedTestReport(ReportStatus.UNDER_REVIEW);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/verify")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(200);

    expect(res.body.status).toBe("VERIFIED");
    expect(res.body.verifiedByUserId).toBe(moderatorUser.id);
  });

  test("Moderator rejects report with reason (UNDER_REVIEW -> REJECTED)", async () => {
    seedTestReport(ReportStatus.UNDER_REVIEW);

    await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/reject")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .send({})
      .expect(400);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/reject")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .send({ reason: "Duplicate report already filed" })
      .expect(200);

    expect(res.body.status).toBe("REJECTED");
    expect(storedAudits[storedAudits.length - 1]?.reason).toBe("Duplicate report already filed");
  });

  test("Owning org admin assigns report and creates maintenance task (VERIFIED -> ASSIGNED)", async () => {
    seedTestReport(ReportStatus.VERIFIED);

    await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/assign")
      .set("Authorization", `Bearer ${tokenOrgAdmin}`)
      .send({ assignedToUserId: outsideUser.id })
      .expect(403);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/assign")
      .set("Authorization", `Bearer ${tokenOrgAdmin}`)
      .send({ assignedToUserId: assigneeWorker.id })
      .expect(200);

    expect(res.body.status).toBe("ASSIGNED");
    expect(res.body.assignedToUserId).toBe(assigneeWorker.id);
  });

  test("Submit resolution requires evidence (422 Unprocessable Entity)", async () => {
    seedTestReport(ReportStatus.ASSIGNED);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/resolution")
      .set("Authorization", `Bearer ${tokenOrgAdmin}`)
      .expect(422);

    expect(res.body.message).toContain("evidence");
  });

  test("Submit resolution succeeds when received evidence exists", async () => {
    seedTestReport(ReportStatus.ASSIGNED);

    storedEvidence.set("ev-1", {
      id: "ev-1",
      report_id: "report-alpha",
      status: EvidenceStatus.RECEIVED,
    });

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/resolution")
      .set("Authorization", `Bearer ${tokenOrgAdmin}`)
      .expect(200);

    expect(res.body.status).toBe("RESOLUTION_SUBMITTED");
  });

  test("Enforces separation of duties on confirming resolution (403 Forbidden)", async () => {
    seedTestReport(ReportStatus.RESOLUTION_SUBMITTED);

    storedAudits.push({
      id: randomUUID(),
      actor_user_id: moderatorUser.id,
      user_id: moderatorUser.id,
      action: "SUBMIT_RESOLUTION",
      entity_type: "ISSUE_REPORT",
      entity_id: "report-alpha",
      venue_id: venueId,
      from_status: "ASSIGNED",
      to_status: "RESOLUTION_SUBMITTED",
      reason: null,
      changes: {},
      created_at: new Date(),
    });

    const sameUserRes = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/confirm-resolution")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(403);

    expect(sameUserRes.body.message).toContain("submitted resolution cannot confirm");

    const independentRes = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/confirm-resolution")
      .set("Authorization", `Bearer ${tokenSecondModerator}`)
      .expect(200);

    expect(independentRes.body.status).toBe("CLOSED");
  });

  test("Reopen requires reason and increments reopen count", async () => {
    seedTestReport(ReportStatus.RESOLUTION_SUBMITTED);

    await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/reopen")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .send({ reason: "   " })
      .expect(422);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/reopen")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .send({ reason: "Barrier remains blocked according to new photograph" })
      .expect(200);

    expect(res.body.status).toBe("REOPENED");
    expect(res.body.reopenCount).toBe(1);
  });

  test("Returns 409 Conflict for invalid transition", async () => {
    seedTestReport(ReportStatus.SUBMITTED);

    const res = await request(app.getHttpServer())
      .post("/api/v1/reports/report-alpha/confirm-resolution")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(409);

    expect(res.body.message).toContain("not valid");
  });

  test("Fetches chronological audit history", async () => {
    seedTestReport(ReportStatus.SUBMITTED);

    storedAudits.push({
      id: "audit-1",
      actor_user_id: moderatorUser.id,
      user_id: moderatorUser.id,
      action: "REVIEW",
      entity_type: "ISSUE_REPORT",
      entity_id: "report-alpha",
      venue_id: venueId,
      from_status: "SUBMITTED",
      to_status: "UNDER_REVIEW",
      reason: null,
      changes: {},
      created_at: new Date("2026-11-08T10:00:00Z"),
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/reports/report-alpha/audit")
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]?.action).toBe("REVIEW");
    expect(res.body[0]?.toStatus).toBe("UNDER_REVIEW");
  });

  test("Suggests duplicate candidates without auto-merging", async () => {
    const target = seedTestReport(ReportStatus.UNDER_REVIEW);

    const duplicate: StoredReport = {
      id: "report-beta",
      tracking_code: "REP-20261108-BBB2",
      user_id: "user-other",
      venue_id: venueId,
      facility_id: "fac-elev-1",
      category: ReportCategory.BROKEN_LIFT,
      title: "Broken elevator at east corridor",
      description: "Lift is non-operational and display is blank",
      status: ReportStatus.SUBMITTED,
      assigned_to_user_id: null,
      verified_by_user_id: null,
      resolved_at: null,
      reopen_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    storedReports.set(duplicate.id, duplicate);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/${target.id}/duplicates`)
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]?.candidateId).toBe("report-beta");
    expect(res.body[0]?.similarity).toBeGreaterThanOrEqual(0.5);

    expect(storedReports.get("report-beta")?.status).toBe(ReportStatus.SUBMITTED);
  });

  test("Notifications: list own notifications and mark as read", async () => {
    const notifId = randomUUID();
    storedNotifications.set(notifId, {
      id: notifId,
      user_id: reporterUser.id,
      report_id: "report-alpha",
      type: "REPORT_VERIFIED",
      title: "Report Verified",
      message: "Your report REP-20261108-AAA1 has been verified.",
      link: "/reports/report-alpha",
      read_at: null,
      created_at: new Date(),
    });

    const listRes = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${tokenReporter}`)
      .expect(200);

    expect(listRes.body.unreadCount).toBe(1);
    expect(listRes.body.items).toHaveLength(1);
    expect(listRes.body.items[0]?.id).toBe(notifId);

    const readRes = await request(app.getHttpServer())
      .post(`/api/v1/notifications/${notifId}/read`)
      .set("Authorization", `Bearer ${tokenReporter}`)
      .expect(200);

    expect(readRes.body.readAt).not.toBeNull();

    await request(app.getHttpServer())
      .post(`/api/v1/notifications/${notifId}/read`)
      .set("Authorization", `Bearer ${tokenModerator}`)
      .expect(404);
  });
});
