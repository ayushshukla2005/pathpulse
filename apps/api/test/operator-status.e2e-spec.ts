import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  DataSource,
  FacilityType,
  OperationalStatus,
  PrismaClient,
  VerificationLevel,
} from "@prisma/client";
import { ApiKeyService } from "../src/operator/api-key.service";
import { ApiKeyAuthGuard, RequestWithApiKey } from "../src/operator/guards/api-key-auth.guard";
import { OperatorFacilitiesController } from "../src/operator/operator-facilities.controller";
import { PrismaService } from "../src/database/prisma.service";
import { FacilitiesService } from "../src/facilities/facilities.service";
import { RedisService } from "../src/cache/redis.service";

describe("Operator Status Feed Pipeline", () => {
  const prisma = new PrismaClient();
  let prismaService: PrismaService;
  let redisService: RedisService;
  let eventEmitter: EventEmitter2;
  let facilitiesService: FacilitiesService;
  let apiKeyService: ApiKeyService;
  let apiKeyGuard: ApiKeyAuthGuard;
  let controller: OperatorFacilitiesController;

  let orgAId: string;
  let orgBId: string;
  let venueId: string;
  let facilityId: string;

  beforeAll(async () => {
    await prisma.$connect();
    prismaService = prisma as unknown as PrismaService;

    redisService = {
      deleteByPattern: jest.fn().mockResolvedValue(0),
    } as unknown as RedisService;

    eventEmitter = {
      emit: jest.fn(),
    } as unknown as EventEmitter2;

    facilitiesService = new FacilitiesService(prismaService, redisService, eventEmitter);
    apiKeyService = new ApiKeyService(prismaService);
    apiKeyGuard = new ApiKeyAuthGuard(apiKeyService);
    controller = new OperatorFacilitiesController(prismaService, facilitiesService);

    const orgA = await prisma.organization.create({
      data: {
        name: "Operator Test Org A",
        slug: `org-a-${Date.now()}`,
      },
    });
    orgAId = orgA.id;

    const orgB = await prisma.organization.create({
      data: {
        name: "Operator Test Org B",
        slug: `org-b-${Date.now()}`,
      },
    });
    orgBId = orgB.id;

    const venue = await prisma.venue.create({
      data: {
        name: "Operator Test Venue",
        category: "TRANSIT",
        organization_id: orgAId,
        latitude: 12.97,
        longitude: 77.59,
        source: DataSource.OPERATOR,
        sourceRef: `venue-${Date.now()}`,
      },
    });
    venueId = venue.id;

    const facility = await prisma.facility.create({
      data: {
        venue_id: venueId,
        name: "Central Platform Elevator",
        facility_type: FacilityType.ELEVATOR,
        operational_status: OperationalStatus.OPERATIONAL,
        verification_level: VerificationLevel.CONFIRMED,
        source: DataSource.OPERATOR,
        sourceRef: `fac-${Date.now()}`,
      },
    });
    facilityId = facility.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function createMockExecutionContext(authHeader?: string): {
    context: ExecutionContext;
    request: RequestWithApiKey;
  } {
    const request = {
      headers: {
        authorization: authHeader,
      },
    } as unknown as RequestWithApiKey;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  it("authenticates and updates status with a valid key for the organization", async () => {
    const { apiKey, secretKey } = await apiKeyService.createApiKey(orgAId, [
      "FACILITY_STATUS_WRITE",
    ]);

    const { context, request } = createMockExecutionContext(`Bearer ${secretKey}`);
    const canActivate = await apiKeyGuard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(request.apiKey).toBeDefined();
    expect(request.apiKey?.id).toBe(apiKey.id);

    const result = await controller.updateFacilityStatus(
      facilityId,
      { operationalStatus: OperationalStatus.OUT_OF_SERVICE },
      request,
    );

    expect(result.operational_status).toBe(OperationalStatus.OUT_OF_SERVICE);

    const updatedInDb = await prisma.facility.findUnique({
      where: { id: facilityId },
    });
    expect(updatedInDb?.operational_status).toBe(OperationalStatus.OUT_OF_SERVICE);
    expect(updatedInDb?.verification_level).toBe(VerificationLevel.CONFIRMED);

    const auditLog = await prisma.auditLog.findFirst({
      where: { entity_id: facilityId },
      orderBy: { created_at: "desc" },
    });
    expect(auditLog?.actor_user_id).toBe(`operator:${apiKey.keyPrefix}`);
  });

  it("rejects with 403 when updating a facility from a different organization", async () => {
    const { secretKey } = await apiKeyService.createApiKey(orgBId, ["FACILITY_STATUS_WRITE"]);

    const { context, request } = createMockExecutionContext(`Bearer ${secretKey}`);
    await apiKeyGuard.canActivate(context);

    await expect(
      controller.updateFacilityStatus(
        facilityId,
        { operationalStatus: OperationalStatus.OPERATIONAL },
        request,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("rejects with 404 when facility does not exist", async () => {
    const { secretKey } = await apiKeyService.createApiKey(orgAId, ["FACILITY_STATUS_WRITE"]);

    const { context, request } = createMockExecutionContext(`Bearer ${secretKey}`);
    await apiKeyGuard.canActivate(context);

    await expect(
      controller.updateFacilityStatus(
        "00000000-0000-0000-0000-000000000000",
        { operationalStatus: OperationalStatus.OPERATIONAL },
        request,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("rejects with 401 when the key is revoked", async () => {
    const { apiKey, secretKey } = await apiKeyService.createApiKey(orgAId, [
      "FACILITY_STATUS_WRITE",
    ]);
    await apiKeyService.revokeApiKey(apiKey.id);

    const { context } = createMockExecutionContext(`Bearer ${secretKey}`);
    await expect(apiKeyGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects with 403 when key lacks FACILITY_STATUS_WRITE scope", async () => {
    const { secretKey } = await apiKeyService.createApiKey(orgAId, ["READ_ONLY"]);

    const { context } = createMockExecutionContext(`Bearer ${secretKey}`);
    await expect(apiKeyGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("rejects operator attempts to set verificationLevel to CONFIRMED", async () => {
    const { secretKey } = await apiKeyService.createApiKey(orgAId, ["FACILITY_STATUS_WRITE"]);

    const { context, request } = createMockExecutionContext(`Bearer ${secretKey}`);
    await apiKeyGuard.canActivate(context);

    await expect(
      controller.updateFacilityStatus(
        facilityId,
        {
          operationalStatus: OperationalStatus.OPERATIONAL,
          verificationLevel: "CONFIRMED",
        },
        request,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
