import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../database/prisma.service";
import { ReportNotificationJob } from "./notifications.types";

@Injectable()
@Processor("report-notifications")
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ReportNotificationJob>): Promise<void> {
    const { reportId, reporterId, trackingCode, toStatus, action, reason } = job.data;

    const { title, message } = this.buildNotificationContent(
      trackingCode,
      toStatus,
      action,
      reason,
    );

    try {
      await this.prisma.notification.create({
        data: {
          user_id: reporterId,
          report_id: reportId,
          type: `REPORT_${toStatus}`,
          title,
          message,
          link: `/reports/${reportId}`,
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to persist notification for report ${reportId} (user ${reporterId}): ${errorMsg}`,
      );
      throw err;
    }
  }

  private buildNotificationContent(
    trackingCode: string,
    toStatus: string,
    action: string,
    reason?: string | null,
  ): { title: string; message: string } {
    switch (toStatus) {
      case "UNDER_REVIEW":
        return {
          title: "Report Under Review",
          message: `Your report ${trackingCode} is now under review by our moderation team.`,
        };
      case "VERIFIED":
        return {
          title: "Report Verified",
          message: `Your report ${trackingCode} has been verified and confirmed as an active barrier.`,
        };
      case "REJECTED":
        return {
          title: "Report Rejected",
          message: `Your report ${trackingCode} was reviewed and rejected.${
            reason ? ` Reason: ${reason}` : ""
          }`,
        };
      case "ASSIGNED":
        return {
          title: "Task Assigned",
          message: `A maintenance task has been assigned to address barrier ${trackingCode}.`,
        };
      case "RESOLUTION_SUBMITTED":
        return {
          title: "Resolution Submitted",
          message: `Remediation evidence has been submitted for report ${trackingCode} and awaits moderator verification.`,
        };
      case "CLOSED":
        return {
          title: "Report Closed",
          message: `The accessibility barrier in report ${trackingCode} has been resolved and confirmed closed.`,
        };
      case "REOPENED":
        return {
          title: "Report Reopened",
          message: `Report ${trackingCode} has been reopened for additional remediation.${
            reason ? ` Reason: ${reason}` : ""
          }`,
        };
      default:
        return {
          title: "Report Updated",
          message: `Your report ${trackingCode} status was updated to ${toStatus} via action ${action}.`,
        };
    }
  }
}
