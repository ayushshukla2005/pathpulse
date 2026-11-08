import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { CircuitBreaker, CircuitBreakerState } from "./circuit-breaker";
import {
  AiClassifyRequest,
  AiClassifyResponse,
  AiDuplicateScoresRequest,
  AiDuplicateScoresResponse,
  AiSummarizeRequest,
  AiSummarizeResponse,
} from "./ai.types";
import {
  validateAiClassifyResponse,
  validateAiDuplicateScoresResponse,
  validateAiSummarizeResponse,
} from "./ai-response-validator";

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly circuitBreaker: CircuitBreaker;
  private readonly baseUrl: string;
  private readonly serviceToken: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>("aiServiceUrl", "http://localhost:8000");
    this.serviceToken = this.configService.get<string>(
      "aiServiceToken",
      "dev-pathpulse-ai-internal-service-token-secret",
    );
    this.timeoutMs = this.configService.get<number>("aiTimeoutMs", 2000);

    const failureThreshold = this.configService.get<number>("aiBreakerFailureThreshold", 3);
    const resetTimeoutMs = this.configService.get<number>("aiBreakerResetTimeoutMs", 10000);
    const halfOpenSuccessThreshold = this.configService.get<number>(
      "aiBreakerHalfOpenSuccessThreshold",
      1,
    );

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold,
      resetTimeoutMs,
      halfOpenSuccessThreshold,
    });
  }

  public getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  public resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  public async classifyReport(input: AiClassifyRequest): Promise<AiClassifyResponse | null> {
    const requestId = randomUUID();
    const textLength = input.description.length;
    const startTime = Date.now();

    try {
      return await this.circuitBreaker.execute(async () => {
        const url = `${this.baseUrl}/v1/classify`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.serviceToken}`,
            "X-Request-Id": requestId,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        const latencyMs = Date.now() - startTime;
        this.logger.log(
          `classify_call requestId=${requestId} textLength=${textLength} status=${response.status} latencyMs=${latencyMs}`,
        );

        if (!response.ok) {
          throw new Error(`AI classify HTTP error: status=${response.status}`);
        }

        const data = await response.json();
        return validateAiClassifyResponse(data);
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(
        `classify_failed requestId=${requestId} textLength=${textLength} latencyMs=${latencyMs} error="${message}"`,
      );
      return null;
    }
  }

  public async scoreDuplicates(
    input: AiDuplicateScoresRequest,
  ): Promise<AiDuplicateScoresResponse | null> {
    const requestId = randomUUID();
    const candidateLength = input.candidateDescription.length;
    const comparisonCount = input.comparisonReports.length;
    const startTime = Date.now();

    try {
      return await this.circuitBreaker.execute(async () => {
        const url = `${this.baseUrl}/v1/duplicate-scores`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.serviceToken}`,
            "X-Request-Id": requestId,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        const latencyMs = Date.now() - startTime;
        this.logger.log(
          `duplicate_scores_call requestId=${requestId} candidateLength=${candidateLength} count=${comparisonCount} status=${response.status} latencyMs=${latencyMs}`,
        );

        if (!response.ok) {
          throw new Error(`AI duplicate-scores HTTP error: status=${response.status}`);
        }

        const data = await response.json();
        return validateAiDuplicateScoresResponse(data);
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(
        `duplicate_scores_failed requestId=${requestId} count=${comparisonCount} latencyMs=${latencyMs} error="${message}"`,
      );
      return null;
    }
  }

  public async summarizeReports(input: AiSummarizeRequest): Promise<AiSummarizeResponse | null> {
    const requestId = randomUUID();
    const reportCount = input.reports.length;
    const startTime = Date.now();

    try {
      return await this.circuitBreaker.execute(async () => {
        const url = `${this.baseUrl}/v1/summarize`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.serviceToken}`,
            "X-Request-Id": requestId,
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        const latencyMs = Date.now() - startTime;
        this.logger.log(
          `summarize_call requestId=${requestId} reportCount=${reportCount} status=${response.status} latencyMs=${latencyMs}`,
        );

        if (!response.ok) {
          throw new Error(`AI summarize HTTP error: status=${response.status}`);
        }

        const data = await response.json();
        return validateAiSummarizeResponse(data);
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(
        `summarize_failed requestId=${requestId} count=${reportCount} latencyMs=${latencyMs} error="${message}"`,
      );
      return null;
    }
  }

  public async checkHealth(): Promise<{ status: string; version: string } | null> {
    try {
      const url = `${this.baseUrl}/health`;
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) return null;
      return (await response.json()) as { status: string; version: string };
    } catch {
      return null;
    }
  }
}
