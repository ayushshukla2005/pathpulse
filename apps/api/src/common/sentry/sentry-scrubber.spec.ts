import type { ErrorEvent } from "@sentry/node";
import { REDACTED_VALUE } from "../logger/redactor";
import { scrubSentryEvent } from "./sentry-scrubber";

describe("Sentry Scrubber", () => {
  it("should scrub sensitive headers, request body, user identifiers, and breadcrumbs", () => {
    const rawEvent: ErrorEvent = {
      type: undefined,
      event_id: "evt_1234567890abcdef",
      request: {
        url: "https://api.pathpulse.org/api/v1/reports",
        method: "POST",
        headers: {
          authorization: "Bearer secret-token-value",
          cookie: "session=xyz; auth=abc",
          "content-type": "application/json",
        },
        cookies: {
          session: "cookie-secret",
        },
        data: {
          email: "reporter@example.com",
          password: "SecretPassword123!",
          token: "jwt_tok_value",
          description: "Broken ramp at South Entrance",
          latitude: 28.6139,
          longitude: 77.209,
          coordinates: [77.209, 28.6139],
          venueId: "ven_safe_123",
        },
      },
      user: {
        id: "usr_user123",
        email: "user@domain.com",
        ip_address: "203.0.113.195",
      },
      extra: {
        internalEmail: "admin@internal.net",
        serviceName: "pathpulse-api",
      },
      breadcrumbs: [
        {
          timestamp: 1700000000,
          category: "http",
          data: {
            token: "temp-access-token",
            statusCode: 200,
          },
        },
      ],
    };

    const sanitized = scrubSentryEvent(rawEvent);

    expect(sanitized.request?.headers?.authorization).toBe(REDACTED_VALUE);
    expect(sanitized.request?.headers?.cookie).toBe(REDACTED_VALUE);
    expect(sanitized.request?.headers?.["content-type"]).toBe("application/json");

    expect(sanitized.request?.cookies).toEqual({ session: REDACTED_VALUE });

    const body = sanitized.request?.data as Record<string, unknown>;
    expect(body.email).toBe(REDACTED_VALUE);
    expect(body.password).toBe(REDACTED_VALUE);
    expect(body.token).toBe(REDACTED_VALUE);
    expect(body.description).toBe(REDACTED_VALUE);
    expect(body.latitude).toBe(REDACTED_VALUE);
    expect(body.longitude).toBe(REDACTED_VALUE);
    expect(body.coordinates).toBe(REDACTED_VALUE);
    expect(body.venueId).toBe("ven_safe_123");

    expect(sanitized.user?.id).toBe("usr_user123");
    expect(sanitized.user?.email).toBe(REDACTED_VALUE);
    expect(sanitized.user?.ip_address).toBe("0.0.0.0");

    expect(sanitized.extra?.internalEmail).toBe(REDACTED_VALUE);
    expect(sanitized.extra?.serviceName).toBe("pathpulse-api");

    expect(sanitized.breadcrumbs?.[0]?.data?.token).toBe(REDACTED_VALUE);
    expect(sanitized.breadcrumbs?.[0]?.data?.statusCode).toBe(200);
  });
});
