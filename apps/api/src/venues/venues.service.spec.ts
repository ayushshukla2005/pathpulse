import { PrismaService } from "../database/prisma.service";
import { VenuesService } from "./venues.service";

interface MockPrisma {
  $queryRaw: jest.Mock;
  venue: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
  };
}

describe("VenuesService", () => {
  let service: VenuesService;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
      venue: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new VenuesService(mockPrisma as unknown as PrismaService);
  });

  describe("clampQueryParams", () => {
    it("should use defaults when parameters are omitted", () => {
      const result = service.clampQueryParams({});
      expect(result.radius).toBe(1000);
      expect(result.limit).toBe(20);
    });

    it("should clamp values within bounds (1 to 10000 meters, 1 to 100 limit)", () => {
      const high = service.clampQueryParams({
        radiusMeters: 50000,
        limit: 500,
      });
      expect(high.radius).toBe(10000);
      expect(high.limit).toBe(100);

      const low = service.clampQueryParams({
        radiusMeters: -50,
        limit: 0,
      });
      expect(low.radius).toBe(1);
      expect(low.limit).toBe(1);
    });
  });

  describe("findVenues with geographic query", () => {
    it("should query PostGIS when lat and lng are provided", async () => {
      const mockResult = [
        {
          id: "v-1",
          name: "Near Venue",
          latitude: 12.9716,
          longitude: 77.5946,
          distanceMeters: 150,
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockResult);

      const venues = await service.findVenues({
        lat: 12.97,
        lng: 77.59,
        radiusMeters: 2000,
      });

      expect(venues).toEqual(mockResult);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it("should fallback to haversine distance if PostGIS query fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Raw query error"));
      mockPrisma.venue.findMany.mockResolvedValue([
        {
          id: "v-near",
          name: "Near Campus",
          category: "CAMPUS",
          latitude: 12.9716,
          longitude: 77.5946,
        },
        {
          id: "v-far",
          name: "Far Away",
          category: "CAMPUS",
          latitude: 13.5,
          longitude: 78.5,
        },
      ]);

      const venues = await service.findVenues({
        lat: 12.9716,
        lng: 77.5946,
        radiusMeters: 1000,
      });

      expect(venues).toHaveLength(1);
      expect(venues[0]?.id).toBe("v-near");
      expect(venues[0]?.distanceMeters).toBeLessThanOrEqual(1000);
    });
  });
});
