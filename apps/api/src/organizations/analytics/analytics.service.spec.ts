import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let mockPrisma: {
    organization: { findUnique: jest.Mock };
    organizationMember: { findUnique: jest.Mock };
    $queryRaw: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: "org-1" }),
      },
      organizationMember: {
        findUnique: jest.fn().mockResolvedValue({
          id: "mem-1",
          organization_id: "org-1",
          user_id: "admin-1",
          role: UserRole.ORGANIZATION_ADMIN,
        }),
      },
      $queryRaw: jest.fn(),
    };

    service = new AnalyticsService(mockPrisma as unknown as PrismaService);
  });

  it("should calculate metrics matching hand-calculated fixture values", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ coverage: 80.0 }])
      .mockResolvedValueOnce([{ count: 5 }])
      .mockResolvedValueOnce([{ count: 12 }])
      .mockResolvedValueOnce([{ count: 4 }]);

    const result = await service.getDashboardMetrics(
      "org-1",
      "admin-1",
      UserRole.ORGANIZATION_ADMIN,
    );

    expect(result.verifiedRouteCoverage).toBe(80.0);
    expect(result.pendingIssues).toBe(5);
    expect(result.verifiedFacilities).toBe(12);
    expect(result.resolvedReports).toBe(4);
    expect(result.generatedAt).toBeDefined();
    expect(new Date(result.generatedAt).getTime()).not.toBeNaN();
  });

  it("should handle default 100% coverage when an organization has zero edges", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ coverage: 100.0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }]);

    const result = await service.getDashboardMetrics(
      "org-1",
      "admin-1",
      UserRole.ORGANIZATION_ADMIN,
    );

    expect(result.verifiedRouteCoverage).toBe(100.0);
    expect(result.pendingIssues).toBe(0);
    expect(result.verifiedFacilities).toBe(0);
    expect(result.resolvedReports).toBe(0);
  });

  it("should allow SUPER_ADMIN even without an organization membership row", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ coverage: 95.5 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([{ count: 20 }])
      .mockResolvedValueOnce([{ count: 7 }]);

    const result = await service.getDashboardMetrics(
      "org-1",
      "super-admin-id",
      UserRole.SUPER_ADMIN,
    );

    expect(result.verifiedRouteCoverage).toBe(95.5);
    expect(mockPrisma.organizationMember.findUnique).not.toHaveBeenCalled();
  });

  it("should throw NotFoundException if organization does not exist", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      service.getDashboardMetrics("non-existent-org", "admin-1", UserRole.ORGANIZATION_ADMIN),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw ForbiddenException if user is not a member of the organization", async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    await expect(
      service.getDashboardMetrics("org-1", "stranger-user", UserRole.ORGANIZATION_ADMIN),
    ).rejects.toThrow(ForbiddenException);
  });
});
