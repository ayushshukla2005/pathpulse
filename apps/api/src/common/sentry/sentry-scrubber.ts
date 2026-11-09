import type { ErrorEvent } from "@sentry/node";
import { REDACTED_VALUE, redactSensitiveData } from "../logger/redactor";

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
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
