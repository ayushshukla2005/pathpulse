import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { OperationalStatus, VerificationLevel } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../database/prisma.service";
import { RealtimeGateway } from "./realtime.gateway";
import { FacilityStatusBroadcast } from "./realtime.types";

describe("RealtimeGateway", () => {
  let gateway: RealtimeGateway;
  let mockJwtService: { verifyAsync: jest.Mock };
  let mockConfigService: { get: jest.Mock };
  let mockPrisma: { building: { findUnique: jest.Mock } };
  let mockServer: { to: jest.Mock };
  let mockEmitToRoom: jest.Mock;

  beforeEach(() => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === "jwtAccessSecret") return "test-access-secret-32-chars-length";
        if (key === "wsSubscriptionRateLimit") return 2;
        return null;
      }),
    };
    mockPrisma = {
      building: {
        findUnique: jest.fn().mockResolvedValue({ id: "bld-1" }),
      },
    };

    mockEmitToRoom = jest.fn();
    mockServer = {
      to: jest.fn().mockReturnValue({ emit: mockEmitToRoom }),
    };

    gateway = new RealtimeGateway(
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
      mockPrisma as unknown as PrismaService,
    );
    gateway.server = mockServer as unknown as Server;
  });

  it("should disconnect unauthenticated socket during connection handshake", async () => {
    const mockSocket = {
      id: "sock-1",
      handshake: { auth: {}, headers: {} },
      emit: jest.fn(),
      disconnect: jest.fn(),
      data: {},
    } as unknown as Socket;

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.emit).toHaveBeenCalledWith("error", {
      message: "Authentication required",
    });
    expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
  });

  it("should disconnect socket when token verification fails", async () => {
    const mockSocket = {
      id: "sock-2",
      handshake: { auth: { token: "invalid-token" }, headers: {} },
      emit: jest.fn(),
      disconnect: jest.fn(),
      data: {},
    } as unknown as Socket;

    mockJwtService.verifyAsync.mockRejectedValue(new Error("Token expired"));

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.emit).toHaveBeenCalledWith("error", {
      message: "Invalid or expired token",
    });
    expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
  });

  it("should attach user data when token is valid", async () => {
    const mockSocket = {
      id: "sock-3",
      handshake: { auth: { token: "valid-token" }, headers: {} },
      emit: jest.fn(),
      disconnect: jest.fn(),
      data: {},
    } as unknown as Socket;

    mockJwtService.verifyAsync.mockResolvedValue({
      sub: "user-123",
      role: "ORGANIZATION_ADMIN",
    });

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.data.user).toEqual({
      id: "user-123",
      role: "ORGANIZATION_ADMIN",
    });
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });

  it("should join room when subscribing to a valid building", async () => {
    const mockSocket = {
      id: "sock-4",
      join: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    await gateway.handleSubscribeBuilding(mockSocket, { buildingId: "bld-1" });

    expect(mockPrisma.building.findUnique).toHaveBeenCalledWith({
      where: { id: "bld-1" },
      select: { id: true },
    });
    expect(mockSocket.join).toHaveBeenCalledWith("building:bld-1");
    expect(mockSocket.emit).toHaveBeenCalledWith("subscribed", {
      buildingId: "bld-1",
      room: "building:bld-1",
    });
  });

  it("should enforce rate limit on repeated subscription attempts per socket", async () => {
    const mockSocket = {
      id: "sock-rate-limit",
      join: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    await gateway.handleSubscribeBuilding(mockSocket, { buildingId: "bld-1" });
    await gateway.handleSubscribeBuilding(mockSocket, { buildingId: "bld-1" });
    await gateway.handleSubscribeBuilding(mockSocket, { buildingId: "bld-1" });

    expect(mockSocket.emit).toHaveBeenCalledWith("error", {
      message: "Subscription rate limit exceeded",
    });
  });

  it("should leave room on unsubscribe", async () => {
    const mockSocket = {
      id: "sock-5",
      leave: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    await gateway.handleUnsubscribeBuilding(mockSocket, { buildingId: "bld-1" });

    expect(mockSocket.leave).toHaveBeenCalledWith("building:bld-1");
    expect(mockSocket.emit).toHaveBeenCalledWith("unsubscribed", { buildingId: "bld-1" });
  });

  it("should broadcast facility status change to the building room with public fields only", () => {
    const broadcastPayload: FacilityStatusBroadcast = {
      facilityId: "fac-1",
      facilityType: "ELEVATOR",
      name: "Main Elevator",
      buildingId: "bld-1",
      status: OperationalStatus.OUT_OF_SERVICE,
      verificationLevel: VerificationLevel.CONFIRMED,
      lastVerifiedAt: "2026-11-08T20:00:00.000Z",
      graphVersion: 4,
    };

    gateway.broadcastFacilityStatus(broadcastPayload);

    expect(mockServer.to).toHaveBeenCalledWith("building:bld-1");
    expect(mockEmitToRoom).toHaveBeenCalledWith("facility.status.changed", broadcastPayload);
  });
});
