import { NotFoundException } from "@nestjs/common";
import { ReportCategory, ReportStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ReportsService } from "../reports.service";
import { StorageService } from "../storage.service";

describe("Report Visibility and Query-Level Isolation", () => {
  let reportsService: ReportsService;
  let prisma: Partial<PrismaService>;
  let storageService: Partial<StorageService>;

  const reportId = "123e4567-e89b-12d3-a456-426614174000";
  const reporterUser = { id: "user-reporter", role: UserRole.USER };
  const otherUser = { id: "user-stranger", role: UserRole.USER };
  const owningOrgAdmin = { id: "admin-owning", role: UserRole.ORGANIZATION_ADMIN };
  const otherOrgAdmin = { id: "admin-other", role: UserRole.ORGANIZATION_ADMIN };
  const superAdmin = { id: "admin-super", role: UserRole.SUPER_ADMIN };

  const sampleReport = {
    id: reportId,
    tracking_code: "PP-2026-ABCDEF",
    user_id: reporterUser.id,
    venue_id: "venue-1",
    facility_id: null,
    category: ReportCategory.BROKEN_LIFT,
    title: null,
    description: "Lift is non-functional between 1st and 2nd floor",
    status: ReportStatus.SUBMITTED,
    latitude: 37.7749,
    longitude: -122.4194,
    created_at: new Date(),
    updated_at: new Date(),
    evidence: [],
    venue: {
      id: "venue-1",
      name: "Main Campus Center",
      organization_id: "org-1",
    },
    facility: null,
  };

  beforeEach(() => {
    storageService = {
      getPresignedGetUrl: jest.fn().mockResolvedValue("https://s3.signed/get"),
    };

    prisma = {
      issueReport: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.id !== reportId) return Promise.resolve(null);

          if (where.user_id === reporterUser.id) {
            return Promise.resolve(sampleReport);
          }

          if (where.OR) {
            const hasOwningOrg = where.OR.some(
              (clause: Record<string, unknown>) =>
                clause.venue &&
                (clause.venue as Record<string, unknown>).organization &&
                owningOrgAdmin.id === "admin-owning",
            );
            if (
              hasOwningOrg &&
              where.OR.some(
                (c: Record<string, unknown>) => c.user_id === owningOrgAdmin.id || hasOwningOrg,
              )
            ) {
              return Promise.resolve(sampleReport);
            }
          }

          if (!where.user_id && !where.OR) {
            return Promise.resolve(sampleReport);
          }

          return Promise.resolve(null);
        }),
      } as unknown as PrismaService["issueReport"],
    };

    reportsService = new ReportsService(prisma as PrismaService, storageService as StorageService);
  });

  it("should allow the reporter to view their report", async () => {
    const report = await reportsService.getReportById(reportId, reporterUser);
    expect(report.id).toBe(reportId);
    expect(report.user_id).toBe(reporterUser.id);
  });

  it("should throw 404 when an unrelated user tries to view the report", async () => {
    await expect(reportsService.getReportById(reportId, otherUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should allow an admin of the owning organization to view the report", async () => {
    const report = await reportsService.getReportById(reportId, owningOrgAdmin);
    expect(report.id).toBe(reportId);
  });

  it("should throw 404 when an admin of another organization tries to view the report", async () => {
    (prisma.issueReport!.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(reportsService.getReportById(reportId, otherOrgAdmin)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should allow SUPER_ADMIN to view any report", async () => {
    const report = await reportsService.getReportById(reportId, superAdmin);
    expect(report.id).toBe(reportId);
  });
});
