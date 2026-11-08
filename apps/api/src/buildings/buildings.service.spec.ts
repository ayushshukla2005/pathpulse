import { NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { BuildingsService } from "./buildings.service";

interface MockPrisma {
  venue: {
    findUnique: jest.Mock;
  };
  building: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  floor: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  mapNode: {
    findMany: jest.Mock;
  };
  mapEdge: {
    findMany: jest.Mock;
  };
}

describe("BuildingsService", () => {
  let service: BuildingsService;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    mockPrisma = {
      venue: {
        findUnique: jest.fn(),
      },
      building: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      floor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      mapNode: {
        findMany: jest.fn(),
      },
      mapEdge: {
        findMany: jest.fn(),
      },
    };

    service = new BuildingsService(mockPrisma as unknown as PrismaService);
  });

  describe("getBuildingMap", () => {
    it("should return the full navigation graph for a building in a single request", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({
        id: "bld-1",
        name: "Science Hall",
      });
      mockPrisma.floor.findMany.mockResolvedValue([
        { id: "fl-0", floor_number: 0, name: "Ground" },
        { id: "fl-1", floor_number: 1, name: "Floor 1" },
      ]);
      mockPrisma.mapNode.findMany.mockResolvedValue([
        { id: "node-1", floor_id: "fl-0", name: "Entrance" },
      ]);
      mockPrisma.mapEdge.findMany.mockResolvedValue([
        { id: "edge-1", from_node_id: "node-1", to_node_id: "node-2" },
      ]);

      const map = await service.getBuildingMap("bld-1");

      expect(map.building.id).toBe("bld-1");
      expect(map.floors).toHaveLength(2);
      expect(map.nodes).toHaveLength(1);
      expect(map.edges).toHaveLength(1);
    });

    it("should throw NotFoundException if building is not found", async () => {
      mockPrisma.building.findUnique.mockResolvedValue(null);
      mockPrisma.floor.findMany.mockResolvedValue([]);
      mockPrisma.mapNode.findMany.mockResolvedValue([]);
      mockPrisma.mapEdge.findMany.mockResolvedValue([]);

      await expect(service.getBuildingMap("missing-bld")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getFloorDetails", () => {
    it("should return floor with building, nodes, and facilities", async () => {
      mockPrisma.floor.findUnique.mockResolvedValue({
        id: "fl-0",
        building_id: "bld-1",
        floor_number: 0,
        name: "Ground Floor",
        level_index: 0,
        created_at: new Date(),
        updated_at: new Date(),
        building: {
          id: "bld-1",
          name: "Science Building",
        },
        map_nodes: [{ id: "n-1", name: "Entrance", node_type: "ENTRANCE" }],
        facilities: [{ id: "f-1", name: "Main Entrance", facility_type: "ENTRANCE" }],
      });

      const result = await service.getFloorDetails("bld-1", "fl-0");

      expect(result.floor.id).toBe("fl-0");
      expect(result.building.id).toBe("bld-1");
      expect(result.nodes).toHaveLength(1);
      expect(result.facilities).toHaveLength(1);
    });

    it("should throw NotFoundException if floor does not match building or does not exist", async () => {
      mockPrisma.floor.findUnique.mockResolvedValue(null);

      await expect(service.getFloorDetails("bld-1", "fl-unknown")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createFloor", () => {
    it("should throw UnprocessableEntityException if floor number is duplicate within building", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1" });
      mockPrisma.floor.findUnique.mockResolvedValue({
        id: "fl-existing",
        building_id: "bld-1",
        floor_number: 1,
      });

      await expect(
        service.createFloor("bld-1", {
          floorNumber: 1,
          name: "Duplicate Floor",
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should successfully create unique floor", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1" });
      mockPrisma.floor.findUnique.mockResolvedValue(null);
      mockPrisma.floor.create.mockResolvedValue({
        id: "fl-new",
        building_id: "bld-1",
        floor_number: 2,
        name: "Floor 2",
        level_index: 2,
      });

      const floor = await service.createFloor("bld-1", {
        floorNumber: 2,
        name: "Floor 2",
        levelIndex: 2,
      });

      expect(floor.id).toBe("fl-new");
      expect(floor.floor_number).toBe(2);
    });
  });

  describe("updateFloor", () => {
    it("should throw UnprocessableEntityException if updated floor number conflicts with existing floor", async () => {
      mockPrisma.floor.findUnique
        .mockResolvedValueOnce({
          id: "fl-1",
          building_id: "bld-1",
          floor_number: 1,
        })
        .mockResolvedValueOnce({
          id: "fl-2",
          building_id: "bld-1",
          floor_number: 2,
        });

      await expect(
        service.updateFloor("bld-1", "fl-1", {
          floorNumber: 2,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
