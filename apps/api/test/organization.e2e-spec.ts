import { getQueueToken } from "@nestjs/bullmq";
import { INestApplication, NotFoundException, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { FacilityType, OperationalStatus, UserRole, VerificationLevel } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";
import { NotificationsProcessor } from "../src/notifications/notifications.processor";
import { StorageService } from "../src/reports/storage.service";
import { RealtimeGateway } from "../src/realtime/realtime.gateway";
import { Socket } from "socket.io";

interface StoredFacility {
  id: string;
  venue_id: string;
  building_id: string | null;
  floor_id: string | null;
  node_id: string | null;
  facility_type: FacilityType;
  name: string;
  operational_status: OperationalStatus;
  verification_level: VerificationLevel;
  last_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

describe("Organization Dashboard, Facility Controls, and Real-Time Gateway (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let moduleFixture: TestingModule;

  const orgOneId = "org-campus-north";
  const orgTwoId = "org-campus-south";

  const orgOneAdmin = { id: "user-admin-org1", role: UserRole.ORGANIZATION_ADMIN };
  const orgTwoAdmin = { id: "user-admin-org2", role: UserRole.ORGANIZATION_ADMIN };
  const regularUser = { id: "user-standard", role: UserRole.USER };

  let tokenOrgOneAdmin: string;
  let tokenOrgTwoAdmin: string;
  let tokenRegularUser: string;

  const storedBuildings = new Map<
    string,
    {
      id: string;
      venue_id: string;
      name: string;
      building_code: string;
      graph_version: number;
      created_at: Date;
      updated_at: Date;
    }
  >();
  const storedVenues = new Map<string, { id: string; organization_id: string; name: string }>();
  const storedFacilities = new Map<string, StoredFacility>();
  const storedAuditLogs: Array<{
    action: string;
    entity_id: string;
    from_status: string;
    to_status: string;
    changes: unknown;
  }> = [];

  beforeAll(async () => {
    storedVenues.set("ven-1", { id: "ven-1", organization_id: orgOneId, name: "North Quad" });
    storedVenues.set("ven-2", { id: "ven-2", organization_id: orgTwoId, name: "South Quad" });

    storedBuildings.set("bld-1", {
      id: "bld-1",
      venue_id: "ven-1",
      name: "Engineering Hall",
      building_code: "ENG-101",
      graph_version: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    storedFacilities.set("fac-lift-1", {
      id: "fac-lift-1",
      venue_id: "ven-1",
      building_id: "bld-1",
      floor_id: "flr-1",
      node_id: "node-lift",
      facility_type: FacilityType.ELEVATOR,
      name: "Central Lift",
      operational_status: OperationalStatus.OPERATIONAL,
      verification_level: VerificationLevel.CONFIRMED,
      last_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    const mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      organization: {
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === orgOneId) return { id: orgOneId, name: "North Organization" };
          if (where.id === orgTwoId) return { id: orgTwoId, name: "South Organization" };
          return null;
        }),
      },
      organizationMember: {
        findUnique: jest.fn(
          async ({
            where,
          }: {
            where: { organization_id_user_id: { organization_id: string; user_id: string } };
          }) => {
            const { organization_id, user_id } = where.organization_id_user_id;
            if (organization_id === orgOneId && user_id === orgOneAdmin.id) {
              return {
                organization_id: orgOneId,
                user_id: orgOneAdmin.id,
                role: UserRole.ORGANIZATION_ADMIN,
              };
            }
            if (organization_id === orgTwoId && user_id === orgTwoAdmin.id) {
              return {
                organization_id: orgTwoId,
                user_id: orgTwoAdmin.id,
                role: UserRole.ORGANIZATION_ADMIN,
              };
            }
            return null;
          },
        ),
      },
      venue: {
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          return storedVenues.get(where.id) ?? null;
        }),
      },
      building: {
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          const b = storedBuildings.get(where.id);
          if (!b) return null;
          const v = storedVenues.get(b.venue_id);
          return {
            ...b,
            venue: v ? { organization_id: v.organization_id } : { organization_id: null },
          };
        }),
        findMany: jest.fn(async ({ where }: { where: { venue: { organization_id: string } } }) => {
          const matchedVenues = Array.from(storedVenues.values()).filter(
            (v) => v.organization_id === where.venue.organization_id,
          );
          const venueIds = new Set(matchedVenues.map((v) => v.id));
          const buildings = Array.from(storedBuildings.values()).filter((b) =>
            venueIds.has(b.venue_id),
          );
          return buildings.map((b) => ({
            ...b,
            venue: storedVenues.get(b.venue_id)!,
            _count: { floors: 3, facilities: 4 },
          }));
        }),
        update: jest.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: { graph_version: { increment: number } };
          }) => {
            const b = storedBuildings.get(where.id);
            if (!b) throw new NotFoundException();
            b.graph_version += data.graph_version?.increment ?? 1;
            storedBuildings.set(where.id, b);
            return { id: b.id, graph_version: b.graph_version };
          },
        ),
      },
      facility: {
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          const f = storedFacilities.get(where.id);
          if (!f) return null;
          const v = storedVenues.get(f.venue_id);
          return {
            ...f,
            venue: v ? { organization_id: v.organization_id } : { organization_id: null },
          };
        }),
        count: jest.fn(async () => storedFacilities.size),
        findMany: jest.fn(async () => {
          return Array.from(storedFacilities.values()).map((f) => ({
            ...f,
            venue: storedVenues.get(f.venue_id)!,
            building: f.building_id ? storedBuildings.get(f.building_id)! : null,
            floor: { id: "flr-1", name: "Ground Floor", floor_number: 1 },
          }));
        }),
      },
      maintenanceTask: {
        count: jest.fn(async () => 1),
        findMany: jest.fn(async () => [
          {
            id: "task-1",
            report_id: "rep-1",
            organization_id: orgOneId,
            assigned_to_id: "user-worker",
            status: "PENDING",
            priority: "HIGH",
            resolution_notes: null,
            resolved_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            assigned_to: { id: "user-worker", name: "Worker One" },
            report: {
              id: "rep-1",
              tracking_code: "REP-9999",
              title: "Broken Lift",
              category: "BROKEN_LIFT",
            },
          },
        ]),
      },
      auditLog: {
        create: jest.fn(
          async ({
            data,
          }: {
            data: {
              action: string;
              entity_id: string;
              from_status: string;
              to_status: string;
              changes: unknown;
            };
          }) => {
            storedAuditLogs.push(data);
            return { id: "audit-1", ...data };
          },
        ),
      },
      $queryRaw: jest.fn(async () => {
        return [{ coverage: 90.0, count: 2 }];
      }),
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $queryRaw: jest.fn(async () => {
            const fac = storedFacilities.get("fac-lift-1");
            return fac ? [fac] : [];
          }),
          facility: {
            findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
              return storedFacilities.get(where.id) ?? null;
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
                  last_verified_at?: Date;
                };
              }) => {
                const f = storedFacilities.get(where.id);
                if (!f) throw new NotFoundException();
                f.operational_status = data.operational_status;
                if (data.verification_level) f.verification_level = data.verification_level;
                if (data.last_verified_at) f.last_verified_at = data.last_verified_at;
                storedFacilities.set(where.id, f);
                return { ...f };
              },
            ),
          },
          building: {
            findUnique: jest.fn(
              async ({ where }: { where: { id: string } }) => storedBuildings.get(where.id) ?? null,
            ),
            update: jest.fn(
              async ({
                where,
                data,
              }: {
                where: { id: string };
                data: { graph_version: { increment: number } };
              }) => {
                const b = storedBuildings.get(where.id);
                if (!b) throw new NotFoundException();
                b.graph_version += data.graph_version?.increment ?? 1;
                storedBuildings.set(where.id, b);
                return { id: b.id, graph_version: b.graph_version };
              },
            ),
          },
          venue: {
            findUnique: jest.fn(
              async ({ where }: { where: { id: string } }) => storedVenues.get(where.id) ?? null,
            ),
          },
          organizationMember: {
            findUnique: jest.fn(
              async ({
                where,
              }: {
                where: { organization_id_user_id: { organization_id: string; user_id: string } };
              }) => {
                const { organization_id, user_id } = where.organization_id_user_id;
                if (organization_id === orgOneId && user_id === orgOneAdmin.id) {
                  return {
                    organization_id: orgOneId,
                    user_id: orgOneAdmin.id,
                    role: UserRole.ORGANIZATION_ADMIN,
                  };
                }
                return null;
              },
            ),
          },
          auditLog: {
            create: jest.fn(
              async ({
                data,
              }: {
                data: {
                  action: string;
                  entity_id: string;
                  from_status: string;
                  to_status: string;
                  changes: unknown;
                };
              }) => {
                storedAuditLogs.push(data);
                return { id: "audit-tx-1", ...data };
              },
            ),
          },
        };
        return cb(tx);
      }),
    };

    const mockStorage = {
      getPresignedPutUrl: jest.fn().mockResolvedValue("https://s3.local/put"),
      getPresignedGetUrl: jest.fn().mockResolvedValue("https://s3.local/get"),
      headObject: jest.fn().mockResolvedValue({ contentLength: 1000, contentType: "image/jpeg" }),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(StorageService)
      .useValue(mockStorage)
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
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    const secret = process.env.JWT_ACCESS_SECRET || "dev-pathpulse-jwt-access-secret-32-chars-long";

    tokenOrgOneAdmin = jwtService.sign({ sub: orgOneAdmin.id, role: orgOneAdmin.role }, { secret });
    tokenOrgTwoAdmin = jwtService.sign({ sub: orgTwoAdmin.id, role: orgTwoAdmin.role }, { secret });
    tokenRegularUser = jwtService.sign({ sub: regularUser.id, role: regularUser.role }, { secret });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/v1/organizations/:orgId/dashboard", () => {
    it("should return metrics for authorized organization admin", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgOneId}/dashboard`)
        .set("Authorization", `Bearer ${tokenOrgOneAdmin}`)
        .expect(200);

      expect(res.body).toHaveProperty("verifiedRouteCoverage");
      expect(res.body).toHaveProperty("pendingIssues");
      expect(res.body).toHaveProperty("verifiedFacilities");
      expect(res.body).toHaveProperty("resolvedReports");
      expect(res.body).toHaveProperty("generatedAt");
    });

    it("should return 403 when an admin from another organization requests dashboard", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgOneId}/dashboard`)
        .set("Authorization", `Bearer ${tokenOrgTwoAdmin}`)
        .expect(403);
    });

    it("should return 403 when a regular user requests dashboard", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgOneId}/dashboard`)
        .set("Authorization", `Bearer ${tokenRegularUser}`)
        .expect(403);
    });
  });

  describe("GET /api/v1/organizations/:orgId/buildings", () => {
    it("should return buildings for the organization", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgOneId}/buildings`)
        .set("Authorization", `Bearer ${tokenOrgOneAdmin}`)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items[0].name).toBe("Engineering Hall");
    });
  });

  describe("GET /api/v1/organizations/:orgId/facilities", () => {
    it("should return paginated facilities for the organization", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgOneId}/facilities?buildingId=bld-1`)
        .set("Authorization", `Bearer ${tokenOrgOneAdmin}`)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBeDefined();
    });
  });

  describe("PATCH /api/v1/facilities/:id/status", () => {
    it("should reject facility status update from regular user with 403", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/facilities/fac-lift-1/status")
        .set("Authorization", `Bearer ${tokenRegularUser}`)
        .send({ status: "OUT_OF_SERVICE" })
        .expect(403);
    });

    it("should update facility status, increment graphVersion, and create audit log", async () => {
      const initialVersion = storedBuildings.get("bld-1")!.graph_version;

      const res = await request(app.getHttpServer())
        .patch("/api/v1/facilities/fac-lift-1/status")
        .set("Authorization", `Bearer ${tokenOrgOneAdmin}`)
        .send({ status: "OUT_OF_SERVICE", verificationLevel: "CONFIRMED" })
        .expect(200);

      expect(res.body.operational_status).toBe("OUT_OF_SERVICE");
      expect(res.body.graphVersion).toBe(initialVersion + 1);

      const updatedBuilding = storedBuildings.get("bld-1");
      expect(updatedBuilding?.graph_version).toBe(initialVersion + 1);

      expect(storedAuditLogs.length).toBeGreaterThan(0);
      const audit = storedAuditLogs[storedAuditLogs.length - 1];
      expect(audit).toBeDefined();
      expect(audit?.action).toBe("FACILITY_STATUS_CHANGED");
    });
  });

  describe("Real-time WebSocket Gateway", () => {
    let realtimeGateway: RealtimeGateway;

    beforeAll(() => {
      realtimeGateway = moduleFixture.get<RealtimeGateway>(RealtimeGateway);
    });

    it("should disconnect unauthenticated socket connection during handshake", async () => {
      const mockSocket = {
        id: "sock-unauth",
        handshake: { auth: {}, headers: {} },
        emit: jest.fn(),
        disconnect: jest.fn(),
        data: {},
      } as unknown as Socket;

      await realtimeGateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "Authentication required",
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it("should disconnect socket with invalid token during handshake", async () => {
      const mockSocket = {
        id: "sock-invalid",
        handshake: { auth: { token: "bad-token" }, headers: {} },
        emit: jest.fn(),
        disconnect: jest.fn(),
        data: {},
      } as unknown as Socket;

      await realtimeGateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "Invalid or expired token",
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it("should authenticate socket with valid token and join room on subscription", async () => {
      const mockSocket = {
        id: "sock-auth",
        handshake: { auth: { token: tokenOrgOneAdmin }, headers: {} },
        emit: jest.fn(),
        disconnect: jest.fn(),
        join: jest.fn(),
        data: {},
      } as unknown as Socket;

      await realtimeGateway.handleConnection(mockSocket);

      expect(mockSocket.data.user).toBeDefined();
      expect(mockSocket.data.user.id).toBe(orgOneAdmin.id);
      expect(mockSocket.disconnect).not.toHaveBeenCalled();

      await realtimeGateway.handleSubscribeBuilding(mockSocket, { buildingId: "bld-1" });

      expect(mockSocket.join).toHaveBeenCalledWith("building:bld-1");
      expect(mockSocket.emit).toHaveBeenCalledWith("subscribed", {
        buildingId: "bld-1",
        room: "building:bld-1",
      });
    });

    it("should broadcast facility status change to subscribed room after PATCH", async () => {
      const broadcastSpy = jest.spyOn(realtimeGateway, "broadcastFacilityStatus");

      await request(app.getHttpServer())
        .patch("/api/v1/facilities/fac-lift-1/status")
        .set("Authorization", `Bearer ${tokenOrgOneAdmin}`)
        .send({ status: "OPERATIONAL", verificationLevel: "CONFIRMED" })
        .expect(200);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          buildingId: "bld-1",
          facilityId: "fac-lift-1",
          status: "OPERATIONAL",
        }),
      );
    });
  });
});
