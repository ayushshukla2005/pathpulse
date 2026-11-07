import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Facility, OperationalStatus, Prisma, VerificationLevel } from "@prisma/client";
import { RedisService } from "../cache/redis.service";
import { PrismaService } from "../database/prisma.service";
import { CreateFacilityDto } from "./dto/create-facility.dto";
import { UpdateFacilityStatusDto } from "./dto/update-facility-status.dto";

export interface UpdatedFacilityResponse extends Facility {
  graphVersion?: number;
}

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
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
  ): Promise<UpdatedFacilityResponse> {
    const { updatedFacility, buildingId, newGraphVersion } = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.facility.findUnique({
          where: { id: facilityId },
          include: { building: true },
        });

        if (!existing) {
          throw new NotFoundException(`Facility not found: ${facilityId}`);
        }

        const updated = await tx.facility.update({
          where: { id: facilityId },
          data: {
            operational_status: dto.status,
            verification_level: dto.verificationLevel,
            last_verified_at: new Date(),
          },
        });

        let nextGraphVersion = 1;
        if (existing.building_id) {
          const updatedBuilding = await tx.building.update({
            where: { id: existing.building_id },
            data: {
              graph_version: { increment: 1 },
            },
            select: { id: true, graph_version: true },
          });
          nextGraphVersion = updatedBuilding.graph_version;
        }

        await tx.auditLog.create({
          data: {
            user_id: actorId,
            action: "FACILITY_STATUS_CHANGED",
            entity_type: "Facility",
            entity_id: facilityId,
            venue_id: existing.venue_id,
            changes: {
              previousStatus: existing.operational_status,
              newStatus: dto.status,
              previousVerificationLevel: existing.verification_level,
              newVerificationLevel: dto.verificationLevel,
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
      await this.redis.deleteByPattern(`route:v1:${buildingId}:*`);
      this.eventEmitter.emit("facility.status.changed", {
        buildingId,
        graphVersion: newGraphVersion,
      });
    }

    return {
      ...updatedFacility,
      graphVersion: newGraphVersion,
    };
  }
}
