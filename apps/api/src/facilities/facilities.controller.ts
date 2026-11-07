import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { Facility, UserRole } from "@prisma/client";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrganizationOwnershipGuard } from "../common/guards/organization-ownership.guard";
import { CreateFacilityDto } from "./dto/create-facility.dto";
import { FacilitiesService } from "./facilities.service";

@Controller()
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Post("buildings/:buildingId/facilities")
  async createFacility(
    @Param("buildingId") buildingId: string,
    @Body() dto: CreateFacilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Facility> {
    return this.facilitiesService.createFacility(buildingId, dto, user.id);
  }
}
