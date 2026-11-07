import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { ConnectionType, UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";

interface OrgMemberRecord {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
}

interface VenueRecord {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
}

interface BuildingRecord {
  id: string;
  venue_id: string;
  name: string;
  building_code: string | null;
  created_at: Date;
  updated_at: Date;
}

interface FloorRecord {
  id: string;
  building_id: string;
  floor_number: number;
  name: string;
  level_index: number;
  created_at: Date;
  updated_at: Date;
}

interface MapNodeRecord {
  id: string;
  building_id: string;
  floor_id: string;
  node_type: string;
  name: string | null;
  x_coordinate: number;
  y_coordinate: number;
  latitude: number | null;
  longitude: number | null;
  is_accessible: boolean;
  created_at: Date;
  updated_at: Date;
}

interface MapEdgeRecord {
  id: string;
  building_id: string;
  from_node_id: string;
  to_node_id: string;
  connection_type: ConnectionType;
  distance_meters: number;
  step_free: boolean;
}

interface AuditLogRecord {
  id?: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  venue_id?: string;
  changes?: Record<string, unknown>;
}

interface CreateVenueData {
  organization_id: string;
  name: string;
  category: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface CreateBuildingData {
  venue_id: string;
  name: string;
  building_code?: string;
}

interface FloorWhereUnique {
  id?: string;
  building_id_floor_number?: {
    building_id: string;
    floor_number: number;
  };
}

interface CreateMapNodeData {
  building_id: string;
  floor_id: string;
  node_type: string;
  name?: string;
  x_coordinate: number;
  y_coordinate: number;
  latitude?: number;
  longitude?: number;
  is_accessible?: boolean;
}

interface CreateMapEdgeData {
  building_id: string;
  from_node_id: string;
  to_node_id: string;
  connection_type: ConnectionType;
  distance_meters: number;
  step_free: boolean;
}

describe("Venues & Navigation (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const orgMembers = new Map<string, OrgMemberRecord>();
  const venues = new Map<string, VenueRecord>();
  const buildings = new Map<string, BuildingRecord>();
  const floors = new Map<string, FloorRecord>();
  const nodes = new Map<string, MapNodeRecord>();
  const edges = new Map<string, MapEdgeRecord>();
  const auditLogs: AuditLogRecord[] = [];

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockRejectedValue(new Error("Use haversine fallback in test")),
    organizationMember: {
      findUnique: jest.fn(
        async ({
          where,
        }: {
          where: { organization_id_user_id: { organization_id: string; user_id: string } };
        }) => {
          const key = `${where.organization_id_user_id.organization_id}:${where.organization_id_user_id.user_id}`;
          return orgMembers.get(key) ?? null;
        },
      ),
    },
    venue: {
      findMany: jest.fn(async () => Array.from(venues.values())),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        return venues.get(where.id) ?? null;
      }),
      create: jest.fn(async ({ data }: { data: CreateVenueData }) => {
        const id = randomUUID();
        const rec: VenueRecord = {
          id,
          organization_id: data.organization_id,
          name: data.name,
          category: data.category,
          address: data.address ?? null,
          latitude: data.latitude,
          longitude: data.longitude,
          created_at: new Date(),
          updated_at: new Date(),
        };
        venues.set(id, rec);
        return rec;
      }),
    },
    building: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const b = buildings.get(where.id);
        if (!b) return null;
        const v = venues.get(b.venue_id);
        return {
          ...b,
          venue: v ? { organization_id: v.organization_id } : null,
        };
      }),
      create: jest.fn(async ({ data }: { data: CreateBuildingData }) => {
        const id = randomUUID();
        const rec: BuildingRecord = {
          id,
          venue_id: data.venue_id,
          name: data.name,
          building_code: data.building_code ?? null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        buildings.set(id, rec);
        return rec;
      }),
    },
    floor: {
      findUnique: jest.fn(async ({ where }: { where: FloorWhereUnique }) => {
        if (where.id) return floors.get(where.id) ?? null;
        if (where.building_id_floor_number) {
          for (const f of floors.values()) {
            if (
              f.building_id === where.building_id_floor_number.building_id &&
              f.floor_number === where.building_id_floor_number.floor_number
            ) {
              return f;
            }
          }
        }
        return null;
      }),
    },
    mapNode: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        return nodes.get(where.id) ?? null;
      }),
      create: jest.fn(async ({ data }: { data: CreateMapNodeData }) => {
        const id = randomUUID();
        const rec: MapNodeRecord = {
          id,
          building_id: data.building_id,
          floor_id: data.floor_id,
          node_type: data.node_type,
          name: data.name ?? null,
          x_coordinate: data.x_coordinate,
          y_coordinate: data.y_coordinate,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          is_accessible: data.is_accessible ?? true,
          created_at: new Date(),
          updated_at: new Date(),
        };
        nodes.set(id, rec);
        return rec;
      }),
    },
    mapEdge: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const e = edges.get(where.id);
        if (!e) return null;
        const b = buildings.get(e.building_id);
        const v = b ? venues.get(b.venue_id) : null;
        return {
          ...e,
          building: b
            ? { venue_id: b.venue_id, venue: v ? { organization_id: v.organization_id } : null }
            : null,
        };
      }),
      create: jest.fn(async ({ data }: { data: CreateMapEdgeData }) => {
        const id = randomUUID();
        const rec: MapEdgeRecord = {
          id,
          building_id: data.building_id,
          from_node_id: data.from_node_id,
          to_node_id: data.to_node_id,
          connection_type: data.connection_type,
          distance_meters: data.distance_meters,
          step_free: data.step_free,
        };
        edges.set(id, rec);
        return rec;
      }),
    },
    auditLog: {
      create: jest.fn(async ({ data }: { data: AuditLogRecord }) => {
        auditLogs.push(data);
        return { id: randomUUID(), ...data };
      }),
    },
  };

  const userRegular = { id: "user-reg-1", role: UserRole.USER };
  const userOrg1Admin = { id: "admin-org-1", role: UserRole.ORGANIZATION_ADMIN };
  const userOrg2Admin = { id: "admin-org-2", role: UserRole.ORGANIZATION_ADMIN };

  let tokenRegular: string;
  let tokenOrg1Admin: string;
  let tokenOrg2Admin: string;

  const testVenue1Id = randomUUID();
  const testBuilding1Id = randomUUID();
  const testNode0Id = randomUUID();
  const testNode1Id = randomUUID();

  beforeAll(async () => {
    process.env.DATABASE_URL =
      "postgresql://pathpulse:pathpulse_dev_password@localhost:5432/pathpulse";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET = "dev-pathpulse-jwt-access-secret-32-chars-long";
    process.env.JWT_REFRESH_SECRET = "dev-pathpulse-jwt-refresh-secret-32-chars-long";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    const accessSecret = process.env.JWT_ACCESS_SECRET;

    tokenRegular = jwtService.sign(
      { sub: userRegular.id, role: userRegular.role },
      { secret: accessSecret },
    );
    tokenOrg1Admin = jwtService.sign(
      { sub: userOrg1Admin.id, role: userOrg1Admin.role },
      { secret: accessSecret },
    );
    tokenOrg2Admin = jwtService.sign(
      { sub: userOrg2Admin.id, role: userOrg2Admin.role },
      { secret: accessSecret },
    );

    orgMembers.set(`org-1:${userOrg1Admin.id}`, {
      id: "mem-1",
      organization_id: "org-1",
      user_id: userOrg1Admin.id,
      role: UserRole.ORGANIZATION_ADMIN,
    });
    orgMembers.set(`org-2:${userOrg2Admin.id}`, {
      id: "mem-2",
      organization_id: "org-2",
      user_id: userOrg2Admin.id,
      role: UserRole.ORGANIZATION_ADMIN,
    });

    venues.set(testVenue1Id, {
      id: testVenue1Id,
      organization_id: "org-1",
      name: "Central Campus (Demo)",
      category: "CAMPUS",
      address: "123 Academic Way",
      latitude: 12.9716,
      longitude: 77.5946,
      created_at: new Date(),
      updated_at: new Date(),
    });

    venues.set("venue-near", {
      id: "venue-near",
      organization_id: "org-1",
      name: "Near Venue (Demo)",
      category: "CAMPUS",
      address: "Nearby Street",
      latitude: 12.975,
      longitude: 77.598,
      created_at: new Date(),
      updated_at: new Date(),
    });

    venues.set("venue-far", {
      id: "venue-far",
      organization_id: "org-1",
      name: "Far Away Venue (Demo)",
      category: "CAMPUS",
      address: "Distant Town",
      latitude: 14.5,
      longitude: 79.5,
      created_at: new Date(),
      updated_at: new Date(),
    });

    buildings.set(testBuilding1Id, {
      id: testBuilding1Id,
      venue_id: testVenue1Id,
      name: "Science & Tech Building (Demo)",
      building_code: "ST-01",
      created_at: new Date(),
      updated_at: new Date(),
    });

    floors.set("fl-0", {
      id: "fl-0",
      building_id: testBuilding1Id,
      floor_number: 0,
      name: "Ground Floor",
      level_index: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    floors.set("fl-1", {
      id: "fl-1",
      building_id: testBuilding1Id,
      floor_number: 1,
      name: "First Floor",
      level_index: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    nodes.set(testNode0Id, {
      id: testNode0Id,
      building_id: testBuilding1Id,
      floor_id: "fl-0",
      node_type: "ENTRANCE",
      name: "Entrance",
      x_coordinate: 10,
      y_coordinate: 10,
      latitude: 12.9716,
      longitude: 77.5946,
      is_accessible: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    nodes.set(testNode1Id, {
      id: testNode1Id,
      building_id: testBuilding1Id,
      floor_id: "fl-1",
      node_type: "LOBBY",
      name: "First Floor Lobby",
      x_coordinate: 30,
      y_coordinate: 10,
      latitude: null,
      longitude: null,
      is_accessible: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/venues returns only venues within radius, ordered by distance", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/venues?lat=12.9716&lng=77.5946&radiusMeters=1000")
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    const names = res.body.map((v: VenueRecord) => v.name);
    expect(names).toContain("Central Campus (Demo)");
    expect(names).toContain("Near Venue (Demo)");
    expect(names).not.toContain("Far Away Venue (Demo)");

    expect(res.body[0].distanceMeters).toBeLessThanOrEqual(res.body[1].distanceMeters);
  });

  it("GET /api/v1/venues with latitude > 90 returns 400 with a validation error", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/venues?lat=95&lng=77.5946")
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it("POST /api/v1/venues/:venueId/buildings with a USER role returns 403", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/venues/${testVenue1Id}/buildings`)
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send({ name: "Unauthorized Building" })
      .expect(403);

    expect(res.body.statusCode).toBe(403);
  });

  it("POST /api/v1/venues/:venueId/buildings with an admin of a different organization returns 403", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/venues/${testVenue1Id}/buildings`)
      .set("Authorization", `Bearer ${tokenOrg2Admin}`)
      .send({ name: "Cross Org Building" })
      .expect(403);

    expect(res.body.statusCode).toBe(403);
  });

  it("POST /api/v1/venues/:venueId/buildings with the correct organization admin succeeds", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/venues/${testVenue1Id}/buildings`)
      .set("Authorization", `Bearer ${tokenOrg1Admin}`)
      .send({ name: "Authorized Building", buildingCode: "AUTH-01" })
      .expect(201);

    expect(res.body.name).toBe("Authorized Building");
  });

  it("POST /api/v1/buildings/:buildingId/edges with STAIRS and stepFree: true returns 422", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/buildings/${testBuilding1Id}/edges`)
      .set("Authorization", `Bearer ${tokenOrg1Admin}`)
      .send({
        fromNodeId: testNode0Id,
        toNodeId: testNode1Id,
        connectionType: ConnectionType.STAIRS,
        distanceMeters: 5.0,
        stepFree: true,
      })
      .expect(422);

    expect(res.body.statusCode).toBe(422);
    expect(res.body.message).toContain("stairs");
  });
});
