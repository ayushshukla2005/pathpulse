import { describe, expect, it } from "vitest";
import { REDACTED_VALUE, scrubWebSentryEvent } from "../../lib/sentry-scrubber";

describe("Web Sentry Scrubber", () => {
  it("should scrub authorization headers, cookies, and sensitive body fields", () => {
    const rawEvent = {
      request: {
        headers: {
          authorization: "Bearer my-secret-jwt",
          cookie: "PathPulseAuth=12345",
          "user-agent": "Mozilla/5.0",
        },
        cookies: {
          session: "session-cookie-value",
        },
        data: {
          email: "attendee@example.com",
          password: "mySecretPassword!",
          token: "secret-token",
          description: "Elevator out of service on 3rd floor",
          coordinates: [77.209, 28.6139],
          latitude: 28.6139,
          longitude: 77.209,
          buildingId: "bld_123",
        },
      },
      user: {
        id: "usr_web1",
        email: "user@domain.com",
        ip_address: "192.0.2.1",
      },
      extra: {
        rawEmail: "support@domain.com",
        locale: "en-US",
      },
      breadcrumbs: [
        {
          message: "Navigated to /reports",
          data: {
            token: "xyz",
            path: "/reports",
          },
        },
      ],
    };

    const sanitized = scrubWebSentryEvent(rawEvent);

    expect(sanitized.request?.headers?.authorization).toBe(REDACTED_VALUE);
    expect(sanitized.request?.headers?.cookie).toBe(REDACTED_VALUE);
    expect(sanitized.request?.headers?.["user-agent"]).toBe("Mozilla/5.0");

    expect(sanitized.request?.cookies).toEqual({ session: REDACTED_VALUE });

    const body = sanitized.request?.data as Record<string, unknown>;
    expect(body.email).toBe(REDACTED_VALUE);
    expect(body.password).toBe(REDACTED_VALUE);
    expect(body.token).toBe(REDACTED_VALUE);
    expect(body.description).toBe(REDACTED_VALUE);
    expect(body.coordinates).toBe(REDACTED_VALUE);
    expect(body.latitude).toBe(REDACTED_VALUE);
    expect(body.longitude).toBe(REDACTED_VALUE);
    expect(body.buildingId).toBe("bld_123");

    expect(sanitized.user?.id).toBe("usr_web1");
    expect(sanitized.user?.email).toBe(REDACTED_VALUE);
    expect(sanitized.user?.ip_address).toBe("0.0.0.0");

    expect(sanitized.extra?.rawEmail).toBe(REDACTED_VALUE);
    expect(sanitized.extra?.locale).toBe("en-US");

    expect(sanitized.breadcrumbs?.[0]?.data?.token).toBe(REDACTED_VALUE);
    expect(sanitized.breadcrumbs?.[0]?.data?.path).toBe("/reports");
  });
});

