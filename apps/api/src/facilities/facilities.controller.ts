import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Facility, UserRole } from "@prisma/client";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrganizationOwnershipGuard } from "../common/guards/organization-ownership.guard";
import { CreateFacilityDto } from "./dto/create-facility.dto";
import { UpdateFacilityStatusDto } from "./dto/update-facility-status.dto";
import { FacilitiesService, UpdatedFacilityResponse } from "./facilities.service";

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

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Patch("facilities/:id/status")
  async updateFacilityStatus(
    @Param("id") id: string,
    @Body() dto: UpdateFacilityStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UpdatedFacilityResponse> {
    return this.facilitiesService.updateFacilityStatus(id, dto, user.id);
  }
}
