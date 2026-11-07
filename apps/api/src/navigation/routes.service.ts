import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../cache/redis.service";
import { PrismaService } from "../database/prisma.service";
import { GraphLoaderService } from "./graph/graph-loader.service";
import { FindRouteDto } from "./dto/find-route.dto";
import { findAccessibleRoute, MobilityProfile, RouteResult } from "./routing";

export type RouteResponse = RouteResult & {
  cache: "HIT" | "MISS";
};

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphLoader: GraphLoaderService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  buildCacheKey(
    buildingId: string,
    graphVersion: number,
    profile: MobilityProfile,
    originNodeId: string,
    destinationNodeId: string,
  ): string {
    return `route:v1:${buildingId}:${graphVersion}:${profile}:${originNodeId}:${destinationNodeId}`;
  }

  async findRoute(dto: FindRouteDto): Promise<RouteResponse> {
    const building = await this.prisma.building.findUnique({
      where: { id: dto.buildingId },
      select: { id: true, graph_version: true },
    });

    if (!building) {
      return {
        status: "INVALID_INPUT",
        reason: `Building not found: ${dto.buildingId}`,
        cache: "MISS",
      };
    }

    const cacheKey = this.buildCacheKey(
      dto.buildingId,
      building.graph_version,
      dto.profile,
      dto.originNodeId,
      dto.destinationNodeId,
    );

    try {
      const cached = await this.redis.get<RouteResult>(cacheKey);
      if (cached) {
        return {
          ...cached,
          cache: "HIT",
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis cache lookup failed for "${cacheKey}": ${msg}`);
    }

    const { graph } = await this.graphLoader.loadGraph(dto.buildingId);
    const result = findAccessibleRoute(graph, dto.originNodeId, dto.destinationNodeId, dto.profile);

    if (result.status === "FOUND" || result.status === "NO_CONFIRMED_ROUTE") {
      const ttl = this.configService.get<number>("routeCacheTtlSeconds") ?? 900;
      try {
        await this.redis.set(cacheKey, result, ttl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis cache save failed for "${cacheKey}": ${msg}`);
      }
    }

    return {
      ...result,
      cache: "MISS",
    };
  }
}
