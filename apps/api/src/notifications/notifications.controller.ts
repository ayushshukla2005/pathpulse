import { Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { NotificationsListResponse, UserNotificationItem } from "./notifications.types";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationsListResponse> {
    return this.notificationsService.getNotificationsForUser(user.id);
  }

  @Post(":id/read")
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserNotificationItem> {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
