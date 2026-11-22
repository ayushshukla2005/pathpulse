import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { UserThrottlerGuard } from "../common/guards/user-throttler.guard";
import { PrismaService } from "../database/prisma.service";
import { FacilitiesService, UpdatedFacilityResponse } from "../facilities/facilities.service";
import { OperatorFacilityStatusDto } from "./dto/operator-facility-status.dto";
import { ApiKeyAuthGuard, RequestWithApiKey } from "./guards/api-key-auth.guard";

@Controller("operator/facilities")
export class OperatorFacilitiesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facilitiesService: FacilitiesService,
  ) {}

  @Public()
  @UseGuards(ApiKeyAuthGuard, UserThrottlerGuard)
  @Post(":id/status")
  async updateFacilityStatus(
    @Param("id") id: string,
    @Body() dto: OperatorFacilityStatusDto,
    @Req() req: RequestWithApiKey,
  ): Promise<UpdatedFacilityResponse> {
    if (dto.verificationLevel !== undefined) {
      throw new BadRequestException(
        "Operator updates cannot set verificationLevel. Verification is restricted to moderators and administrators.",
      );
    }

    const newStatus = dto.operationalStatus || dto.status;
    if (!newStatus) {
      throw new BadRequestException("operationalStatus is required");
    }

    const apiKey = req.apiKey;
    if (!apiKey) {
      throw new ForbiddenException("Missing API key context");
    }

    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        venue: {
          select: { organization_id: true },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility not found: ${id}`);
    }

    if (
      !facility.venue.organization_id ||
      facility.venue.organization_id !== apiKey.organizationId
    ) {
      throw new ForbiddenException("Facility does not belong to your organization");
    }

    return this.facilitiesService.updateFacilityStatus(
      id,
      { status: newStatus },
      apiKey.id,
      undefined,
      apiKey.keyPrefix,
    );
  }
}
