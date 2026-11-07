import { Body, Controller, Get, Put } from "@nestjs/common";
import { UserPreference } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { CurrentUserProfile, UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser("id") userId: string): Promise<CurrentUserProfile> {
    return this.usersService.getCurrentUser(userId);
  }

  @Put("preferences")
  async updatePreferences(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreference> {
    return this.usersService.updatePreferences(userId, dto);
  }
}
