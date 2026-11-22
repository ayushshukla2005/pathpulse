import { PrismaClient, UserRole } from "@prisma/client";
import { runSeed } from "../../prisma/seed";

describe("Database Seed Script", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should fail fast if SEED_ADMIN_PASSWORD is not set", async () => {
    delete process.env.SEED_ADMIN_PASSWORD;

    await expect(runSeed()).rejects.toThrow(
      "SEED_ADMIN_PASSWORD environment variable is required to run the seed script.",
    );
  });

  it("should fail fast if SEED_ADMIN_PASSWORD is whitespace only", async () => {
    process.env.SEED_ADMIN_PASSWORD = "   ";

    await expect(runSeed()).rejects.toThrow(
      "SEED_ADMIN_PASSWORD environment variable is required to run the seed script.",
    );
  });

  it("should execute idempotently and call upsert without duplicating entities", async () => {
    process.env.SEED_ADMIN_PASSWORD = "mock_admin_password_123";

    const mockOrg = {
      id: "mock-org-1",
      slug: "sample-campus-demo",
      name: "Sample Campus (Demo Data)",
    };
    const mockAdmin = {
      id: "mock-user-1",
      email: "demo-admin@pathpulse.local",
      role: UserRole.ORGANIZATION_ADMIN,
    };
    const mockVenue = {
      id: "mock-venue-1",
      organization_id: mockOrg.id,
      name: "Central Campus (Demo)",
    };
    const mockBuilding = {
      id: "mock-bld-1",
      venue_id: mockVenue.id,
      name: "Science & Tech Building (Demo)",
    };
    const mockFloor0 = { id: "mock-fl-0", building_id: mockBuilding.id, floor_number: 0 };
    const mockFloor1 = { id: "mock-fl-1", building_id: mockBuilding.id, floor_number: 1 };
    const mockNode = { id: "mock-node-1", building_id: mockBuilding.id };

    const mockPrisma = {
      organization: { upsert: jest.fn().mockResolvedValue(mockOrg) },
      user: { upsert: jest.fn().mockResolvedValue(mockAdmin) },
      organizationMember: { upsert: jest.fn().mockResolvedValue({ id: "mem-1" }) },
      userPreference: { upsert: jest.fn().mockResolvedValue({ id: "pref-1" }) },
      venue: {
        findFirst: jest.fn().mockResolvedValue(mockVenue),
        create: jest.fn().mockResolvedValue(mockVenue),
        update: jest.fn().mockResolvedValue(mockVenue),
      },
      building: {
        findFirst: jest.fn().mockResolvedValue(mockBuilding),
        create: jest.fn().mockResolvedValue(mockBuilding),
        update: jest.fn().mockResolvedValue(mockBuilding),
      },
      floor: {
        upsert: jest
          .fn()
          .mockResolvedValueOnce(mockFloor0)
          .mockResolvedValueOnce(mockFloor1)
          .mockResolvedValueOnce(mockFloor0)
          .mockResolvedValueOnce(mockFloor1),
      },
      mapNode: {
        findFirst: jest.fn().mockResolvedValue(mockNode),
        update: jest.fn().mockResolvedValue(mockNode),
        create: jest.fn().mockResolvedValue(mockNode),
      },
      mapEdge: {
        upsert: jest.fn().mockResolvedValue({ id: "edge-1" }),
      },
      facility: {
        findFirst: jest.fn().mockResolvedValue({ id: "fac-1" }),
        update: jest.fn().mockResolvedValue({ id: "fac-1" }),
        create: jest.fn().mockResolvedValue({ id: "fac-1" }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };

    await expect(runSeed(mockPrisma as unknown as PrismaClient)).resolves.not.toThrow();

    await expect(runSeed(mockPrisma as unknown as PrismaClient)).resolves.not.toThrow();

    expect(mockPrisma.organization.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(4);
    expect(mockPrisma.building.create).not.toHaveBeenCalled();
    expect(mockPrisma.facility.create).not.toHaveBeenCalled();
  });
});
