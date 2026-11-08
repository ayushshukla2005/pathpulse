import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { GetFacilitiesQueryDto } from "./dto/get-facilities-query.dto";
import { GetMaintenanceTasksQueryDto } from "./dto/get-maintenance-tasks-query.dto";
import {
  OrganizationBuildingItem,
  OrganizationBuildingsResponse,
  OrganizationFacilitiesResponse,
  OrganizationFacilityItem,
  OrganizationMaintenanceTaskItem,
  OrganizationMaintenanceTasksResponse,
} from "@pathpulse/shared-types";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOrganizationAccess(
    orgId: string,
    actorId: string,
    actorRole: UserRole,
  ): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }

    if (actorRole !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: actorId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException("You do not have access to this organization");
      }
    }
  }

  async getBuildings(
    orgId: string,
    actorId: string,
    actorRole: UserRole,
  ): Promise<OrganizationBuildingsResponse> {
    await this.assertOrganizationAccess(orgId, actorId, actorRole);

    const buildings = await this.prisma.building.findMany({
      where: {
        venue: {
          organization_id: orgId,
        },
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            floors: true,
            facilities: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const items: OrganizationBuildingItem[] = buildings.map((b) => ({
      id: b.id,
      name: b.name,
      buildingCode: b.building_code,
      graphVersion: b.graph_version,
      venueId: b.venue.id,
      venueName: b.venue.name,
      floorCount: b._count.floors,
      facilityCount: b._count.facilities,
      createdAt: b.created_at.toISOString(),
      updatedAt: b.updated_at.toISOString(),
    }));

    return {
      items,
      total: items.length,
    };
  }

  async getFacilities(
    orgId: string,
    query: GetFacilitiesQueryDto,
    actorId: string,
    actorRole: UserRole,
  ): Promise<OrganizationFacilitiesResponse> {
    await this.assertOrganizationAccess(orgId, actorId, actorRole);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.FacilityWhereInput = {
      venue: {
        organization_id: orgId,
      },
    };

    if (query.buildingId) {
      where.building_id = query.buildingId;
    }

    if (query.status) {
      where.operational_status = query.status;
    }

    const [total, facilities] = await Promise.all([
      this.prisma.facility.count({ where }),
      this.prisma.facility.findMany({
        where,
        skip,
        take: limit,
        include: {
          venue: {
            select: { id: true, name: true },
          },
          building: {
            select: { id: true, name: true },
          },
          floor: {
            select: { id: true, name: true, floor_number: true },
          },
        },
        orderBy: [{ building_id: "asc" }, { facility_type: "asc" }, { name: "asc" }],
      }),
    ]);

    const items: OrganizationFacilityItem[] = facilities.map((f) => ({
      id: f.id,
      venueId: f.venue_id,
      venueName: f.venue.name,
      buildingId: f.building_id,
      buildingName: f.building?.name ?? null,
      floorId: f.floor_id,
      floorName: f.floor ? `${f.floor.name} (${f.floor.floor_number})` : null,
      nodeId: f.node_id,
      facilityType: f.facility_type,
      name: f.name,
      operationalStatus: f.operational_status,
      verificationLevel: f.verification_level,
      lastVerifiedAt: f.last_verified_at ? f.last_verified_at.toISOString() : null,
      createdAt: f.created_at.toISOString(),
      updatedAt: f.updated_at.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getMaintenanceTasks(
    orgId: string,
    query: GetMaintenanceTasksQueryDto,
    actorId: string,
    actorRole: UserRole,
  ): Promise<OrganizationMaintenanceTasksResponse> {
    await this.assertOrganizationAccess(orgId, actorId, actorRole);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceTaskWhereInput = {
      organization_id: orgId,
    };

    if (query.assigneeId) {
      where.assigned_to_id = query.assigneeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, tasks] = await Promise.all([
      this.prisma.maintenanceTask.count({ where }),
      this.prisma.maintenanceTask.findMany({
        where,
        skip,
        take: limit,
        include: {
          assigned_to: {
            select: { id: true, name: true },
          },
          report: {
            select: {
              id: true,
              tracking_code: true,
              title: true,
              category: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

    const items: OrganizationMaintenanceTaskItem[] = tasks.map((t) => ({
      id: t.id,
      reportId: t.report_id,
      reportTrackingCode: t.report?.tracking_code,
      reportTitle: t.report?.title ?? null,
      reportCategory: t.report?.category,
      organizationId: t.organization_id,
      assignedToId: t.assigned_to_id,
      assignedToName: t.assigned_to?.name ?? null,
      status: t.status,
      priority: t.priority,
      resolutionNotes: t.resolution_notes,
      resolvedAt: t.resolved_at ? t.resolved_at.toISOString() : null,
      createdAt: t.created_at.toISOString(),
      updatedAt: t.updated_at.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
