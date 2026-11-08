import type { NotificationsListResponse, UserNotificationItem } from "@pathpulse/shared-types";
import { apiClient } from "./client";

export async function getNotifications(): Promise<NotificationsListResponse> {
  return apiClient<NotificationsListResponse>("/notifications", {
    method: "GET",
  });
}

export async function markNotificationRead(id: string): Promise<UserNotificationItem> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<UserNotificationItem>(`/notifications/${safeId}/read`, {
    method: "POST",
  });
}
