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
