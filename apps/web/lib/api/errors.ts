import type { ApiErrorResponse } from "@pathpulse/shared-types";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details: string | string[];
  public readonly path?: string;
  public readonly timestamp?: string;
  public readonly requestId?: string;

  constructor(
    payload: Partial<ApiErrorResponse> & {
      statusCode: number;
      message: string | string[];
    },
  ) {
    const messageStr = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "An error occurred";
    super(messageStr);
    this.name = "ApiError";
    this.statusCode = payload.statusCode;
    this.error = payload.error || "API Error";
    this.details = payload.message;
    this.path = payload.path;
    this.timestamp = payload.timestamp;
    this.requestId = payload.requestId;
  }
}

export function parseApiError(statusCode: number, data: unknown): ApiError {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const message = (obj.message as string | string[]) || (obj.error as string) || "Request failed";
    const error = (obj.error as string) || "Error";
    const path = typeof obj.path === "string" ? obj.path : undefined;
    const timestamp = typeof obj.timestamp === "string" ? obj.timestamp : undefined;
    const requestId = typeof obj.requestId === "string" ? obj.requestId : undefined;

    return new ApiError({
      statusCode,
      error,
      message,
      path,
      timestamp,
      requestId,
    });
  }

  return new ApiError({
    statusCode,
    error: "Error",
    message: typeof data === "string" ? data : "Request failed",
  });
}
