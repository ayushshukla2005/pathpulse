import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Throttle } from "@nestjs/throttler";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateEvidenceDto } from "./dto/create-evidence.dto";
import { CreateReportDto } from "./dto/create-report.dto";
import { FindOrgReportsDto } from "./dto/find-org-reports.dto";
import { FindReportsDto } from "./dto/find-reports.dto";
import {
  CompleteEvidenceResult,
  CreateEvidenceResult,
  PaginatedReports,
  ReportsService,
  SanitizedReport,
} from "./reports.service";

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post("reports")
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SanitizedReport> {
    return this.reportsService.createReport(dto, user);
  }

  @Get("reports/mine")
  async getMyReports(
    @Query() query: FindReportsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedReports> {
    return this.reportsService.getMyReports(user, query);
  }

  @Get("reports/:id")
  async getReportById(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SanitizedReport> {
    return this.reportsService.getReportById(id, user);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN)
  @Get("organizations/:orgId/reports")
  async getOrganizationReports(
    @Param("orgId") orgId: string,
    @Query() query: FindOrgReportsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedReports> {
    return this.reportsService.getOrganizationReports(orgId, user, query);
  }

  @Post("reports/:id/evidence")
  @HttpCode(HttpStatus.CREATED)
  async createEvidence(
    @Param("id") id: string,
    @Body() dto: CreateEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreateEvidenceResult> {
    return this.reportsService.createEvidence(id, dto, user);
  }

  @Post("evidence/:id/complete")
  @HttpCode(HttpStatus.OK)
  async completeEvidence(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompleteEvidenceResult> {
    return this.reportsService.completeEvidence(id, user);
  }
}
