import type { OperationalStatus, VerificationLevel } from "@pathpulse/shared-types";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface VerificationBadgeProps {
  level: VerificationLevel | string;
  status?: OperationalStatus | string;
  className?: string;
}

export function VerificationBadge({ level, status, className = "" }: VerificationBadgeProps) {
  const isUnavailable = status === "OUT_OF_SERVICE" || level === "UNAVAILABLE";
  const isUnverified = !isUnavailable && level === "UNVERIFIED";
  const isConfirmed = !isUnavailable && !isUnverified && level === "CONFIRMED";

  if (isUnavailable) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border-2 border-red-700 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-100 ${className}`}
      >
        <XCircle className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400" aria-hidden="true" />
        <span>Unavailable</span>
      </span>
    );
  }

  if (isUnverified) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border-2 border-amber-700 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100 ${className}`}
      >
        <HelpCircle
          className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden="true"
        />
        <span>Unverified</span>
      </span>
    );
  }

  if (isConfirmed) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border-2 border-emerald-700 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100 ${className}`}
      >
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
          aria-hidden="true"
        />
        <span>Confirmed</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border-2 border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] ${className}`}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{level}</span>
    </span>
  );
}
