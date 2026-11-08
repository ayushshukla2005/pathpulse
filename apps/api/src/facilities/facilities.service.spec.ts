import { EventEmitter2 } from "@nestjs/event-emitter";
import { OperationalStatus, VerificationLevel } from "@prisma/client";
import { RedisService } from "../cache/redis.service";
import { PrismaService } from "../database/prisma.service";
import { FacilitiesService } from "./facilities.service";

describe("FacilitiesService updateFacilityStatus", () => {
  let service: FacilitiesService;
  let mockPrisma: { $transaction: jest.Mock };
  let mockRedis: { deleteByPattern: jest.Mock };
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(
        async (callback: (tx: Record<string, Record<string, jest.Mock>>) => Promise<unknown>) => {
          const tx = {
            facility: {
              findUnique: jest.fn().mockResolvedValue({
                id: "fac-1",
                building_id: "bld-1",
                venue_id: "ven-1",
                operational_status: OperationalStatus.OPERATIONAL,
                verification_level: VerificationLevel.CONFIRMED,
              }),
              update: jest.fn().mockResolvedValue({
                id: "fac-1",
                building_id: "bld-1",
                venue_id: "ven-1",
                operational_status: OperationalStatus.OUT_OF_SERVICE,
                verification_level: VerificationLevel.CONFIRMED,
              }),
            },
            building: {
              update: jest.fn().mockResolvedValue({
                id: "bld-1",
                graph_version: 5,
              }),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: "log-1" }),
            },
          };
          return callback(tx);
        },
      ),
    };

    mockRedis = {
      deleteByPattern: jest.fn().mockResolvedValue(3),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new FacilitiesService(
      mockPrisma as unknown as PrismaService,
      mockRedis as unknown as RedisService,
      mockEventEmitter as unknown as EventEmitter2,
    );
  });

  it("should increment building graph version, record audit log, clear cache, and emit event after commit", async () => {
    const result = await service.updateFacilityStatus(
      "fac-1",
      {
        status: OperationalStatus.OUT_OF_SERVICE,
      },
      "admin-user-1",
    );

    expect(result.operational_status).toBe(OperationalStatus.OUT_OF_SERVICE);
    expect(result.graphVersion).toBe(5);

    expect(mockRedis.deleteByPattern).toHaveBeenCalledWith("route:v1:bld-1:*");
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      "facility.status.changed",
      expect.objectContaining({
        buildingId: "bld-1",
        graphVersion: 5,
      }),
    );
  });

  it("should not emit event or invalidate cache if the transaction fails", async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error("Transaction rolled back"));

    await expect(
      service.updateFacilityStatus(
        "fac-1",
        { status: OperationalStatus.OUT_OF_SERVICE },
        "admin-user-1",
      ),
    ).rejects.toThrow("Transaction rolled back");

    expect(mockRedis.deleteByPattern).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });
});
