import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { DuplicateSuggestion, findDuplicateCandidates } from "../duplicates/duplicate-detector";
import { getAllowedActions, transitionReportState } from "./state-machine";
import {
  ReportCategory,
  ReportStatus,
  ReportWorkflowSummary,
  UserRole,
  WorkflowAction,
} from "./types";

interface LockedReportRow {
  id: string;
  tracking_code: string;
  user_id: string;
  venue_id: string | null;
  facility_id: string | null;
  category: string;
  status: string;
  assigned_to_user_id: string | null;
  verified_by_user_id: string | null;
  resolved_at: Date | null;
  reopen_count: number;
}

export interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  createdAt: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async executeTransition(
    reportId: string,
    action: WorkflowAction,
    user: AuthenticatedUser,
    payload?: { reason?: string; assignedToUserId?: string },
  ): Promise<ReportWorkflowSummary> {
    if (user.role === "USER") {
      throw new ForbiddenException("Standard users cannot perform workflow actions");
    }

    const {
      lockedReport,
      transitionResult,
      isMemberOfOwningOrg,
      resolutionSubmittedByUserId,
      receivedEvidenceCount,
    } = await this.prisma.$transaction(async (tx) => {
      let locked: LockedReportRow | null = null;
      try {
        const rows = await tx.$queryRaw<LockedReportRow[]>(
          Prisma.sql`SELECT id, tracking_code, user_id, venue_id, facility_id, category, status, assigned_to_user_id, verified_by_user_id, resolved_at, reopen_count FROM issue_reports WHERE id = ${reportId} FOR UPDATE`,
        );
        if (Array.isArray(rows) && rows.length > 0) {
          locked = rows[0] ?? null;
        }
      } catch (_err) {
        void _err;
      }

      if (!locked) {
        locked = await tx.issueReport.findUnique({
          where: { id: reportId },
        });
      }

      if (!locked) {
        throw new NotFoundException("Report not found");
      }

      let organizationId: string | null = null;
      let isMember = false;

      if (locked.venue_id) {
        const venue = await tx.venue.findUnique({
          where: { id: locked.venue_id },
          select: { organization_id: true },
        });
        organizationId = venue?.organization_id ?? null;

        if (organizationId) {
          if (user.role === "SUPER_ADMIN") {
            isMember = true;
          } else {
            const membership = await tx.organizationMember.findFirst({
              where: {
                organization_id: organizationId,
                user_id: user.id,
                role: "ORGANIZATION_ADMIN",
              },
            });
            isMember = Boolean(membership);
          }
        }
      } else if (user.role === "SUPER_ADMIN") {
        isMember = true;
      }

      let assigneeIsMember = false;
      if (payload?.assignedToUserId && organizationId) {
        const assigneeMembership = await tx.organizationMember.findFirst({
          where: {
            organization_id: organizationId,
            user_id: payload.assignedToUserId,
          },
        });
        assigneeIsMember = Boolean(assigneeMembership);
      }

      const receivedEvidence = await tx.evidence.count({
        where: {
          report_id: reportId,
          status: "RECEIVED",
        },
      });

      const lastResolutionAudit = await tx.auditLog.findFirst({
        where: {
          entity_id: reportId,
          action: "SUBMIT_RESOLUTION",
        },
        orderBy: { created_at: "desc" },
      });
      const resSubmitter = lastResolutionAudit?.actor_user_id ?? null;

      const result = transitionReportState({
        actorId: user.id,
        actorRole: user.role as UserRole,
        isMemberOfOwningOrg: isMember,
        currentState: locked.status as ReportStatus,
        action,
        facts: {
          reporterId: locked.user_id,
          resolutionSubmittedByUserId: resSubmitter,
          assigneeIsMember: payload?.assignedToUserId ? assigneeIsMember : true,
          receivedEvidenceCount: receivedEvidence,
          reason: payload?.reason,
        },
      });

      if (!result.success) {
        switch (result.error) {
          case "INVALID_TRANSITION":
            throw new ConflictException(result.message);
          case "FORBIDDEN_ROLE":
          case "SELF_ACTION_FORBIDDEN":
          case "SEPARATION_OF_DUTIES":
            throw new ForbiddenException(result.message);
          case "REASON_REQUIRED":
          case "EVIDENCE_REQUIRED":
            throw new UnprocessableEntityException(result.message);
        }
      }

      const updateData: Prisma.IssueReportUpdateInput = {
        status: result.toStatus,
      };

      if (action === "VERIFY") {
        updateData.verified_by = { connect: { id: user.id } };
      }
      if (action === "ASSIGN" && payload?.assignedToUserId) {
        updateData.assigned_to = { connect: { id: payload.assignedToUserId } };
      }
      if (action === "SUBMIT_RESOLUTION") {
        updateData.resolved_at = new Date();
      }
      if (result.shouldIncrementReopenCount) {
        updateData.reopen_count = { increment: 1 };
      }

      await tx.issueReport.update({
        where: { id: reportId },
        data: updateData,
      });

      if (action === "ASSIGN" && organizationId) {
        await tx.maintenanceTask.create({
          data: {
            report_id: reportId,
            organization_id: organizationId,
            assigned_to_id: payload?.assignedToUserId,
            status: "ASSIGNED",
            priority: "MEDIUM",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actor_user_id: user.id,
          user_id: user.id,
          action,
          entity_type: "ISSUE_REPORT",
          entity_id: reportId,
          venue_id: locked.venue_id,
          from_status: result.fromStatus,
          to_status: result.toStatus,
          reason: payload?.reason ?? null,
          changes: {
            action,
            fromStatus: result.fromStatus,
            toStatus: result.toStatus,
          },
        },
      });

      return {
        lockedReport: locked,
        transitionResult: result,
        isMemberOfOwningOrg: isMember,
        resolutionSubmittedByUserId: resSubmitter,
        receivedEvidenceCount: receivedEvidence,
      };
    });

    await this.notificationsService.enqueueReportNotification({
      reportId,
      reporterId: lockedReport.user_id,
      trackingCode: lockedReport.tracking_code,
      fromStatus: transitionResult.fromStatus,
      toStatus: transitionResult.toStatus,
      action,
      reason: payload?.reason,
    });

    const refreshed = await this.prisma.issueReport.findUnique({
      where: { id: reportId },
    });

    if (!refreshed) {
      throw new NotFoundException("Report not found");
    }

    const allowedActions = getAllowedActions(
      {
        id: refreshed.id,
        trackingCode: refreshed.tracking_code,
        status: refreshed.status as ReportStatus,
        category: refreshed.category as ReportCategory,
        reporterId: refreshed.user_id,
        assignedToUserId: refreshed.assigned_to_user_id,
        verifiedByUserId: refreshed.verified_by_user_id,
        resolutionSubmittedByUserId,
        reopenCount: refreshed.reopen_count,
        resolvedAt: refreshed.resolved_at,
        receivedEvidenceCount,
      },
      user.id,
      user.role as UserRole,
      isMemberOfOwningOrg,
    );

    return {
      id: refreshed.id,
      trackingCode: refreshed.tracking_code,
      status: refreshed.status as ReportStatus,
      category: refreshed.category as ReportCategory,
      reopenCount: refreshed.reopen_count,
      assignedToUserId: refreshed.assigned_to_user_id,
      verifiedByUserId: refreshed.verified_by_user_id,
      resolvedAt: refreshed.resolved_at ? refreshed.resolved_at.toISOString() : null,
      allowedActions,
    };
  }

  async getAuditHistory(reportId: string, user: AuthenticatedUser): Promise<AuditLogItem[]> {
    const report = await this.prisma.issueReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (user.role === "USER") {
      throw new ForbiddenException("Standard users cannot view audit history");
    }

    if (user.role === "ORGANIZATION_ADMIN") {
      if (!report.venue_id) {
        throw new ForbiddenException("Report has no owning venue");
      }
      const venue = await this.prisma.venue.findUnique({
        where: { id: report.venue_id },
        select: { organization_id: true },
      });
      if (!venue || !venue.organization_id) {
        throw new ForbiddenException("Venue has no associated organization");
      }
      const membership = await this.prisma.organizationMember.findFirst({
        where: {
          organization_id: venue.organization_id,
          user_id: user.id,
          role: "ORGANIZATION_ADMIN",
        },
      });
      if (!membership) {
        throw new ForbiddenException("Not authorized to view audit history for this organization");
      }
    }

    const rows = await this.prisma.auditLog.findMany({
      where: {
        entity_type: "ISSUE_REPORT",
        entity_id: reportId,
      },
      orderBy: { created_at: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      actorName: row.user?.name ?? row.user?.email ?? row.actor_user_id,
      action: row.action,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      reason: row.reason,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async getDuplicateSuggestions(
    reportId: string,
    user: AuthenticatedUser,
  ): Promise<DuplicateSuggestion[]> {
    if (user.role !== "MODERATOR" && user.role !== "SUPER_ADMIN") {
      throw new ForbiddenException(
        "Only moderators and super admins can view duplicate suggestions",
      );
    }

    const target = await this.prisma.issueReport.findUnique({
      where: { id: reportId },
    });

    if (!target) {
      throw new NotFoundException("Report not found");
    }

    const openReports = await this.prisma.issueReport.findMany({
      where: {
        id: { not: reportId },
        category: target.category,
        status: { notIn: ["CLOSED", "REJECTED"] },
      },
    });

    const candidates = openReports.map((r) => ({
      id: r.id,
      trackingCode: r.tracking_code,
      venueId: r.venue_id,
      facilityId: r.facility_id,
      category: r.category as ReportCategory,
      title: r.title,
      description: r.description,
      status: r.status as ReportStatus,
      createdAt: r.created_at,
    }));

    const targetCandidate = {
      id: target.id,
      trackingCode: target.tracking_code,
      venueId: target.venue_id,
      facilityId: target.facility_id,
      category: target.category as ReportCategory,
      title: target.title,
      description: target.description,
      status: target.status as ReportStatus,
      createdAt: target.created_at,
    };

    return findDuplicateCandidates(targetCandidate, candidates, {
      threshold: 0.5,
      windowDays: 30,
    });
  }

  async getReportWorkflowSummary(
    reportId: string,
    user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    const report = await this.prisma.issueReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    let isMember = false;
    if (report.venue_id) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: report.venue_id },
        select: { organization_id: true },
      });
      if (venue?.organization_id && user.role === "ORGANIZATION_ADMIN") {
        const membership = await this.prisma.organizationMember.findFirst({
          where: {
            organization_id: venue.organization_id,
            user_id: user.id,
            role: "ORGANIZATION_ADMIN",
          },
        });
        isMember = Boolean(membership);
      }
    }
    if (user.role === "SUPER_ADMIN") {
      isMember = true;
    }

    const receivedCount = await this.prisma.evidence.count({
      where: { report_id: reportId, status: "RECEIVED" },
    });

    const lastResAudit = await this.prisma.auditLog.findFirst({
      where: { entity_id: reportId, action: "SUBMIT_RESOLUTION" },
      orderBy: { created_at: "desc" },
    });

    const allowed = getAllowedActions(
      {
        id: report.id,
        trackingCode: report.tracking_code,
        status: report.status as ReportStatus,
        category: report.category as ReportCategory,
        reporterId: report.user_id,
        assignedToUserId: report.assigned_to_user_id,
        verifiedByUserId: report.verified_by_user_id,
        resolutionSubmittedByUserId: lastResAudit?.actor_user_id ?? null,
        reopenCount: report.reopen_count,
        resolvedAt: report.resolved_at,
        receivedEvidenceCount: receivedCount,
      },
      user.id,
      user.role as UserRole,
      isMember,
    );

    return {
      id: report.id,
      trackingCode: report.tracking_code,
      status: report.status as ReportStatus,
      category: report.category as ReportCategory,
      reopenCount: report.reopen_count,
      assignedToUserId: report.assigned_to_user_id,
      verifiedByUserId: report.verified_by_user_id,
      resolvedAt: report.resolved_at ? report.resolved_at.toISOString() : null,
      allowedActions: allowed,
    };
  }
}
