import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { buildNavigationGraph, GraphEdge, GraphNode, NavigationGraph, NodeKind } from "../routing";

export interface LoadedBuildingGraph {
  graph: NavigationGraph;
  graphVersion: number;
}

interface RawNodeRow {
  id: string;
  building_id: string;
  floor_id: string;
  floor_number: number;
  node_type: string;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  is_accessible: boolean;
}

@Injectable()
export class GraphLoaderService {
  constructor(private readonly prisma: PrismaService) {}

  async loadGraph(buildingId: string): Promise<LoadedBuildingGraph> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      select: { id: true, graph_version: true },
    });

    if (!building) {
      throw new NotFoundException(`Building not found: ${buildingId}`);
    }

    let graphNodes: GraphNode[] = [];

    try {
      const rawNodes = await this.prisma.$queryRaw<RawNodeRow[]>`
        SELECT n.id, n.building_id, n.floor_id, f.floor_number, n.node_type, n.name,
               n.latitude, n.longitude, n.is_accessible
        FROM "map_nodes" n
        JOIN "floors" f ON n.floor_id = f.id
        WHERE n.building_id = ${buildingId};
      `;

      graphNodes = rawNodes.map((row) => ({
        id: row.id,
        buildingId: row.building_id,
        floorId: row.floor_id,
        floorNumber: row.floor_number,
        kind: (row.node_type as NodeKind) || "OTHER",
        latitude: row.latitude,
        longitude: row.longitude,
        label: row.name || row.id,
      }));
    } catch {
      const prismaNodes = await this.prisma.mapNode.findMany({
        where: { building_id: buildingId },
        include: {
          floor: {
            select: { floor_number: true },
          },
        },
      });

      graphNodes = prismaNodes.map((node) => ({
        id: node.id,
        buildingId: node.building_id,
        floorId: node.floor_id,
        floorNumber: node.floor?.floor_number ?? 0,
        kind: (node.node_type as NodeKind) || "OTHER",
        latitude: node.latitude,
        longitude: node.longitude,
        label: node.name || node.id,
      }));
    }

    const prismaEdges = await this.prisma.mapEdge.findMany({
      where: { building_id: buildingId },
    });

    const graphEdges: GraphEdge[] = prismaEdges.map((edge) => ({
      id: edge.id,
      fromNodeId: edge.from_node_id,
      toNodeId: edge.to_node_id,
      distanceMeters: edge.distance_meters,
      connectionType: edge.connection_type,
      stepFree: edge.step_free,
      widthCm: edge.width_cm ?? undefined,
      slopePercent: edge.slope_percent ?? undefined,
      surface: edge.surface ?? undefined,
      operationalStatus: edge.operational_status,
      confidence: edge.verification_level,
      lastVerifiedAt: edge.created_at,
      isBidirectional: false,
    }));

    const graph = buildNavigationGraph(graphNodes, graphEdges);

    return {
      graph,
      graphVersion: building.graph_version,
    };
  }
}
