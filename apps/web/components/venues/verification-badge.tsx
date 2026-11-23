import type { OperationalStatus, VerificationLevel } from "@pathpulse/shared-types";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { GlassBadge } from "@/components/ui/glass";

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
      <GlassBadge
        variant="destructive"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        <XCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
        <span>Unavailable</span>
      </GlassBadge>
    );
  }

  if (isUnverified) {
    return (
      <GlassBadge
        variant="secondary"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        <span>Unverified</span>
      </GlassBadge>
    );
  }

  if (isConfirmed) {
    return (
      <GlassBadge
        variant="default"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>Confirmed</span>
      </GlassBadge>
    );
  }

  return (
    <GlassBadge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
        aria-hidden="true"
      />
      <span>{level}</span>
    </GlassBadge>
  );
}
