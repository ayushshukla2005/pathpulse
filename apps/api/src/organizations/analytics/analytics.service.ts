import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export interface DashboardMetricsResult {
  verifiedRouteCoverage: number;
  pendingIssues: number;
  verifiedFacilities: number;
  resolvedReports: number;
  generatedAt: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(
    orgId: string,
    actorId: string,
    actorRole: UserRole,
  ): Promise<DashboardMetricsResult> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }

    if (actorRole !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: actorId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException("You do not have access to this organization");
      }
    }

    const [coverageRows, pendingRows, verifiedRows, resolvedRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ coverage: number | string }>>`
        SELECT COALESCE(
          ROUND(
            (COUNT(CASE WHEN me.verification_level = 'CONFIRMED' AND me.operational_status = 'OPERATIONAL' THEN 1 END)::numeric /
             NULLIF(COUNT(me.id), 0)::numeric) * 100,
            1
          ),
          100.0
        )::float AS coverage
        FROM map_edges me
        JOIN buildings b ON me.building_id = b.id
        JOIN venues v ON b.venue_id = v.id
        WHERE v.organization_id = ${orgId}
      `,
      this.prisma.$queryRaw<Array<{ count: number | bigint | string }>>`
        SELECT COUNT(*)::int AS count
        FROM issue_reports ir
        JOIN venues v ON ir.venue_id = v.id
        WHERE v.organization_id = ${orgId}
          AND ir.status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLUTION_SUBMITTED', 'REOPENED')
      `,
      this.prisma.$queryRaw<Array<{ count: number | bigint | string }>>`
        SELECT COUNT(*)::int AS count
        FROM facilities f
        JOIN venues v ON f.venue_id = v.id
        WHERE v.organization_id = ${orgId}
          AND f.verification_level = 'CONFIRMED'
      `,
      this.prisma.$queryRaw<Array<{ count: number | bigint | string }>>`
        SELECT COUNT(*)::int AS count
        FROM issue_reports ir
        JOIN venues v ON ir.venue_id = v.id
        WHERE v.organization_id = ${orgId}
          AND ir.status = 'CLOSED'
          AND ir.resolved_at >= NOW() - INTERVAL '30 days'
      `,
    ]);

    const firstCoverage = coverageRows?.[0];
    const firstPending = pendingRows?.[0];
    const firstVerified = verifiedRows?.[0];
    const firstResolved = resolvedRows?.[0];

    const verifiedRouteCoverage =
      firstCoverage !== undefined && firstCoverage !== null
        ? Number(firstCoverage.coverage)
        : 100.0;
    const pendingIssues =
      firstPending !== undefined && firstPending !== null ? Number(firstPending.count) : 0;
    const verifiedFacilities =
      firstVerified !== undefined && firstVerified !== null ? Number(firstVerified.count) : 0;
    const resolvedReports =
      firstResolved !== undefined && firstResolved !== null ? Number(firstResolved.count) : 0;

    return {
      verifiedRouteCoverage,
      pendingIssues,
      verifiedFacilities,
      resolvedReports,
      generatedAt: new Date().toISOString(),
    };
  }
}
