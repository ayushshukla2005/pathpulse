import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { DuplicateSuggestion } from "../duplicates/duplicate-detector";
import { AssignReportDto } from "./dto/assign-report.dto";
import { ReasonDto } from "./dto/reason.dto";
import { ReportWorkflowSummary } from "./types";
import { AuditLogItem, WorkflowService } from "./workflow.service";

@Controller("reports")
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post(":id/review")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  async reviewReport(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "REVIEW", user);
  }

  @Post(":id/verify")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  async verifyReport(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "VERIFY", user);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  async rejectReport(
    @Param("id") id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "REJECT", user, {
      reason: dto.reason,
    });
  }

  @Post(":id/assign")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN)
  async assignReport(
    @Param("id") id: string,
    @Body() dto: AssignReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "ASSIGN", user, {
      assignedToUserId: dto.assignedToUserId,
    });
  }

  @Post(":id/resolution")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN)
  async submitResolution(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "SUBMIT_RESOLUTION", user);
  }

  @Post(":id/confirm-resolution")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  async confirmResolution(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "CONFIRM_RESOLUTION", user);
  }

  @Post(":id/reopen")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  async reopenReport(
    @Param("id") id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.executeTransition(id, "REOPEN", user, {
      reason: dto.reason,
    });
  }

  @Get(":id/audit")
  @Roles(UserRole.MODERATOR, UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN)
  async getAuditHistory(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AuditLogItem[]> {
    return this.workflowService.getAuditHistory(id, user);
  }

  @Get(":id/duplicates")
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  async getDuplicateSuggestions(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DuplicateSuggestion[]> {
    return this.workflowService.getDuplicateSuggestions(id, user);
  }

  @Get(":id/workflow-summary")
  @Roles(UserRole.MODERATOR, UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN)
  async getWorkflowSummary(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReportWorkflowSummary> {
    return this.workflowService.getReportWorkflowSummary(id, user);
  }
}
