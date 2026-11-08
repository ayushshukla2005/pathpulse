import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../database/prisma.service";
import { FacilityStatusBroadcast, SocketUserData, SubscribeBuildingDto } from "./realtime.types";

interface TokenPayload {
  sub: string;
  role: string;
}

@WebSocketGateway({
  namespace: "/realtime",
  transports: ["websocket"],
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly rateLimits = new Map<string, number[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const rawAuth = client.handshake.auth?.token;
    const headerAuth = client.handshake.headers.authorization;
    let token: string | undefined;

    if (typeof rawAuth === "string" && rawAuth.length > 0) {
      token = rawAuth.startsWith("Bearer ") ? rawAuth.substring(7).trim() : rawAuth.trim();
    } else if (typeof headerAuth === "string" && headerAuth.length > 0) {
      token = headerAuth.startsWith("Bearer ") ? headerAuth.substring(7).trim() : headerAuth.trim();
    }

    if (!token) {
      client.emit("error", { message: "Authentication required" });
      client.disconnect(true);
      return;
    }

    try {
      const secret = this.configService.get<string>("jwtAccessSecret");
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, { secret });
      const userData: SocketUserData = {
        id: payload.sub,
        role: payload.role,
      };
      client.data.user = userData;
    } catch {
      client.emit("error", { message: "Invalid or expired token" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.rateLimits.delete(client.id);
  }

  @SubscribeMessage("subscribe:building")
  async handleSubscribeBuilding(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeBuildingDto,
  ): Promise<void> {
    const buildingId = data?.buildingId;
    if (!buildingId || typeof buildingId !== "string") {
      client.emit("error", { message: "Invalid building ID" });
      return;
    }

    const maxRate = this.configService.get<number>("wsSubscriptionRateLimit") ?? 10;
    const now = Date.now();
    const timestamps = (this.rateLimits.get(client.id) ?? []).filter((t) => now - t < 10000);

    if (timestamps.length >= maxRate) {
      client.emit("error", { message: "Subscription rate limit exceeded" });
      return;
    }

    timestamps.push(now);
    this.rateLimits.set(client.id, timestamps);

    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      select: { id: true },
    });

    if (!building) {
      client.emit("error", { message: "Building not found" });
      return;
    }

    const roomName = `building:${buildingId}`;
    await client.join(roomName);
    client.emit("subscribed", {
      buildingId,
      room: roomName,
    });
  }

  @SubscribeMessage("unsubscribe:building")
  async handleUnsubscribeBuilding(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeBuildingDto,
  ): Promise<void> {
    const buildingId = data?.buildingId;
    if (!buildingId || typeof buildingId !== "string") {
      client.emit("error", { message: "Invalid building ID" });
      return;
    }

    const roomName = `building:${buildingId}`;
    await client.leave(roomName);
    client.emit("unsubscribed", { buildingId });
  }

  broadcastFacilityStatus(payload: FacilityStatusBroadcast): void {
    if (!this.server) {
      return;
    }
    const roomName = `building:${payload.buildingId}`;
    this.server.to(roomName).emit("facility.status.changed", payload);
  }
}
