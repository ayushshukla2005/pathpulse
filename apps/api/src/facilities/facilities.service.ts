import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  Facility,
  FacilityType,
  OperationalStatus,
  Prisma,
  UserRole,
  VerificationLevel,
} from "@prisma/client";
import { RedisService } from "../cache/redis.service";
import { PrismaService } from "../database/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { CreateFacilityDto } from "./dto/create-facility.dto";
import { UpdateFacilityStatusDto } from "./dto/update-facility-status.dto";

export interface UpdatedFacilityResponse extends Facility {
  graphVersion?: number;
}

@Injectable()
export class FacilitiesService {
  private readonly logger = new Logger(FacilitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  async createFacility(
    buildingId: string,
    dto: CreateFacilityDto,
    actorId?: string,
  ): Promise<Facility> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) {
      throw new NotFoundException("Building not found");
    }

    if (dto.verificationLevel && dto.verificationLevel !== VerificationLevel.UNVERIFIED) {
      throw new UnprocessableEntityException(
        "New facilities must be created with verification level UNVERIFIED",
      );
    }

    if (dto.floorId) {
      const floor = await this.prisma.floor.findUnique({
        where: { id: dto.floorId },
      });
      if (!floor || floor.building_id !== buildingId) {
        throw new UnprocessableEntityException("Floor does not belong to the specified building");
      }
    }

    if (dto.nodeId) {
      const node = await this.prisma.mapNode.findUnique({
        where: { id: dto.nodeId },
      });
      if (!node || node.building_id !== buildingId) {
        throw new UnprocessableEntityException("Node does not belong to the specified building");
      }
    }

    const facility = await this.prisma.facility.create({
      data: {
        venue_id: building.venue_id,
        building_id: buildingId,
        floor_id: dto.floorId,
        node_id: dto.nodeId,
        facility_type: dto.facilityType,
        name: dto.name,
        operational_status: dto.operationalStatus ?? OperationalStatus.OPERATIONAL,
        verification_level: VerificationLevel.UNVERIFIED,
        last_verified_at: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_user_id: actorId,
        user_id: actorId,
        action: "CREATE_FACILITY",
        entity_type: "Facility",
        entity_id: facility.id,
        venue_id: building.venue_id,
        changes: {
          buildingId,
          facilityType: dto.facilityType,
          name: dto.name,
          verificationLevel: VerificationLevel.UNVERIFIED,
        } as Prisma.JsonObject,
      },
    });

