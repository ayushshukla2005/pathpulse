import { getQueueToken } from "@nestjs/bullmq";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import {
  ConnectionType,
  FacilityType,
  OperationalStatus,
  UserRole,
  VerificationLevel,
} from "@prisma/client";
import { randomUUID } from "crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { RedisService } from "../src/cache/redis.service";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";
import { NotificationsProcessor } from "../src/notifications/notifications.processor";

interface StoredBuilding {
  id: string;
  venue_id: string;
  name: string;
  graph_version: number;
}

interface StoredFacility {
  id: string;
  venue_id: string;
  building_id: string | null;
  name: string;
  facility_type: FacilityType;
  operational_status: OperationalStatus;
  verification_level: VerificationLevel;
  last_verified_at: Date | null;
}

interface StoredNode {
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

interface StoredEdge {
  id: string;
  building_id: string;
  from_node_id: string;
  to_node_id: string;
  distance_meters: number;
  connection_type: ConnectionType;
  step_free: boolean;
  operational_status: OperationalStatus;
  verification_level: VerificationLevel;
  created_at: Date;
}

describe("Route API & Invalidation (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const testOrgId = randomUUID();
  const testVenueId = randomUUID();
  const testBuildingId = randomUUID();
  const testFacilityId = randomUUID();

  const nodeEntranceId = randomUUID();
  const nodeLift0Id = randomUUID();
  const nodeLift1Id = randomUUID();
  const nodeRamp0Id = randomUUID();
  const nodeRamp1Id = randomUUID();
  const nodeDest1Id = randomUUID();

  const edgeLiftId = randomUUID();

  const userRegular = { id: randomUUID(), role: UserRole.USER };
  const userOrgAdmin = { id: randomUUID(), role: UserRole.ORGANIZATION_ADMIN };

  let tokenRegular: string;
  let tokenOrgAdmin: string;

  const inMemoryCache = new Map<string, string>();

  let buildingRecord: StoredBuilding = {
    id: testBuildingId,
    venue_id: testVenueId,
    name: "Science Hall",
    graph_version: 1,
  };

  let facilityRecord: StoredFacility = {
    id: testFacilityId,
    venue_id: testVenueId,
    building_id: testBuildingId,
    name: "Main Elevator",
    facility_type: FacilityType.ELEVATOR,
    operational_status: OperationalStatus.OPERATIONAL,
    verification_level: VerificationLevel.CONFIRMED,
    last_verified_at: new Date(),
  };

  const storedNodes: StoredNode[] = [
    {
      id: nodeEntranceId,
      building_id: testBuildingId,
      floor_id: "fl-0",
      floor_number: 0,
      node_type: "ENTRANCE",
      name: "Entrance",
      latitude: 12.9716,
      longitude: 77.5946,
      is_accessible: true,
    },
    {
      id: nodeLift0Id,
      building_id: testBuildingId,
      floor_id: "fl-0",
      floor_number: 0,
      node_type: "LOBBY",
      name: "Ground Lift Lobby",
      latitude: 12.9717,
      longitude: 77.5947,
      is_accessible: true,
    },
    {
      id: nodeLift1Id,
      building_id: testBuildingId,
      floor_id: "fl-1",
      floor_number: 1,
      node_type: "LOBBY",
      name: "Floor 1 Lift Lobby",
      latitude: 12.9717,
      longitude: 77.5947,
      is_accessible: true,
    },
    {
      id: nodeRamp0Id,
      building_id: testBuildingId,
      floor_id: "fl-0",
      floor_number: 0,
      node_type: "RAMP_START",
      name: "Ground Ramp Start",
      latitude: 12.9718,
      longitude: 77.5948,
      is_accessible: true,
    },
    {
      id: nodeRamp1Id,
      building_id: testBuildingId,
      floor_id: "fl-1",
      floor_number: 1,
      node_type: "RAMP_END",
      name: "Floor 1 Ramp Landing",
      latitude: 12.9718,
      longitude: 77.5948,
      is_accessible: true,
    },
    {
      id: nodeDest1Id,
      building_id: testBuildingId,
      floor_id: "fl-1",
      floor_number: 1,
      node_type: "ROOM",
      name: "Room 101",
      latitude: 12.9719,
      longitude: 77.5949,
      is_accessible: true,
    },
  ];

  let storedEdges: StoredEdge[] = [
    {
      id: randomUUID(),
      building_id: testBuildingId,
      from_node_id: nodeEntranceId,
      to_node_id: nodeLift0Id,
      distance_meters: 10,
      connection_type: ConnectionType.CORRIDOR,
      step_free: true,
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      created_at: new Date(),
    },
    {
      id: edgeLiftId,
      building_id: testBuildingId,
      from_node_id: nodeLift0Id,
      to_node_id: nodeLift1Id,
      distance_meters: 4,
      connection_type: ConnectionType.ELEVATOR,
      step_free: true,
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      building_id: testBuildingId,
      from_node_id: nodeLift1Id,
      to_node_id: nodeDest1Id,
      distance_meters: 10,
      connection_type: ConnectionType.CORRIDOR,
      step_free: true,
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      building_id: testBuildingId,
      from_node_id: nodeEntranceId,
      to_node_id: nodeRamp0Id,
      distance_meters: 15,
      connection_type: ConnectionType.CORRIDOR,
      step_free: true,
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      building_id: testBuildingId,
      from_node_id: nodeRamp0Id,
      to_node_id: nodeRamp1Id,
      distance_meters: 40,
      connection_type: ConnectionType.RAMP,
      step_free: true,
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      building_id: testBuildingId,
      from_node_id: nodeRamp1Id,
      to_node_id: nodeDest1Id,
      distance_meters: 15,
      connection_type: ConnectionType.CORRIDOR,
      step_free: true,
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      created_at: new Date(),
    },
  ];

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn(async (strings: unknown) => {
      const sql = Array.isArray(strings) ? strings.join(" ") : String(strings);
      if (sql.includes("map_nodes")) {
        return storedNodes.map((n) => ({ ...n }));
      }
      return [{ 1: 1 }];
    }),
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        facility: {
          findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
            if (where.id === facilityRecord.id) {
              return { ...facilityRecord };
            }
            return null;
          }),
          update: jest.fn(
            async ({
              where,
              data,
            }: {
              where: { id: string };
              data: {
                operational_status: OperationalStatus;
                verification_level?: VerificationLevel;
              };
            }) => {
              if (where.id === facilityRecord.id) {
                facilityRecord = {
                  ...facilityRecord,
                  operational_status: data.operational_status,
                  verification_level: data.verification_level ?? facilityRecord.verification_level,
                  last_verified_at: new Date(),
                };

                storedEdges = storedEdges.map((e) => {
                  if (e.id === edgeLiftId) {
                    return { ...e, operational_status: data.operational_status };
                  }
                  return e;
                });

                return { ...facilityRecord };
              }
              return null;
            },
          ),
        },
        building: {
          update: jest.fn(async ({ where }: { where: { id: string } }) => {
            if (where.id === buildingRecord.id) {
              buildingRecord = {
                ...buildingRecord,
                graph_version: buildingRecord.graph_version + 1,
              };
              return { ...buildingRecord };
            }
            return null;
          }),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: randomUUID() }),
        },
      };
      return cb(tx);
    }),
    organizationMember: {
      findUnique: jest.fn(
        async ({
          where,
        }: {
          where: { organization_id_user_id: { organization_id: string; user_id: string } };
        }) => {
          if (
            where.organization_id_user_id.organization_id === testOrgId &&
            where.organization_id_user_id.user_id === userOrgAdmin.id
          ) {
            return {
              id: "mem-1",
              organization_id: testOrgId,
              user_id: userOrgAdmin.id,
              role: UserRole.ORGANIZATION_ADMIN,
            };
          }
          return null;
        },
      ),
    },
    facility: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === facilityRecord.id) {
          return {
            ...facilityRecord,
            venue: { organization_id: testOrgId },
          };
        }
        return null;
      }),
    },
    building: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === buildingRecord.id) {
          return {
            ...buildingRecord,
            venue: { organization_id: testOrgId },
          };
        }
        return null;
      }),
    },
    mapNode: {
      findMany: jest.fn(async () =>
        storedNodes.map((n) => ({
          ...n,
          floor: { floor_number: n.floor_number },
        })),
      ),
    },
    mapEdge: {
      findMany: jest.fn(async () => storedEdges.map((e) => ({ ...e }))),
    },
  };

  const mockRedis = {
    get: jest.fn(async (key: string) => {
      const val = inMemoryCache.get(key);
      if (!val) return null;
      return JSON.parse(val);
    }),
    set: jest.fn(async (key: string, value: unknown) => {
      inMemoryCache.set(key, JSON.stringify(value));
      return true;
    }),
    del: jest.fn(async (key: string) => {
      inMemoryCache.delete(key);
      return true;
    }),
    deleteByPattern: jest.fn(async (pattern: string) => {
      let count = 0;
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      for (const k of inMemoryCache.keys()) {
        if (regex.test(k)) {
          inMemoryCache.delete(k);
          count++;
        }
      }
      return count;
    }),
    isHealthy: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    process.env.DATABASE_URL =
      "postgresql://pathpulse:pathpulse_dev_password@localhost:5432/pathpulse";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET = "dev-pathpulse-jwt-access-secret-32-chars-long";
    process.env.JWT_REFRESH_SECRET = "dev-pathpulse-jwt-refresh-secret-32-chars-long";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.TEST_REDIS_URL = "redis://localhost:6379/1";
    process.env.ROUTE_CACHE_TTL_SECONDS = "900";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .overrideProvider(getQueueToken("report-notifications"))
      .useValue({
        add: jest.fn().mockResolvedValue({ id: "job-1" }),
      })
      .overrideProvider(NotificationsProcessor)
      .useValue({})
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
    tokenOrgAdmin = jwtService.sign(
      { sub: userOrgAdmin.id, role: userOrgAdmin.role },
      { secret: accessSecret },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/routes returns 200 with cache MISS, then identical request returns cache HIT", async () => {
    const payload = {
      buildingId: testBuildingId,
      originNodeId: nodeEntranceId,
      destinationNodeId: nodeDest1Id,
      profile: "WHEELCHAIR",
    };

    const firstRes = await request(app.getHttpServer())
      .post("/api/v1/routes")
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send(payload)
      .expect(200);

    expect(firstRes.body.status).toBe("FOUND");
    expect(firstRes.body.cache).toBe("MISS");
    expect(firstRes.body.totalDistanceMeters).toBe(24);
    const firstEdges = firstRes.body.steps.map((s: { edgeId: string }) => s.edgeId);
    expect(firstEdges).toContain(edgeLiftId);

    const secondRes = await request(app.getHttpServer())
      .post("/api/v1/routes")
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send(payload)
      .expect(200);

    expect(secondRes.body.status).toBe("FOUND");
    expect(secondRes.body.cache).toBe("HIT");
    expect(secondRes.body.totalDistanceMeters).toBe(24);
  });

  it("PATCH /api/v1/facilities/:id/status increments graphVersion, clears cache, and subsequent route request avoids lift", async () => {
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/facilities/${testFacilityId}/status`)
      .set("Authorization", `Bearer ${tokenOrgAdmin}`)
      .send({
        status: OperationalStatus.OUT_OF_SERVICE,
      })
      .expect(200);

    expect(patchRes.body.operational_status).toBe(OperationalStatus.OUT_OF_SERVICE);
    expect(patchRes.body.graphVersion).toBe(2);

    const payload = {
      buildingId: testBuildingId,
      originNodeId: nodeEntranceId,
      destinationNodeId: nodeDest1Id,
      profile: "WHEELCHAIR",
    };

    const thirdRes = await request(app.getHttpServer())
      .post("/api/v1/routes")
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send(payload)
      .expect(200);

    expect(thirdRes.body.status).toBe("FOUND");
    expect(thirdRes.body.cache).toBe("MISS");
    expect(thirdRes.body.totalDistanceMeters).toBe(70);
    const thirdEdges = thirdRes.body.steps.map((s: { edgeId: string }) => s.edgeId);
    expect(thirdEdges).not.toContain(edgeLiftId);
  });

  it("POST /api/v1/routes with an unknown node returns 404", async () => {
    const unknownNodeId = randomUUID();
    const payload = {
      buildingId: testBuildingId,
      originNodeId: nodeEntranceId,
      destinationNodeId: unknownNodeId,
      profile: "WHEELCHAIR",
    };

    const res = await request(app.getHttpServer())
      .post("/api/v1/routes")
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send(payload)
      .expect(404);

    expect(res.body.statusCode).toBe(404);
  });

  it("PATCH /api/v1/facilities/:id/status called by a regular USER returns 403", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/facilities/${testFacilityId}/status`)
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send({ status: OperationalStatus.OPERATIONAL })
      .expect(403);

    expect(res.body.statusCode).toBe(403);
  });

  it("POST /api/v1/routes without an authorization token returns 401", async () => {
    const payload = {
      buildingId: testBuildingId,
      originNodeId: nodeEntranceId,
      destinationNodeId: nodeDest1Id,
      profile: "WHEELCHAIR",
    };

    const res = await request(app.getHttpServer()).post("/api/v1/routes").send(payload).expect(401);

    expect(res.body.statusCode).toBe(401);
  });

  it("POST /api/v1/routes with a malformed UUID returns 400", async () => {
    const payload = {
      buildingId: "not-a-valid-uuid",
      originNodeId: nodeEntranceId,
      destinationNodeId: nodeDest1Id,
      profile: "WHEELCHAIR",
    };

    const res = await request(app.getHttpServer())
      .post("/api/v1/routes")
      .set("Authorization", `Bearer ${tokenRegular}`)
      .send(payload)
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });
});
