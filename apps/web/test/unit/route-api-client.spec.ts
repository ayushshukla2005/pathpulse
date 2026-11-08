import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postRoute } from "@/lib/api/routes";
import type { FindRouteRequest } from "@pathpulse/shared-types";

describe("postRoute Status Mapping", () => {
  const sampleRequest: FindRouteRequest = {
    buildingId: "bld-1",
    originNodeId: "node-1",
    destinationNodeId: "node-2",
    profile: "WHEELCHAIR",
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps HTTP 200 response to FOUND RouteSuccessResponse", async () => {
    const successPayload = {
      status: "FOUND",
      steps: [
        {
          fromNodeId: "node-1",
          toNodeId: "node-2",
          edgeId: "edge-1",
          connectionType: "CORRIDOR",
          distanceMeters: 25,
          confidence: "CONFIRMED",
          instruction: "Walk along corridor for 25 metres",
        },
      ],
      totalDistanceMeters: 25,
      accessibility: "STEP_FREE",
      warnings: [],
      cache: "MISS",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => successPayload,
    } as unknown as Response);

    const result = await postRoute(sampleRequest);

    expect(result.status).toBe("FOUND");
    if (result.status === "FOUND") {
      expect(result.steps).toHaveLength(1);
      expect(result.totalDistanceMeters).toBe(25);
      expect(result.accessibility).toBe("STEP_FREE");
      expect(result.warnings).toEqual([]);
    }
  });

  it("maps HTTP 422 response to NO_CONFIRMED_ROUTE domain result", async () => {
    const reasonText =
      "Route requires confirmed accessibility but contains unverified segment: edge-stairs";

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        statusCode: 422,
        error: "Unprocessable Entity",
        message: reasonText,
        path: "/api/v1/routes",
        timestamp: "2026-11-08T12:00:00.000Z",
        requestId: "req-422",
      }),
    } as unknown as Response);

    const result = await postRoute(sampleRequest);

    expect(result.status).toBe("NO_CONFIRMED_ROUTE");
    if (result.status === "NO_CONFIRMED_ROUTE") {
      expect(result.reason).toBe(reasonText);
    }
  });

  it("maps HTTP 404 response to NOT_FOUND domain result", async () => {
    const notFoundText = "Building not found: bld-unknown";

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        statusCode: 404,
        error: "Not Found",
        message: notFoundText,
        path: "/api/v1/routes",
        timestamp: "2026-11-08T12:00:00.000Z",
        requestId: "req-404",
      }),
    } as unknown as Response);

    const result = await postRoute(sampleRequest);

    expect(result.status).toBe("NOT_FOUND");
    if (result.status === "NOT_FOUND") {
      expect(result.reason).toBe(notFoundText);
    }
  });

  it("maps HTTP 400 response to BAD_REQUEST domain result", async () => {
    const badRequestText = "Invalid route request parameters.";

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        statusCode: 400,
        error: "Bad Request",
        message: badRequestText,
        path: "/api/v1/routes",
        timestamp: "2026-11-08T12:00:00.000Z",
        requestId: "req-400",
      }),
    } as unknown as Response);

    const result = await postRoute(sampleRequest);

    expect(result.status).toBe("BAD_REQUEST");
    if (result.status === "BAD_REQUEST") {
      expect(result.reason).toBe(badRequestText);
    }
  });

  it("rethrows unexpected internal server errors like 500", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Database connection failed",
      }),
    } as unknown as Response);

    await expect(postRoute(sampleRequest)).rejects.toThrow("Database connection failed");
  });
});
