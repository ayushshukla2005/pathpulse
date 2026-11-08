import { ConfigService } from "@nestjs/config";
import { AiClientService } from "./ai-client.service";

describe("AiClientService", () => {
  let service: AiClientService;
  let configService: ConfigService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    configService = {
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === "aiServiceUrl") return "http://ai-service.local:8000";
        if (key === "aiServiceToken") return "test-ai-token-12345";
        if (key === "aiTimeoutMs") return 200;
        if (key === "aiBreakerFailureThreshold") return 3;
        if (key === "aiBreakerResetTimeoutMs") return 500;
        if (key === "aiBreakerHalfOpenSuccessThreshold") return 1;
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new AiClientService(configService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully parse and return valid classification response", async () => {
    const mockResponse = {
      category: "BROKEN_LIFT",
      severity: "HIGH",
      confidence: 0.92,
      requiresHumanVerification: true,
      modelVersion: "v1.0.0",
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as Response);

    const result = await service.classifyReport({
      description: "Elevator is stuck between floors",
    });

    expect(result).not.toBeNull();
    expect(result?.category).toBe("BROKEN_LIFT");
    expect(result?.severity).toBe("HIGH");
    expect(result?.requiresHumanVerification).toBe(true);
    expect(result?.confidence).toBe(0.92);
  });

  it("should discard response and return null when requiresHumanVerification is missing or false", async () => {
    const invalidResponse = {
      category: "BROKEN_LIFT",
      severity: "HIGH",
      confidence: 0.92,
      requiresHumanVerification: false,
      modelVersion: "v1.0.0",
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(invalidResponse),
    } as unknown as Response);

    const result = await service.classifyReport({
      description: "Elevator is broken",
    });

    expect(result).toBeNull();
  });

  it("should discard response and return null when category is invalid", async () => {
    const invalidResponse = {
      category: "NOT_A_VALID_CATEGORY",
      severity: "HIGH",
      confidence: 0.92,
      requiresHumanVerification: true,
      modelVersion: "v1.0.0",
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(invalidResponse),
    } as unknown as Response);

    const result = await service.classifyReport({
      description: "Elevator is broken",
    });

    expect(result).toBeNull();
  });

  it("should handle timeout gracefully and return null", async () => {
    global.fetch = jest.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        const signal = options?.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted due to timeout");
            err.name = "TimeoutError";
            reject(err);
          });
        }
      });
    });

    const result = await service.classifyReport({
      description: "Slow server elevator issue",
    });

    expect(result).toBeNull();
  });

  it("should return null when HTTP response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const result = await service.classifyReport({
      description: "Server error elevator issue",
    });

    expect(result).toBeNull();
  });
});
