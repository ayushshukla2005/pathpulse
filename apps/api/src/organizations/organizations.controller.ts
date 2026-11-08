import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrganizationOwnershipGuard } from "../common/guards/organization-ownership.guard";
import { AnalyticsService, DashboardMetricsResult } from "./analytics/analytics.service";
import { GetFacilitiesQueryDto } from "./dto/get-facilities-query.dto";
import { GetMaintenanceTasksQueryDto } from "./dto/get-maintenance-tasks-query.dto";
import { OrganizationsService } from "./organizations.service";
import {
  OrganizationBuildingsResponse,
  OrganizationFacilitiesResponse,
  OrganizationMaintenanceTasksResponse,
} from "@pathpulse/shared-types";

@Controller("organizations")
@UseGuards(OrganizationOwnershipGuard)
@Roles(UserRole.ORGANIZATION_ADMIN)
export class OrganizationsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Get(":orgId/dashboard")
  async getDashboard(
    @Param("orgId") orgId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DashboardMetricsResult> {
    return this.analyticsService.getDashboardMetrics(orgId, user.id, user.role);
  }

  @Get(":orgId/buildings")
  async getBuildings(
    @Param("orgId") orgId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationBuildingsResponse> {
    return this.organizationsService.getBuildings(orgId, user.id, user.role);
  }

  @Get(":orgId/facilities")
  async getFacilities(
    @Param("orgId") orgId: string,
    @Query() query: GetFacilitiesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationFacilitiesResponse> {
    return this.organizationsService.getFacilities(orgId, query, user.id, user.role);
  }

  @Get(":orgId/maintenance-tasks")
  async getMaintenanceTasks(
    @Param("orgId") orgId: string,
    @Query() query: GetMaintenanceTasksQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationMaintenanceTasksResponse> {
    return this.organizationsService.getMaintenanceTasks(orgId, query, user.id, user.role);
  }
}
