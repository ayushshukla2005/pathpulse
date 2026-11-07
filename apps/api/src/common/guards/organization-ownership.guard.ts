import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import { PrismaService } from "../../database/prisma.service";
import { AuthenticatedUser } from "../decorators/current-user.decorator";

@Injectable()
export class OrganizationOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const params = request.params as Record<string, string | undefined>;
    let targetOrgId: string | null = null;

    if (params.orgId) {
      targetOrgId = params.orgId;
    } else if (params.venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: params.venueId },
        select: { organization_id: true },
      });
      targetOrgId = venue?.organization_id ?? null;
    } else if (params.buildingId) {
      const building = await this.prisma.building.findUnique({
        where: { id: params.buildingId },
        select: { venue: { select: { organization_id: true } } },
      });
      targetOrgId = building?.venue?.organization_id ?? null;
    } else if (params.edgeId) {
      const edge = await this.prisma.mapEdge.findUnique({
        where: { id: params.edgeId },
        select: { building: { select: { venue: { select: { organization_id: true } } } } },
      });
      targetOrgId = edge?.building?.venue?.organization_id ?? null;
    }

    if (!targetOrgId) {
      throw new ForbiddenException("Organization ownership could not be determined");
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: targetOrgId,
          user_id: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("You do not have administrative access to this organization");
    }

    return true;
  }
}
