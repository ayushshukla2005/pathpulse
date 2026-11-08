import { ReportStatus, WorkflowAction } from "../reports/workflow/types";

export interface ReportNotificationJob {
  reportId: string;
  reporterId: string;
  trackingCode: string;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  action: WorkflowAction;
  reason?: string | null;
}

export interface UserNotificationItem {
  id: string;
  reportId: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: UserNotificationItem[];
  unreadCount: number;
}
