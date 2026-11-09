import { REDACTED_VALUE, redactSensitiveData } from "./redactor";

describe("Logger Redactor", () => {
  it("should redact authorization and cookie headers", () => {
    const headers = {
      authorization: "Bearer secret-token-12345",
      cookie: "session=abcdef; PathPulseAuth=jwt123",
      "content-type": "application/json",
      "x-request-id": "11111111-2222-3333-4444-555555555555",
    };

    const redacted = redactSensitiveData(headers) as Record<string, unknown>;

    expect(redacted.authorization).toBe(REDACTED_VALUE);
    expect(redacted.cookie).toBe(REDACTED_VALUE);
    expect(redacted["content-type"]).toBe("application/json");
    expect(redacted["x-request-id"]).toBe("11111111-2222-3333-4444-555555555555");
  });

  it("should redact passwords, tokens, emails, descriptions, and coordinates in payloads", () => {
    const payload = {
      id: "usr_123",
      email: "user@example.com",
      password: "SuperSecretPassword123!",
      token: "jwt.token.here",
      description: "Broken elevator on 2nd floor near room 204",
      latitude: 12.9716,
      longitude: 77.5946,
      coordinates: [77.5946, 12.9716],
      status: "SUBMITTED",
      role: "REPORTER",
    };

    const redacted = redactSensitiveData(payload) as Record<string, unknown>;

    expect(redacted.id).toBe("usr_123");
    expect(redacted.status).toBe("SUBMITTED");
    expect(redacted.role).toBe("REPORTER");
    expect(redacted.email).toBe(REDACTED_VALUE);
    expect(redacted.password).toBe(REDACTED_VALUE);
    expect(redacted.token).toBe(REDACTED_VALUE);
    expect(redacted.description).toBe(REDACTED_VALUE);
    expect(redacted.latitude).toBe(REDACTED_VALUE);
    expect(redacted.longitude).toBe(REDACTED_VALUE);
    expect(redacted.coordinates).toBe(REDACTED_VALUE);
  });

  it("should recursively redact nested objects and arrays", () => {
    const payload = {
      meta: {
        submittedBy: {
          id: "usr_999",
          email: "reporter@domain.org",
        },
      },
      evidence: [
        {
          id: "evi_1",
          description: "Photo of blocked ramp",
        },
      ],
      tags: ["barrier", "entrance"],
    };

    const redacted = redactSensitiveData(payload) as {
      meta: { submittedBy: { id: string; email: string } };
      evidence: Array<{ id: string; description: string }>;
      tags: string[];
    };

    expect(redacted.meta.submittedBy.id).toBe("usr_999");
    expect(redacted.meta.submittedBy.email).toBe(REDACTED_VALUE);
    expect(redacted.evidence[0]!.id).toBe("evi_1");
    expect(redacted.evidence[0]!.description).toBe(REDACTED_VALUE);
    expect(redacted.tags).toEqual(["barrier", "entrance"]);
  });

  it("should handle null and undefined safely", () => {
    expect(redactSensitiveData(null)).toBeNull();
    expect(redactSensitiveData(undefined)).toBeUndefined();
  });
});
