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
