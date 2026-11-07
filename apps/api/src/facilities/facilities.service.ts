import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { Facility, OperationalStatus, Prisma, VerificationLevel } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateFacilityDto } from "./dto/create-facility.dto";

@Injectable()
export class FacilitiesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
