import { HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { HealthController } from "./health.controller";
import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../cache/redis.service";

describe("HealthController", () => {
  let controller: HealthController;
  let prismaMock: { $queryRaw: jest.Mock };
  let redisMock: { isHealthy: jest.Mock };
  let resMock: {
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      $queryRaw: jest.fn(),
    };
    redisMock = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };
    resMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new HealthController(
      prismaMock as unknown as PrismaService,
      redisMock as unknown as RedisService,
    );
  });

  describe("GET /health", () => {
    it("should return ok when database and redis are healthy without leaking internals", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

      await controller.check(resMock as unknown as Response);

      expect(resMock.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(resMock.json).toHaveBeenCalledWith({
        status: "ok",
        database: "connected",
        redis: "ok",
        uptime: expect.any(Number),
        version: "0.1.0",
      });

      const responsePayload = resMock.json.mock.calls[0]![0];
      expect(responsePayload.databaseUrl).toBeUndefined();
      expect(responsePayload.redisUrl).toBeUndefined();
      expect(responsePayload.password).toBeUndefined();
      expect(responsePayload.secret).toBeUndefined();
    });

    it("should return degraded when database is disconnected", async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error("Connection failed"));

      await controller.check(resMock as unknown as Response);

      expect(resMock.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(resMock.json).toHaveBeenCalledWith({
        status: "degraded",
        database: "disconnected",
        redis: "ok",
        uptime: expect.any(Number),
        version: "0.1.0",
      });
    });
  });

  describe("GET /health/ready", () => {
    it("should return 503 when database is unreachable", async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error("DB unreachable"));

      await controller.ready(resMock as unknown as Response);

      expect(resMock.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(resMock.json).toHaveBeenCalledWith({
        status: "not_ready",
        reason: "database_unreachable",
      });
    });

    it("should return 200 ready when DB connects and migrations are up to date", async () => {
      prismaMock.$queryRaw
        .mockResolvedValueOnce([{ 1: 1 }])
        .mockResolvedValueOnce([
          { migration_name: "20261107000001_init" },
          { migration_name: "20261107000002_add_postgis_indexes" },
          { migration_name: "20261107000003_add_auth_and_preferences_fields" },
          { migration_name: "20261107000004_add_organization_members_and_facility_types" },
          { migration_name: "20261107000005_add_building_graph_version" },
          { migration_name: "20261108000006_add_report_location_and_evidence_status" },
          { migration_name: "20261108000007_add_report_workflow_fields" },
          { migration_name: "20261108000008_make_audit_logs_append_only" },
          { migration_name: "20261108000009_add_dashboard_and_facility_indexes" },
          { migration_name: "20261108000010_add_ai_suggestions" },
          { migration_name: "20261109000011_add_feedback" },
        ]);

      await controller.ready(resMock as unknown as Response);

      expect(resMock.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(resMock.json).toHaveBeenCalledWith({
        status: "ready",
      });
    });

    it("should return 503 pending_migrations when an applied migration is missing", async () => {
      prismaMock.$queryRaw
        .mockResolvedValueOnce([{ 1: 1 }])
        .mockResolvedValueOnce([{ migration_name: "20261107000001_init" }]);

      await controller.ready(resMock as unknown as Response);

      expect(resMock.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "not_ready",
          reason: "pending_migrations",
        }),
      );
    });
  });
});
