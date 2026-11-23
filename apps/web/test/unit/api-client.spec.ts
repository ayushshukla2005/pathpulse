import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, setAccessToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { getVenues } from "@/lib/api/venues";
import type { VenueListItem } from "@pathpulse/shared-types";

describe("apiClient Single Body Read & Error Handling", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setAccessToken(null);
  });

  it("returns parsed array for 200 venues response using a real Response object", async () => {
    const venuesData: VenueListItem[] = [
      {
        id: "venue-1",
        organization_id: "org-1",
        name: "Central Station",
        category: "TRANSIT",
        latitude: 12.9716,
        longitude: 77.5946,
        address: "Main Plaza",
        created_at: "2026-11-20T00:00:00.000Z",
        updated_at: "2026-11-20T00:00:00.000Z",
      },
    ];

    const realResponse = new Response(JSON.stringify(venuesData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    global.fetch = vi.fn().mockResolvedValue(realResponse);

    const result = await getVenues();

    expect(result).toEqual(venuesData);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("venue-1");
  });

  it("throws typed ApiError for 404 response using a real Response object", async () => {
    const errorPayload = {
      statusCode: 404,
      error: "Not Found",
      message: "Venue not found",
      path: "/api/v1/venues/missing-id",
      timestamp: "2026-11-23T10:00:00.000Z",
    };

    const realResponse = new Response(JSON.stringify(errorPayload), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

    global.fetch = vi.fn().mockResolvedValue(realResponse);

    try {
      await apiClient("/venues/missing-id");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.message).toBe("Venue not found");
      expect(apiErr.error).toBe("Not Found");
      expect(apiErr.path).toBe("/api/v1/venues/missing-id");
    }
  });

  it("throws typed ApiError for 422 response using a real Response object", async () => {
    const errorPayload = {
      statusCode: 422,
      error: "Unprocessable Entity",
      message: "No confirmed route available for the chosen mobility profile.",
      path: "/api/v1/routes",
      timestamp: "2026-11-23T10:00:00.000Z",
    };

    const realResponse = new Response(JSON.stringify(errorPayload), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });

    global.fetch = vi.fn().mockResolvedValue(realResponse);

    try {
      await apiClient("/routes", { method: "POST" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(422);
      expect(apiErr.message).toBe("No confirmed route available for the chosen mobility profile.");
      expect(apiErr.error).toBe("Unprocessable Entity");
    }
  });

  it("retries request with new token on 401 and parses the second response body", async () => {
    setAccessToken("expired-token");

    const fetchMock = vi.fn();

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/auth/refresh")) {
        return new Response(JSON.stringify({ accessToken: "fresh-new-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const headers = new Headers(init?.headers);
      const authHeader = headers.get("Authorization");

      if (authHeader === "Bearer expired-token") {
        return new Response(JSON.stringify({ message: "Token expired", statusCode: 401 }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (authHeader === "Bearer fresh-new-token") {
        return new Response(JSON.stringify({ success: true, data: "retried-data" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Missing token", statusCode: 401 }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    });

    global.fetch = fetchMock;

    interface ProtectedResponse {
      success: boolean;
      data: string;
    }

    const result = await apiClient<ProtectedResponse>("/protected-resource");

    expect(result).toEqual({ success: true, data: "retried-data" });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const firstCallInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const firstHeaders = new Headers(firstCallInit?.headers);
    expect(firstHeaders.get("Authorization")).toBe("Bearer expired-token");

    const secondCallUrl = String(fetchMock.mock.calls[1]?.[0]);
    expect(secondCallUrl).toContain("/api/auth/refresh");

    const thirdCallInit = fetchMock.mock.calls[2]?.[1] as RequestInit;
    const thirdHeaders = new Headers(thirdCallInit?.headers);
    expect(thirdHeaders.get("Authorization")).toBe("Bearer fresh-new-token");
  });
});
