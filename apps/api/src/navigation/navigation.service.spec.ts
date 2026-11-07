import { NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { ConnectionType, OperationalStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { NavigationService } from "./navigation.service";

interface MockPrisma {
  building: {
    findUnique: jest.Mock;
  };
  floor: {
    findUnique: jest.Mock;
  };
  mapNode: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  mapEdge: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
}

describe("NavigationService Validation Rules", () => {
  let service: NavigationService;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    mockPrisma = {
      building: {
        findUnique: jest.fn(),
      },
      floor: {
        findUnique: jest.fn(),
      },
      mapNode: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      mapEdge: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    service = new NavigationService(mockPrisma as unknown as PrismaService);
  });

  describe("createNode", () => {
    it("should throw NotFoundException if building does not exist", async () => {
      mockPrisma.building.findUnique.mockResolvedValue(null);

      await expect(
        service.createNode("bld-1", {
          floorId: "fl-1",
          nodeType: "ENTRANCE",
          xCoordinate: 10,
          yCoordinate: 20,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw UnprocessableEntityException if floor does not belong to building", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.floor.findUnique.mockResolvedValue({
        id: "fl-1",
        building_id: "other-bld",
      });

      await expect(
        service.createNode("bld-1", {
          floorId: "fl-1",
          nodeType: "ENTRANCE",
          xCoordinate: 10,
          yCoordinate: 20,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw UnprocessableEntityException if coordinates are negative", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.floor.findUnique.mockResolvedValue({ id: "fl-1", building_id: "bld-1" });

      await expect(
        service.createNode("bld-1", {
          floorId: "fl-1",
          nodeType: "ENTRANCE",
          xCoordinate: -5,
          yCoordinate: 10,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should create node and record audit log successfully", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.floor.findUnique.mockResolvedValue({ id: "fl-1", building_id: "bld-1" });
      mockPrisma.mapNode.create.mockResolvedValue({
        id: "node-1",
        building_id: "bld-1",
        floor_id: "fl-1",
        node_type: "ENTRANCE",
        x_coordinate: 10,
        y_coordinate: 20,
        is_accessible: true,
      });

      const result = await service.createNode(
        "bld-1",
        {
          floorId: "fl-1",
          nodeType: "ENTRANCE",
          xCoordinate: 10,
          yCoordinate: 20,
        },
        "actor-1",
      );

      expect(result.id).toBe("node-1");
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: "actor-1",
          action: "CREATE_NODE",
          entity_type: "MapNode",
          entity_id: "node-1",
          venue_id: "ven-1",
        }),
      });
    });
  });

  describe("createEdge", () => {
    it("should throw UnprocessableEntityException if distance is negative", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });

      await expect(
        service.createEdge("bld-1", {
          fromNodeId: "n-1",
          toNodeId: "n-2",
          connectionType: ConnectionType.CORRIDOR,
          distanceMeters: -1,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw UnprocessableEntityException if nodes belong to different buildings", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.mapNode.findUnique
        .mockResolvedValueOnce({ id: "n-1", building_id: "bld-1", floor_id: "fl-1" })
        .mockResolvedValueOnce({ id: "n-2", building_id: "other-bld", floor_id: "fl-1" });

      await expect(
        service.createEdge("bld-1", {
          fromNodeId: "n-1",
          toNodeId: "n-2",
          connectionType: ConnectionType.CORRIDOR,
          distanceMeters: 5,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw UnprocessableEntityException if STAIRS connection is marked stepFree: true", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.mapNode.findUnique
        .mockResolvedValueOnce({ id: "n-1", building_id: "bld-1", floor_id: "fl-1" })
        .mockResolvedValueOnce({ id: "n-2", building_id: "bld-1", floor_id: "fl-2" });

      await expect(
        service.createEdge("bld-1", {
          fromNodeId: "n-1",
          toNodeId: "n-2",
          connectionType: ConnectionType.STAIRS,
          distanceMeters: 5,
          stepFree: true,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should throw UnprocessableEntityException if ELEVATOR connects nodes on the same floor", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.mapNode.findUnique
        .mockResolvedValueOnce({ id: "n-1", building_id: "bld-1", floor_id: "fl-1" })
        .mockResolvedValueOnce({ id: "n-2", building_id: "bld-1", floor_id: "fl-1" });

      await expect(
        service.createEdge("bld-1", {
          fromNodeId: "n-1",
          toNodeId: "n-2",
          connectionType: ConnectionType.ELEVATOR,
          distanceMeters: 4,
          stepFree: true,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should create valid edge and write audit log", async () => {
      mockPrisma.building.findUnique.mockResolvedValue({ id: "bld-1", venue_id: "ven-1" });
      mockPrisma.mapNode.findUnique
        .mockResolvedValueOnce({ id: "n-1", building_id: "bld-1", floor_id: "fl-1" })
        .mockResolvedValueOnce({ id: "n-2", building_id: "bld-1", floor_id: "fl-2" });
      mockPrisma.mapEdge.create.mockResolvedValue({
        id: "edge-1",
        building_id: "bld-1",
        from_node_id: "n-1",
        to_node_id: "n-2",
        connection_type: ConnectionType.ELEVATOR,
        distance_meters: 4,
        step_free: true,
      });

      const result = await service.createEdge(
        "bld-1",
        {
          fromNodeId: "n-1",
          toNodeId: "n-2",
          connectionType: ConnectionType.ELEVATOR,
          distanceMeters: 4,
          stepFree: true,
        },
        "actor-1",
      );

      expect(result.id).toBe("edge-1");
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: "actor-1",
          action: "CREATE_EDGE",
          entity_type: "MapEdge",
          entity_id: "edge-1",
          venue_id: "ven-1",
        }),
      });
    });
  });

  describe("updateEdge", () => {
    it("should throw UnprocessableEntityException if updating STAIRS edge with stepFree: true", async () => {
      mockPrisma.mapEdge.findUnique.mockResolvedValue({
        id: "edge-stairs",
        connection_type: ConnectionType.STAIRS,
        building: { venue_id: "ven-1" },
      });

      await expect(
        service.updateEdge("edge-stairs", {
          stepFree: true,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it("should update edge and write audit log", async () => {
      mockPrisma.mapEdge.findUnique.mockResolvedValue({
        id: "edge-1",
        connection_type: ConnectionType.CORRIDOR,
        building: { venue_id: "ven-1" },
      });
      mockPrisma.mapEdge.update.mockResolvedValue({
        id: "edge-1",
        operational_status: OperationalStatus.OUT_OF_SERVICE,
      });

      const result = await service.updateEdge(
        "edge-1",
        { operationalStatus: OperationalStatus.OUT_OF_SERVICE },
        "actor-1",
      );

      expect(result.operational_status).toBe(OperationalStatus.OUT_OF_SERVICE);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: "actor-1",
          action: "UPDATE_EDGE",
          entity_type: "MapEdge",
          entity_id: "edge-1",
          venue_id: "ven-1",
        }),
      });
    });
  });
});
