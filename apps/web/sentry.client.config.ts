import * as Sentry from "@sentry/nextjs";
import { scrubWebSentryEvent } from "./lib/sentry-scrubber";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn && dsn.trim().length > 0) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend: scrubWebSentryEvent as (event: Sentry.ErrorEvent) => Sentry.ErrorEvent | null,
  });
}

