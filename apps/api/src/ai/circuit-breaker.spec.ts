import { CircuitBreaker, CircuitBreakerOpenException } from "./circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 50,
      halfOpenSuccessThreshold: 1,
    });
  });

  it("should initialize in CLOSED state", () => {
    expect(breaker.getState()).toBe("CLOSED");
  });

  it("should transition from CLOSED to OPEN after reaching failure threshold", async () => {
    const failingAction = jest.fn().mockRejectedValue(new Error("Service error"));

    await expect(breaker.execute(failingAction)).rejects.toThrow("Service error");
    expect(breaker.getState()).toBe("CLOSED");

    await expect(breaker.execute(failingAction)).rejects.toThrow("Service error");
    expect(breaker.getState()).toBe("CLOSED");

    await expect(breaker.execute(failingAction)).rejects.toThrow("Service error");
    expect(breaker.getState()).toBe("OPEN");
  });

  it("should reject calls immediately when OPEN without invoking downstream action", async () => {
    const failingAction = jest.fn().mockRejectedValue(new Error("Service error"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingAction)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");

    const downstreamAction = jest.fn().mockResolvedValue("data");
    await expect(breaker.execute(downstreamAction)).rejects.toThrow(CircuitBreakerOpenException);
    expect(downstreamAction).not.toHaveBeenCalled();
  });

  it("should transition from OPEN to HALF_OPEN after reset timeout expires", async () => {
    const failingAction = jest.fn().mockRejectedValue(new Error("Downstream down"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingAction)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(breaker.getState()).toBe("HALF_OPEN");
  });

  it("should transition from HALF_OPEN to CLOSED on successful probe execution", async () => {
    const failingAction = jest.fn().mockRejectedValue(new Error("Downstream down"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingAction)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(breaker.getState()).toBe("HALF_OPEN");

    const successAction = jest.fn().mockResolvedValue({ status: "ok" });
    const result = await breaker.execute(successAction);

    expect(result).toEqual({ status: "ok" });
    expect(breaker.getState()).toBe("CLOSED");
  });

  it("should transition from HALF_OPEN back to OPEN on probe failure", async () => {
    const failingAction = jest.fn().mockRejectedValue(new Error("Downstream down"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingAction)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe("OPEN");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(breaker.getState()).toBe("HALF_OPEN");

    await expect(breaker.execute(failingAction)).rejects.toThrow("Downstream down");
    expect(breaker.getState()).toBe("OPEN");
  });
});
