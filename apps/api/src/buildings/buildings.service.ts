import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { Building, Floor, MapEdge, MapNode } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateBuildingDto } from "./dto/create-building.dto";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";

export interface BuildingNavigationGraph {
  building: Building;
  floors: Floor[];
  nodes: MapNode[];
  edges: MapEdge[];
}

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFloors(buildingId: string): Promise<Floor[]> {
    return this.prisma.floor.findMany({
      where: { building_id: buildingId },
      orderBy: { floor_number: "asc" },
    });
  }

  async getBuildingMap(buildingId: string): Promise<BuildingNavigationGraph> {
    const [building, floors, nodes, edges] = await Promise.all([
      this.prisma.building.findUnique({ where: { id: buildingId } }),
      this.prisma.floor.findMany({
        where: { building_id: buildingId },
        orderBy: { floor_number: "asc" },
      }),
      this.prisma.mapNode.findMany({
        where: { building_id: buildingId },
      }),
      this.prisma.mapEdge.findMany({
        where: { building_id: buildingId },
      }),
    ]);

    if (!building) {
      throw new NotFoundException("Building not found");
    }

    return {
      building,
      floors,
      nodes,
      edges,
    };
  }

  async createBuilding(venueId: string, dto: CreateBuildingDto): Promise<Building> {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException("Venue not found");
    }

    return this.prisma.building.create({
      data: {
        venue_id: venueId,
        name: dto.name,
        building_code: dto.buildingCode,
      },
    });
  }

  async createFloor(buildingId: string, dto: CreateFloorDto): Promise<Floor> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) {
      throw new NotFoundException("Building not found");
    }

    const existing = await this.prisma.floor.findUnique({
      where: {
        building_id_floor_number: {
          building_id: buildingId,
          floor_number: dto.floorNumber,
        },
      },
    });

    if (existing) {
      throw new UnprocessableEntityException("Floor number must be unique within the building");
    }

    return this.prisma.floor.create({
      data: {
        building_id: buildingId,
        floor_number: dto.floorNumber,
        name: dto.name,
        level_index: dto.levelIndex ?? 0,
      },
    });
  }

  async updateFloor(buildingId: string, floorId: string, dto: UpdateFloorDto): Promise<Floor> {
    const floor = await this.prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor || floor.building_id !== buildingId) {
      throw new NotFoundException("Floor not found in specified building");
    }

    if (dto.floorNumber !== undefined && dto.floorNumber !== floor.floor_number) {
      const existing = await this.prisma.floor.findUnique({
        where: {
          building_id_floor_number: {
            building_id: buildingId,
            floor_number: dto.floorNumber,
          },
        },
      });

      if (existing) {
        throw new UnprocessableEntityException("Floor number must be unique within the building");
      }
    }

    return this.prisma.floor.update({
      where: { id: floorId },
      data: {
        floor_number: dto.floorNumber,
        name: dto.name,
      },
    });
  }
}
