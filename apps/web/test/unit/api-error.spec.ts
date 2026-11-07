import { describe, expect, it } from "vitest";
import { ApiError, parseApiError } from "@/lib/api/errors";

describe("ApiError and parseApiError", () => {
  it("correctly parses structured error response from NestJS global filter", () => {
    const errorPayload = {
      statusCode: 400,
      error: "Bad Request",
      message: ["email must be an email", "password is too short"],
      path: "/api/v1/auth/register",
      timestamp: "2026-11-07T12:00:00.000Z",
      requestId: "req-12345",
    };

    const parsed = parseApiError(400, errorPayload);

    expect(parsed).toBeInstanceOf(ApiError);
    expect(parsed).toBeInstanceOf(Error);
    expect(parsed.statusCode).toBe(400);
    expect(parsed.error).toBe("Bad Request");
    expect(parsed.message).toBe("email must be an email, password is too short");
    expect(parsed.details).toEqual(["email must be an email", "password is too short"]);
    expect(parsed.path).toBe("/api/v1/auth/register");
    expect(parsed.timestamp).toBe("2026-11-07T12:00:00.000Z");
    expect(parsed.requestId).toBe("req-12345");
  });

  it("handles string messages gracefully", () => {
    const errorPayload = {
      statusCode: 401,
      error: "Unauthorized",
      message: "Invalid credentials provided",
      path: "/api/v1/auth/login",
      timestamp: "2026-11-07T12:05:00.000Z",
      requestId: "req-67890",
    };

    const parsed = parseApiError(401, errorPayload);

    expect(parsed.statusCode).toBe(401);
    expect(parsed.message).toBe("Invalid credentials provided");
    expect(parsed.details).toBe("Invalid credentials provided");
    expect(parsed.requestId).toBe("req-67890");
  });

  it("falls back to generic message when raw string is passed", () => {
    const parsed = parseApiError(500, "Internal gateway error");

    expect(parsed.statusCode).toBe(500);
    expect(parsed.message).toBe("Internal gateway error");
    expect(parsed.error).toBe("Error");
  });

  it("handles null or undefined data without throwing", () => {
    const parsedNull = parseApiError(502, null);
    expect(parsedNull.statusCode).toBe(502);
    expect(parsedNull.message).toBe("Request failed");

    const parsedUndefined = parseApiError(504, undefined);
    expect(parsedUndefined.statusCode).toBe(504);
    expect(parsedUndefined.message).toBe("Request failed");
  });
});
