export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreakerOpenException extends Error {
  constructor(message = "Circuit breaker is OPEN. Fast-failing downstream request.") {
    super(message);
    this.name = "CircuitBreakerOpenException";
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenSuccessThreshold?: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private failureCount = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenSuccessThreshold: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 1;
  }

  public getState(): CircuitBreakerState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.consecutiveSuccesses = 0;
      }
    }
    return this.state;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      throw new CircuitBreakerOpenException();
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenSuccessThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.consecutiveSuccesses = 0;
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.consecutiveSuccesses = 0;
    } else if (this.state === "CLOSED") {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
      }
    }
  }

  public reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = 0;
  }
}
