import type {
  EvidenceStatus,
  FacilityItem,
  FindRouteRequest,
  FindVenuesParams,
  FloorStepGroup,
  MobilityProfile,
  ReportCategory,
  ReportStatus,
  RouteSegment,
  VerificationSummaryCounts,
} from "@pathpulse/shared-types";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_RULE_DESCRIPTION =
  "Password must be between 12 and 128 characters, and contain at least one letter and one number.";

export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required." };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      isValid: false,
      message: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`,
    };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one letter and one number.",
    };
  }
  return { isValid: true };
}

export function validateSafeNextPath(
  rawPath: string | null | undefined,
  fallback = "/profile",
): string {
  if (!rawPath || typeof rawPath !== "string") {
    return fallback;
  }

  const trimmed = rawPath.trim();
  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  if (trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("\\")) {
    return fallback;
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  if (
    trimmed.includes("/http:") ||
    trimmed.includes("/https:") ||
    trimmed.includes("javascript:")
  ) {
    return fallback;
  }

  return trimmed;
}

export function isValidTextScale(scale: number): boolean {
  return typeof scale === "number" && !isNaN(scale) && scale >= 1.0 && scale <= 2.0;
}

export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

export const MIN_RADIUS_METERS = 1;
export const MAX_RADIUS_METERS = 10000;
export const DEFAULT_RADIUS_METERS = 1000;

export const MIN_LIMIT = 1;
export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

export const RADIUS_OPTIONS = [500, 1000, 2000, 5000] as const;

export function validateLatitude(lat: unknown): {
  isValid: boolean;
  value?: number;
  error?: string;
} {
  if (lat === null || lat === undefined || lat === "") {
    return { isValid: false, error: "Latitude is required." };
  }
  const num = typeof lat === "number" ? lat : Number(lat);
  if (isNaN(num)) {
    return { isValid: false, error: "Latitude must be a valid number." };
  }
  if (num < MIN_LATITUDE || num > MAX_LATITUDE) {
    return {
      isValid: false,
      error: `Latitude must be between ${MIN_LATITUDE} and ${MAX_LATITUDE} degrees.`,
    };
  }
  return { isValid: true, value: num };
}

export function validateLongitude(lng: unknown): {
  isValid: boolean;
  value?: number;
  error?: string;
} {
  if (lng === null || lng === undefined || lng === "") {
    return { isValid: false, error: "Longitude is required." };
  }
  const num = typeof lng === "number" ? lng : Number(lng);
  if (isNaN(num)) {
    return { isValid: false, error: "Longitude must be a valid number." };
  }
  if (num < MIN_LONGITUDE || num > MAX_LONGITUDE) {
    return {
      isValid: false,
      error: `Longitude must be between ${MIN_LONGITUDE} and ${MAX_LONGITUDE} degrees.`,
    };
  }
  return { isValid: true, value: num };
}

export function validateRadiusMeters(radius: unknown): {
  isValid: boolean;
  value: number;
  error?: string;
} {
  if (radius === null || radius === undefined || radius === "") {
    return { isValid: true, value: DEFAULT_RADIUS_METERS };
  }
  const num = typeof radius === "number" ? radius : Number(radius);
  if (isNaN(num)) {
    return {
      isValid: false,
      value: DEFAULT_RADIUS_METERS,
      error: "Radius must be a valid number.",
    };
  }
  const clamped = Math.min(Math.max(Math.round(num), MIN_RADIUS_METERS), MAX_RADIUS_METERS);
  return { isValid: true, value: clamped };
}

export function validateLimit(limit: unknown): { isValid: boolean; value: number; error?: string } {
  if (limit === null || limit === undefined || limit === "") {
    return { isValid: true, value: DEFAULT_LIMIT };
  }
  const num = typeof limit === "number" ? limit : Number(limit);
  if (isNaN(num)) {
    return {
      isValid: false,
      value: DEFAULT_LIMIT,
      error: "Limit must be a valid number.",
    };
  }
  const clamped = Math.min(Math.max(Math.floor(num), MIN_LIMIT), MAX_LIMIT);
  return { isValid: true, value: clamped };
}

export function buildVenueSearchParams(params: FindVenuesParams): Record<string, string> {
  const result: Record<string, string> = {};

  if (params.lat !== undefined && params.lng !== undefined) {
    const latValid = validateLatitude(params.lat);
    const lngValid = validateLongitude(params.lng);
    if (
      latValid.isValid &&
      lngValid.isValid &&
      latValid.value !== undefined &&
      lngValid.value !== undefined
    ) {
      result.lat = latValid.value.toString();
      result.lng = lngValid.value.toString();
    }
  }

  const radiusResult = validateRadiusMeters(params.radiusMeters);
  result.radiusMeters = radiusResult.value.toString();

  const limitResult = validateLimit(params.limit);
  result.limit = limitResult.value.toString();

  if (params.category && typeof params.category === "string" && params.category.trim().length > 0) {
    result.category = params.category.trim();
  }

  return result;
}

export function computeVerificationSummary(facilities?: FacilityItem[]): VerificationSummaryCounts {
  if (!facilities || facilities.length === 0) {
    return {
      confirmed: 0,
      unverified: 0,
      unavailable: 0,
      total: 0,
      hasStepFreeEntrance: false,
    };
  }

  let confirmed = 0;
  let unverified = 0;
  let unavailable = 0;
  let hasStepFreeEntrance = false;

  for (const facility of facilities) {
    if (facility.verification_level === "CONFIRMED") {
      confirmed++;
    } else if (facility.verification_level === "UNVERIFIED") {
      unverified++;
    } else if (facility.verification_level === "UNAVAILABLE") {
      unavailable++;
    }

    if (
      (facility.facility_type === "ENTRANCE" || facility.facility_type === "RAMP") &&
      facility.verification_level === "CONFIRMED" &&
      facility.operational_status === "OPERATIONAL"
    ) {
      hasStepFreeEntrance = true;
    }
  }

  return {
    confirmed,
    unverified,
    unavailable,
    total: facilities.length,
    hasStepFreeEntrance,
  };
}

export function formatVerificationSummary(counts: VerificationSummaryCounts): string {
  if (counts.total === 0) {
    return "No facilities listed";
  }

  const parts: string[] = [];
  if (counts.confirmed > 0) {
    parts.push(`${counts.confirmed} verified`);
  }
  if (counts.unverified > 0) {
    parts.push(`${counts.unverified} unverified`);
  }
  if (counts.unavailable > 0) {
    parts.push(`${counts.unavailable} unavailable`);
  }

  if (parts.length === 0) {
    return `${counts.total} facilities`;
  }

  return parts.join(", ");
}

export const VALID_MOBILITY_PROFILES: readonly MobilityProfile[] = [
  "WHEELCHAIR",
  "LIMITED_MOBILITY",
  "VISUALLY_IMPAIRED",
  "HEARING_IMPAIRED",
  "STROLLER",
  "CUSTOM",
  "POWERED_WHEELCHAIR",
  "MOTORIZED",
  "CANE_OR_CRUTCHES",
  "VISUAL_IMPAIRMENT",
  "ELDERLY",
  "DEFAULT",
] as const;

export interface RouteValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateRouteRequest(input: Partial<FindRouteRequest>): RouteValidationResult {
  const errors: Record<string, string> = {};

  if (
    !input.buildingId ||
    typeof input.buildingId !== "string" ||
    input.buildingId.trim().length === 0
  ) {
    errors.buildingId = "Building selection is required.";
  }

  if (
    !input.originNodeId ||
    typeof input.originNodeId !== "string" ||
    input.originNodeId.trim().length === 0
  ) {
    errors.originNodeId = "Origin node is required.";
  }

  if (
    !input.destinationNodeId ||
    typeof input.destinationNodeId !== "string" ||
    input.destinationNodeId.trim().length === 0
  ) {
    errors.destinationNodeId = "Destination node is required.";
  }

  if (
    input.originNodeId &&
    input.destinationNodeId &&
    input.originNodeId.trim() === input.destinationNodeId.trim()
  ) {
    errors.destinationNodeId = "Origin and destination cannot be the same node.";
  }

  if (!input.profile || typeof input.profile !== "string") {
    errors.profile = "Mobility profile is required.";
  } else if (!VALID_MOBILITY_PROFILES.includes(input.profile as MobilityProfile)) {
    errors.profile = "Selected mobility profile is invalid.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface NodeFloorMeta {
  floorId: string;
  floorNumber: number;
  floorName?: string;
}

export function groupStepsByFloor(
  steps: RouteSegment[],
  nodesMap: Map<string, NodeFloorMeta>,
): FloorStepGroup[] {
  if (!steps || steps.length === 0) {
    return [];
  }

  const groups: FloorStepGroup[] = [];
  let currentGroup: FloorStepGroup | null = null;

  for (const step of steps) {
    const fromMeta = nodesMap.get(step.fromNodeId);
    const toMeta = nodesMap.get(step.toNodeId);

    const floorId = fromMeta?.floorId ?? toMeta?.floorId ?? "unknown";
    const floorNumber = fromMeta?.floorNumber ?? toMeta?.floorNumber ?? 0;
    const floorName =
      fromMeta?.floorName ??
      toMeta?.floorName ??
      (floorNumber === 0 ? "Ground Floor" : `Floor ${floorNumber}`);

    if (!currentGroup || currentGroup.floorId !== floorId) {
      currentGroup = {
        floorId,
        floorNumber,
        floorName,
        steps: [step],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.steps.push(step);
    }
  }

  return groups;
}

export const REPORT_CATEGORIES: readonly ReportCategory[] = [
  "BROKEN_LIFT",
  "BLOCKED_RAMP",
  "INACCESSIBLE_ENTRANCE",
  "OTHER",
] as const;

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  BROKEN_LIFT: "Broken lift or elevator",
  BLOCKED_RAMP: "Blocked ramp or pathway",
  INACCESSIBLE_ENTRANCE: "Inaccessible entrance or door",
  OTHER: "Other accessibility barrier",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, { label: string; explanation: string }> = {
  SUBMITTED: {
    label: "Submitted",
    explanation: "Your report has been received and is queued for verification.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    explanation: "A moderator is currently reviewing the barrier report and evidence.",
  },
  VERIFIED: {
    label: "Verified",
    explanation: "The barrier has been confirmed and communicated to facility administrators.",
  },
  ASSIGNED: {
    label: "Assigned",
    explanation: "A maintenance task has been created for the facility team.",
  },
  RESOLUTION_SUBMITTED: {
    label: "Resolution Submitted",
    explanation: "The maintenance team has reported the issue as resolved.",
  },
  CLOSED: {
    label: "Closed",
    explanation: "The issue resolution has been verified and closed.",
  },
  REJECTED: {
    label: "Rejected",
    explanation: "The report could not be verified or was duplicate.",
  },
  REOPENED: {
    label: "Reopened",
    explanation: "The issue was reopened for further review.",
  },
};

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  PENDING_UPLOAD: "Pending Upload",
  RECEIVED: "Received & Verified",
  REJECTED: "Rejected",
};

export const ALLOWED_EVIDENCE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedEvidenceMimeType = (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

export const MIN_EVIDENCE_SIZE_BYTES = 1024;
export const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_PER_REPORT = 5;

export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 1000;

export function isValidReportCategory(value: unknown): value is ReportCategory {
  return typeof value === "string" && REPORT_CATEGORIES.includes(value as ReportCategory);
}

export function validateReportDescription(description: string): {
  isValid: boolean;
  message?: string;
  trimmed: string;
} {
  if (!description || typeof description !== "string") {
    return {
      isValid: false,
      message: "Description is required.",
      trimmed: "",
    };
  }

  const trimmed = description.trim();
  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`,
      trimmed,
    };
  }

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      trimmed,
    };
  }

  return { isValid: true, trimmed };
}

export function isValidEvidenceMimeType(mimeType: string): mimeType is AllowedEvidenceMimeType {
  return ALLOWED_EVIDENCE_MIME_TYPES.includes(mimeType as AllowedEvidenceMimeType);
}

export function validateEvidenceFile(file: { type: string; size: number }): {
  isValid: boolean;
  message?: string;
} {
  if (!isValidEvidenceMimeType(file.type)) {
    return {
      isValid: false,
      message: `Unsupported file type "${file.type}". Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  if (file.size < MIN_EVIDENCE_SIZE_BYTES) {
    return {
      isValid: false,
      message: "File is too small. Minimum size is 1 KB.",
    };
  }

  if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
    return {
      isValid: false,
      message: "File exceeds 5 MB limit.",
    };
  }

  return { isValid: true };
}

export function getFileExtensionFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
