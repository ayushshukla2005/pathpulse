import * as Sentry from "@sentry/node";
import { scrubSentryEvent } from "./sentry-scrubber";

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn.trim().length === 0) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    beforeSend: scrubSentryEvent,
  });
}

