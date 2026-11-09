const SENSITIVE_KEY_PATTERNS = [
  /^authorization$/i,
  /^cookie$/i,
  /^set-cookie$/i,
  /session/i,
  /csrf/i,
  /xsrf/i,
  /password/i,
  /token/i,
  /secret/i,
  /api[-_]?key/i,
  /^email$/i,
  /^description$/i,
  /^coordinates$/i,
  /^latitude$/i,
  /^longitude$/i,
  /^lat$/i,
  /^lng$/i,
];

export const REDACTED_VALUE = "[REDACTED]";

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactSensitiveData<T = unknown>(target: T): T {
  if (target === null || target === undefined) {
    return target;
  }

  if (typeof target === "string") {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return REDACTED_VALUE as unknown as T;
    }
    if (/^Bearer\s+/i.test(target)) {
      return REDACTED_VALUE as unknown as T;
    }
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof target === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(target as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        output[key] = REDACTED_VALUE;
      } else if (typeof val === "object" && val !== null) {
        output[key] = redactSensitiveData(val);
      } else if (
        typeof val === "string" &&
        (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^Bearer\s+/i.test(val))
      ) {
        output[key] = REDACTED_VALUE;
      } else {
        output[key] = val;
      }
    }
    return output as unknown as T;
  }

  return target;
}
