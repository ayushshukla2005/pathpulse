import type {
  FacilityItem,
  FindVenuesParams,
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