    return facility;
  }

  async updateFacilityStatus(
    facilityId: string,
    dto: UpdateFacilityStatusDto,
    actorId?: string,
    actorRole?: UserRole,
  ): Promise<UpdatedFacilityResponse> {
    const { updatedFacility, buildingId, newGraphVersion } = await this.prisma.$transaction(
      async (tx) => {
        let existing: {
          id: string;
          building_id: string | null;
          venue_id: string;
          facility_type: FacilityType;
          name: string;
          operational_status: OperationalStatus;
          verification_level: VerificationLevel;
          last_verified_at: Date | null;
        } | null = null;

        try {
          const lockedRows = await tx.$queryRaw<
            Array<{
              id: string;
              building_id: string | null;
              venue_id: string;
              facility_type: FacilityType;
              name: string;
              operational_status: OperationalStatus;
              verification_level: VerificationLevel;
              last_verified_at: Date | null;
            }>
          >`SELECT id, building_id, venue_id, facility_type, name, operational_status, verification_level, last_verified_at FROM facilities WHERE id = ${facilityId} FOR UPDATE`;

          if (lockedRows && lockedRows.length > 0) {
            existing = lockedRows[0] ?? null;
          }
        } catch {
          const found = await tx.facility.findUnique({
            where: { id: facilityId },
          });
          existing = found ?? null;
        }

        if (!existing) {
          throw new NotFoundException(`Facility not found: ${facilityId}`);
        }

        if (actorRole && actorRole !== UserRole.SUPER_ADMIN && actorId) {
          let venueOrgId: string | null = null;
          if (tx.venue && typeof tx.venue.findUnique === "function") {
            const venue = await tx.venue.findUnique({
              where: { id: existing.venue_id },
              select: { organization_id: true },
            });
            venueOrgId = venue?.organization_id ?? null;
          } else if (this.prisma.venue) {
            const venue = await this.prisma.venue.findUnique({
              where: { id: existing.venue_id },
              select: { organization_id: true },
            });
            venueOrgId = venue?.organization_id ?? null;
          }

          if (venueOrgId) {
            let isMember = false;
            if (tx.organizationMember && typeof tx.organizationMember.findUnique === "function") {
              const membership = await tx.organizationMember.findUnique({
                where: {
                  organization_id_user_id: {
                    organization_id: venueOrgId,
                    user_id: actorId,
                  },
                },
              });
              isMember = Boolean(membership);
            } else if (this.prisma.organizationMember) {
              const membership = await this.prisma.organizationMember.findUnique({
                where: {
                  organization_id_user_id: {
                    organization_id: venueOrgId,
                    user_id: actorId,
                  },
                },
              });
              isMember = Boolean(membership);
            }

            if (!isMember) {
              throw new ForbiddenException(
                "You do not have access to this organization's facilities",
              );
            }
          }
        }

        const isConfirmed = dto.verificationLevel === VerificationLevel.CONFIRMED;
        const updateData: Prisma.FacilityUpdateInput = {
          operational_status: dto.status,
        };

        if (dto.verificationLevel !== undefined) {
          updateData.verification_level = dto.verificationLevel;
        }

        if (isConfirmed) {
          updateData.last_verified_at = new Date();
        }

        const updated = await tx.facility.update({
          where: { id: facilityId },
          data: updateData,
        });

        let nextGraphVersion = 1;
        let previousGraphVersion = 1;

        if (existing.building_id) {
          if (typeof tx.building.findUnique === "function") {
            const currentBuilding = await tx.building.findUnique({
              where: { id: existing.building_id },
              select: { graph_version: true },
            });
            previousGraphVersion = currentBuilding?.graph_version ?? 1;
          }

          const updatedBuilding = await tx.building.update({
            where: { id: existing.building_id },
            data: {
              graph_version: { increment: 1 },
            },
            select: { id: true, graph_version: true },
          });
          nextGraphVersion = updatedBuilding.graph_version;
          if (previousGraphVersion === 1 && nextGraphVersion > 1) {
            previousGraphVersion = nextGraphVersion - 1;
          }
        }

        await tx.auditLog.create({
          data: {
            actor_user_id: actorId,
            user_id: actorId,
            action: "FACILITY_STATUS_CHANGED",
            entity_type: "Facility",
            entity_id: facilityId,
            venue_id: existing.venue_id,
            from_status: existing.operational_status,
            to_status: dto.status,
            changes: {
              previousStatus: existing.operational_status,
              newStatus: dto.status,
              previousVerificationLevel: existing.verification_level,
              newVerificationLevel: dto.verificationLevel ?? existing.verification_level,
              previousGraphVersion,
              newGraphVersion: nextGraphVersion,
            } as Prisma.JsonObject,
          },
        });

        return {
          updatedFacility: updated,
          buildingId: existing.building_id,
          newGraphVersion: nextGraphVersion,
        };
      },
    );

    if (buildingId) {
      try {
        await this.redis.deleteByPattern(`route:v1:${buildingId}:*`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to invalidate cache for building "${buildingId}": ${msg}`);
      }

      const broadcastPayload = {
        facilityId: updatedFacility.id,
        facilityType: updatedFacility.facility_type,
        name: updatedFacility.name,
        buildingId,
        status: updatedFacility.operational_status,
        verificationLevel: updatedFacility.verification_level,
        lastVerifiedAt: updatedFacility.last_verified_at
          ? updatedFacility.last_verified_at.toISOString()
          : null,
        graphVersion: newGraphVersion,
      };

      try {
        this.eventEmitter.emit("facility.status.changed", broadcastPayload);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to emit facility.status.changed event: ${msg}`);
      }

      if (this.realtimeGateway) {
        try {
          this.realtimeGateway.broadcastFacilityStatus(broadcastPayload);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to broadcast facility status update: ${msg}`);
        }
      }
    }

    return {
      ...updatedFacility,
      graphVersion: newGraphVersion,
    };
  }
}
