import { io } from "socket.io-client";
import { JwtService } from "@nestjs/jwt";

async function run() {
  const jwt = new JwtService();
  const secret = process.env.JWT_ACCESS_SECRET || "dev-pathpulse-jwt-access-secret-32-chars-long";
  const token = jwt.sign({ sub: "test-user-org-admin", role: "ORGANIZATION_ADMIN" }, { secret });

  console.log("=== Testing Socket.IO Connection without token ===");
  const unauthSocket = io("http://localhost:4000/realtime", {
    transports: ["websocket"],
    auth: {},
    autoConnect: true,
  });

  unauthSocket.on("error", (err: unknown) => {
    console.log("Received expected error event on unauthenticated connection:", err);
  });

  unauthSocket.on("disconnect", (reason: string) => {
    console.log("Unauthenticated socket disconnected as expected with reason:", reason);
    unauthSocket.close();
  });

  await new Promise((r) => setTimeout(r, 1000));

  console.log("\n=== Testing Socket.IO Connection with valid token ===");
  const authSocket = io("http://localhost:4000/realtime", {
    transports: ["websocket"],
    auth: { token },
    autoConnect: true,
  });

  authSocket.on("connect", () => {
    console.log("Authenticated socket connected successfully with socket ID:", authSocket.id);
    authSocket.emit("subscribe:building", { buildingId: "bld-test-1" });
  });

  authSocket.on("subscribed", (data: unknown) => {
    console.log("Successfully subscribed to building room:", data);
  });

  authSocket.on("facility.status.changed", (payload: unknown) => {
    console.log("Received real-time facility.status.changed event payload:", payload);
    authSocket.close();
    process.exit(0);
  });

  authSocket.on("error", (err: unknown) => {
    console.log("Auth socket error:", err);
  });

  setTimeout(() => {
    console.log("Verification finished.");
    authSocket.close();
    process.exit(0);
  }, 4000);
}

run();
