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

function isSensitiveKey(key: string): boolean {
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

export interface WebSentryEvent {
  request?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string> | string;
    data?: unknown;
  };
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
  };
  extra?: Record<string, unknown>;
  breadcrumbs?: Array<{
    data?: Record<string, unknown>;
    message?: string;
  }>;
}

export function scrubWebSentryEvent<T extends WebSentryEvent>(event: T): T {
  if (event.request) {
    if (event.request.headers) {
      event.request.headers = redactSensitiveData(event.request.headers) as Record<string, string>;
    }
    if (event.request.cookies && typeof event.request.cookies === "object") {
      const sanitizedCookies: Record<string, string> = {};
      for (const key of Object.keys(event.request.cookies)) {
        sanitizedCookies[key] = REDACTED_VALUE;
      }
      event.request.cookies = sanitizedCookies;
    }
    if (event.request.data) {
      event.request.data = redactSensitiveData(event.request.data);
    }
  }

  if (event.user) {
    if (event.user.email) {
      event.user.email = REDACTED_VALUE;
    }
    if (event.user.ip_address) {
      event.user.ip_address = "0.0.0.0";
    }
  }

  if (event.extra) {
    event.extra = redactSensitiveData(event.extra) as Record<string, unknown>;
  }

  if (event.breadcrumbs && Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (crumb.data) {
        crumb.data = redactSensitiveData(crumb.data) as Record<string, unknown>;
      }
      return crumb;
    });
  }

  return event;
}
