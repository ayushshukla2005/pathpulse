import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSession } from "@/lib/auth/auth-context";

describe("loadSession deduplication", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("calls fetch only once when invoked twice concurrently", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: "user-test-1",
            email: "dedup@pathpulse.local",
            name: "Dedup Tester",
            role: "USER",
          },
          accessToken: "mock-token-abc",
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    const [res1, res2] = await Promise.all([loadSession(), loadSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res1).toEqual(res2);
    expect(res1.authenticated).toBe(true);
    expect(res1.user?.email).toBe("dedup@pathpulse.local");
    expect(res1.accessToken).toBe("mock-token-abc");
    expect(res1.error).toBeNull();
  });

  it("allows subsequent calls after the in-flight request settles", async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      callCount += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            id: `user-${callCount}`,
            email: `user${callCount}@pathpulse.local`,
            name: `User ${callCount}`,
            role: "USER",
          },
          accessToken: `token-${callCount}`,
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    const first = await loadSession();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.user?.id).toBe("user-1");

    const second = await loadSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(second.user?.id).toBe("user-2");
  });

  it("handles 503 response and clears in-flight state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: "Service Unavailable" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const [res1, res2] = await Promise.all([loadSession(), loadSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res1.authenticated).toBe(false);
    expect(res1.error).toBe("Authentication service is temporarily unavailable.");
    expect(res2.error).toBe("Authentication service is temporarily unavailable.");

    await loadSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("handles network rejection and clears in-flight state", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network failure"));

    vi.stubGlobal("fetch", fetchMock);

    const [res1, res2] = await Promise.all([loadSession(), loadSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res1.authenticated).toBe(false);
    expect(res1.error).toBe("Network connection issue while verifying session.");
    expect(res2.error).toBe("Network connection issue while verifying session.");

    await loadSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
