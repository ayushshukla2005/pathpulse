import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import {
  ConnectionType,
  MapEdge,
  MapNode,
  OperationalStatus,
  Prisma,
  VerificationLevel,
} from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateEdgeDto } from "./dto/create-edge.dto";
import { CreateNodeDto } from "./dto/create-node.dto";
import { UpdateEdgeDto } from "./dto/update-edge.dto";

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNode(buildingId: string, dto: CreateNodeDto, actorId?: string): Promise<MapNode> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) {
      throw new NotFoundException("Building not found");
    }

    const floor = await this.prisma.floor.findUnique({
      where: { id: dto.floorId },
    });
    if (!floor || floor.building_id !== buildingId) {
      throw new UnprocessableEntityException("Floor does not belong to the specified building");
    }

    if (dto.xCoordinate < 0 || dto.yCoordinate < 0) {
      throw new UnprocessableEntityException("Coordinates must be non-negative");
    }

    if (dto.latitude !== undefined && (dto.latitude < -90 || dto.latitude > 90)) {
      throw new UnprocessableEntityException("Latitude must be between -90 and 90");
    }

    if (dto.longitude !== undefined && (dto.longitude < -180 || dto.longitude > 180)) {
      throw new UnprocessableEntityException("Longitude must be between -180 and 180");
    }

    const node = await this.prisma.mapNode.create({
      data: {
        building_id: buildingId,
        floor_id: dto.floorId,
        node_type: dto.nodeType,
        name: dto.name,
        x_coordinate: dto.xCoordinate,
        y_coordinate: dto.yCoordinate,
        latitude: dto.latitude,
        longitude: dto.longitude,
        is_accessible: dto.isAccessible ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: actorId,
        action: "CREATE_NODE",
        entity_type: "MapNode",
        entity_id: node.id,
        venue_id: building.venue_id,
        changes: {
          buildingId,
          floorId: dto.floorId,
          nodeType: dto.nodeType,
          name: dto.name,
          xCoordinate: dto.xCoordinate,
          yCoordinate: dto.yCoordinate,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isAccessible: dto.isAccessible ?? true,
        } as Prisma.JsonObject,
      },
    });

    return node;
  }

  async createEdge(buildingId: string, dto: CreateEdgeDto, actorId?: string): Promise<MapEdge> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) {
      throw new NotFoundException("Building not found");
    }

    if (dto.distanceMeters < 0) {
      throw new UnprocessableEntityException("Distance must be non-negative");
    }

    const [fromNode, toNode] = await Promise.all([
      this.prisma.mapNode.findUnique({ where: { id: dto.fromNodeId } }),
      this.prisma.mapNode.findUnique({ where: { id: dto.toNodeId } }),
    ]);

    if (!fromNode || !toNode) {
      throw new NotFoundException("One or both nodes not found");
    }

    if (fromNode.building_id !== buildingId || toNode.building_id !== buildingId) {
      throw new UnprocessableEntityException("Both nodes must belong to the specified building");
    }

    if (dto.connectionType === ConnectionType.STAIRS && dto.stepFree === true) {
      throw new UnprocessableEntityException("A stairs connection cannot be step-free");
    }

    if (dto.connectionType === ConnectionType.ELEVATOR && fromNode.floor_id === toNode.floor_id) {
      throw new UnprocessableEntityException(
        "An elevator connection must connect nodes on different floors",
      );
    }

    const resolvedStepFree =
      dto.connectionType === ConnectionType.STAIRS ? false : (dto.stepFree ?? true);

    const edge = await this.prisma.mapEdge.create({
      data: {
        building_id: buildingId,
        from_node_id: dto.fromNodeId,
        to_node_id: dto.toNodeId,
        connection_type: dto.connectionType,
        distance_meters: dto.distanceMeters,
        step_free: resolvedStepFree,
        width_cm: dto.widthCm,
        slope_percent: dto.slopePercent,
        surface: dto.surface,
        operational_status: dto.operationalStatus ?? OperationalStatus.OPERATIONAL,
        verification_level: VerificationLevel.CONFIRMED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: actorId,
        action: "CREATE_EDGE",
        entity_type: "MapEdge",
        entity_id: edge.id,
        venue_id: building.venue_id,
        changes: {
          buildingId,
          fromNodeId: dto.fromNodeId,
          toNodeId: dto.toNodeId,
          connectionType: dto.connectionType,
          distanceMeters: dto.distanceMeters,
          stepFree: resolvedStepFree,
          widthCm: dto.widthCm,
          slopePercent: dto.slopePercent,
          surface: dto.surface,
          operationalStatus: dto.operationalStatus ?? OperationalStatus.OPERATIONAL,
        } as Prisma.JsonObject,
      },
    });

    return edge;
  }

  async updateEdge(edgeId: string, dto: UpdateEdgeDto, actorId?: string): Promise<MapEdge> {
    const edge = await this.prisma.mapEdge.findUnique({
      where: { id: edgeId },
      include: {
        building: {
          select: {
            venue_id: true,
          },
        },
      },
    });

    if (!edge) {
      throw new NotFoundException("Edge not found");
    }

    if (dto.stepFree === true && edge.connection_type === ConnectionType.STAIRS) {
      throw new UnprocessableEntityException("A stairs connection cannot be step-free");
    }

    const updated = await this.prisma.mapEdge.update({
      where: { id: edgeId },
      data: {
        step_free: dto.stepFree,
        operational_status: dto.operationalStatus,
        width_cm: dto.widthCm,
        slope_percent: dto.slopePercent,
        surface: dto.surface,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: actorId,
        action: "UPDATE_EDGE",
        entity_type: "MapEdge",
        entity_id: edge.id,
        venue_id: edge.building.venue_id,
        changes: {
          stepFree: dto.stepFree,
          operationalStatus: dto.operationalStatus,
          widthCm: dto.widthCm,
          slopePercent: dto.slopePercent,
          surface: dto.surface,
        } as Prisma.JsonObject,
      },
    });

    return updated;
  }
}
