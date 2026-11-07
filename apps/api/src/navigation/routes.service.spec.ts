import { ConfigService } from "@nestjs/config";
import { RedisService } from "../cache/redis.service";
import { PrismaService } from "../database/prisma.service";
import { GraphLoaderService, LoadedBuildingGraph } from "./graph/graph-loader.service";
import { RoutesService } from "./routes.service";
import { buildNavigationGraph, GraphEdge, GraphNode, RouteResult } from "./routing";

describe("RoutesService", () => {
  let service: RoutesService;
  let mockPrisma: { building: { findUnique: jest.Mock } };
  let mockGraphLoader: { loadGraph: jest.Mock };
  let mockRedis: { get: jest.Mock; set: jest.Mock };
  let mockConfig: { get: jest.Mock };

  const sampleNodes: GraphNode[] = [
    {
      id: "node-1",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ENTRANCE",
      latitude: 12.9,
      longitude: 77.5,
      label: "Node 1",
    },
    {
      id: "node-2",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.91,
      longitude: 77.51,
      label: "Node 2",
    },
  ];

  const sampleEdges: GraphEdge[] = [
    {
      id: "edge-1",
      fromNodeId: "node-1",
      toNodeId: "node-2",
      distanceMeters: 15,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
  ];

  const sampleLoadedGraph: LoadedBuildingGraph = {
    graph: buildNavigationGraph(sampleNodes, sampleEdges),
    graphVersion: 3,
  };

  beforeEach(() => {
    mockPrisma = {
      building: {
        findUnique: jest.fn().mockResolvedValue({
          id: "bld-1",
          graph_version: 3,
        }),
      },
    };

    mockGraphLoader = {
      loadGraph: jest.fn().mockResolvedValue(sampleLoadedGraph),
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue(900),
    };

    service = new RoutesService(
      mockPrisma as unknown as PrismaService,
      mockGraphLoader as unknown as GraphLoaderService,
      mockRedis as unknown as RedisService,
      mockConfig as unknown as ConfigService,
    );
  });

  describe("buildCacheKey", () => {
    it("should generate the expected key format", () => {
      const key = service.buildCacheKey("bld-1", 2, "WHEELCHAIR", "node-origin", "node-dest");
      expect(key).toBe("route:v1:bld-1:2:WHEELCHAIR:node-origin:node-dest");
    });

    it("should differ when graphVersion differs", () => {
      const keyV1 = service.buildCacheKey("bld-1", 1, "WHEELCHAIR", "node-origin", "node-dest");
      const keyV2 = service.buildCacheKey("bld-1", 2, "WHEELCHAIR", "node-origin", "node-dest");
      expect(keyV1).not.toBe(keyV2);
    });

    it("should differ when profile, origin, or destination differs", () => {
      const base = service.buildCacheKey("bld-1", 1, "WHEELCHAIR", "node-1", "node-2");
      const diffProfile = service.buildCacheKey("bld-1", 1, "CUSTOM", "node-1", "node-2");
      const diffOrigin = service.buildCacheKey("bld-1", 1, "WHEELCHAIR", "node-other", "node-2");
      const diffDest = service.buildCacheKey("bld-1", 1, "WHEELCHAIR", "node-1", "node-other");

      expect(base).not.toBe(diffProfile);
      expect(base).not.toBe(diffOrigin);
      expect(base).not.toBe(diffDest);
    });
  });

  describe("findRoute caching behaviors", () => {
    it("should compute, store, and return with cache: MISS on a cache miss", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.findRoute({
        buildingId: "bld-1",
        originNodeId: "node-1",
        destinationNodeId: "node-2",
        profile: "WHEELCHAIR",
      });

      expect(result.status).toBe("FOUND");
      expect(result.cache).toBe("MISS");
      expect(mockGraphLoader.loadGraph).toHaveBeenCalledWith("bld-1");
      expect(mockRedis.set).toHaveBeenCalledWith(
        "route:v1:bld-1:3:WHEELCHAIR:node-1:node-2",
        expect.objectContaining({ status: "FOUND" }),
        900,
      );
    });

    it("should return the stored result without calling the graph loader on a cache hit", async () => {
      const cachedResult: RouteResult = {
        status: "FOUND",
        steps: [],
        totalDistanceMeters: 15,
        accessibility: "STEP_FREE",
        warnings: [],
      };
      mockRedis.get.mockResolvedValue(cachedResult);

      const result = await service.findRoute({
        buildingId: "bld-1",
        originNodeId: "node-1",
        destinationNodeId: "node-2",
        profile: "WHEELCHAIR",
      });

      expect(result.status).toBe("FOUND");
      expect(result.cache).toBe("HIT");
      expect(mockGraphLoader.loadGraph).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it("should fall back to computation without throwing when Redis is unavailable", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis connection refused"));
      mockRedis.set.mockRejectedValue(new Error("Redis write failure"));

      const result = await service.findRoute({
        buildingId: "bld-1",
        originNodeId: "node-1",
        destinationNodeId: "node-2",
        profile: "WHEELCHAIR",
      });

      expect(result.status).toBe("FOUND");
      expect(result.cache).toBe("MISS");
      expect(mockGraphLoader.loadGraph).toHaveBeenCalledWith("bld-1");
    });

    it("should never store INVALID_INPUT results in the cache", async () => {
      const result = await service.findRoute({
        buildingId: "bld-1",
        originNodeId: "non-existent-node",
        destinationNodeId: "node-2",
        profile: "WHEELCHAIR",
      });

      expect(result.status).toBe("INVALID_INPUT");
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });
});
