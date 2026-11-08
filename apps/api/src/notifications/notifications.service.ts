import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";
import { PrismaService } from "../database/prisma.service";
import {
  NotificationsListResponse,
  ReportNotificationJob,
  UserNotificationItem,
} from "./notifications.types";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue("report-notifications")
    private readonly queue: Queue<ReportNotificationJob>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueReportNotification(jobData: ReportNotificationJob): Promise<void> {
    try {
      await this.queue.add("report-status-change", jobData, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to enqueue notification job for report ${jobData.reportId}: ${errorMsg}`,
      );
    }
  }

  async getNotificationsForUser(userId: string): Promise<NotificationsListResponse> {
    const rows = await this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const unreadCount = await this.prisma.notification.count({
      where: {
        user_id: userId,
        read_at: null,
      },
    });

    const items: UserNotificationItem[] = rows.map((n) => ({
      id: n.id,
      reportId: n.report_id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      readAt: n.read_at ? n.read_at.toISOString() : null,
      createdAt: n.created_at.toISOString(),
    }));

    return {
      items,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<UserNotificationItem> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!existing) {
      throw new NotFoundException("Notification not found");
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read_at: new Date() },
    });

    return {
      id: updated.id,
      reportId: updated.report_id,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      link: updated.link,
      readAt: updated.read_at ? updated.read_at.toISOString() : null,
      createdAt: updated.created_at.toISOString(),
    };
  }
}
