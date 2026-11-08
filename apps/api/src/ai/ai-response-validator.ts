import { ReportCategory } from "@prisma/client";
import { AiClassifyResponse, AiDuplicateScoresResponse, AiSummarizeResponse } from "./ai.types";

export class AiResponseValidationError extends Error {
  constructor(message: string) {
    super(`AI response validation failed: ${message}`);
    this.name = "AiResponseValidationError";
  }
}

const VALID_CATEGORIES = new Set<string>([
  "BROKEN_LIFT",
  "BLOCKED_RAMP",
  "INACCESSIBLE_ENTRANCE",
  "OTHER",
]);

const VALID_SEVERITIES = new Set<string>(["LOW", "MEDIUM", "HIGH"]);

export function validateAiClassifyResponse(data: unknown): AiClassifyResponse {
  if (!data || typeof data !== "object") {
    throw new AiResponseValidationError("Payload must be a non-null object");
  }

  const obj = data as Record<string, unknown>;

  if (obj.requiresHumanVerification !== true) {
    throw new AiResponseValidationError("requiresHumanVerification must be explicitly true");
  }

  if (typeof obj.category !== "string" || !VALID_CATEGORIES.has(obj.category)) {
    throw new AiResponseValidationError(`Invalid category: ${String(obj.category)}`);
  }

  if (typeof obj.severity !== "string" || !VALID_SEVERITIES.has(obj.severity)) {
    throw new AiResponseValidationError(`Invalid severity: ${String(obj.severity)}`);
  }

  if (
    typeof obj.confidence !== "number" ||
    Number.isNaN(obj.confidence) ||
    obj.confidence < 0 ||
    obj.confidence > 1
  ) {
    throw new AiResponseValidationError(
      `Confidence must be between 0 and 1: ${String(obj.confidence)}`,
    );
  }

  if (typeof obj.modelVersion !== "string" || obj.modelVersion.trim() === "") {
    throw new AiResponseValidationError("modelVersion must be a non-empty string");
  }

  return {
    category: obj.category as ReportCategory,
    severity: obj.severity as "LOW" | "MEDIUM" | "HIGH",
    confidence: obj.confidence,
    requiresHumanVerification: true,
    modelVersion: obj.modelVersion,
  };
}

export function validateAiDuplicateScoresResponse(data: unknown): AiDuplicateScoresResponse {
  if (!data || typeof data !== "object") {
    throw new AiResponseValidationError("Payload must be a non-null object");
  }

  const obj = data as Record<string, unknown>;

  if (obj.requiresHumanVerification !== true) {
    throw new AiResponseValidationError("requiresHumanVerification must be explicitly true");
  }

  if (!Array.isArray(obj.scores)) {
    throw new AiResponseValidationError("scores must be an array");
  }

  for (const item of obj.scores) {
    if (!item || typeof item !== "object") {
      throw new AiResponseValidationError("Each score item must be an object");
    }
    const scoreItem = item as Record<string, unknown>;
    if (typeof scoreItem.id !== "string" || scoreItem.id.trim() === "") {
      throw new AiResponseValidationError("Score item id must be a string");
    }
    if (
      typeof scoreItem.similarityScore !== "number" ||
      Number.isNaN(scoreItem.similarityScore) ||
      scoreItem.similarityScore < 0 ||
      scoreItem.similarityScore > 1
    ) {
      throw new AiResponseValidationError("similarityScore must be between 0 and 1");
    }
    if (typeof scoreItem.isLikelyDuplicate !== "boolean") {
      throw new AiResponseValidationError("isLikelyDuplicate must be a boolean");
    }
  }

  if (typeof obj.threshold !== "number" || Number.isNaN(obj.threshold)) {
    throw new AiResponseValidationError("threshold must be a valid number");
  }

  if (typeof obj.modelVersion !== "string" || obj.modelVersion.trim() === "") {
    throw new AiResponseValidationError("modelVersion must be a non-empty string");
  }

  return obj as unknown as AiDuplicateScoresResponse;
}

export function validateAiSummarizeResponse(data: unknown): AiSummarizeResponse {
  if (!data || typeof data !== "object") {
    throw new AiResponseValidationError("Payload must be a non-null object");
  }

  const obj = data as Record<string, unknown>;

  if (obj.requiresHumanVerification !== true) {
    throw new AiResponseValidationError("requiresHumanVerification must be explicitly true");
  }

  if (typeof obj.summary !== "string") {
    throw new AiResponseValidationError("summary must be a string");
  }

  if (!Array.isArray(obj.coveredReportIds)) {
    throw new AiResponseValidationError("coveredReportIds must be an array");
  }

  if (typeof obj.modelVersion !== "string" || obj.modelVersion.trim() === "") {
    throw new AiResponseValidationError("modelVersion must be a non-empty string");
  }

  return obj as unknown as AiSummarizeResponse;
}
