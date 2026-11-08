import type { FacilityItem, VerificationSummaryCounts } from "@pathpulse/shared-types";
import { computeVerificationSummary, formatVerificationSummary } from "@pathpulse/validation";
import { CheckCircle2, ShieldAlert } from "lucide-react";

interface VerificationSummaryProps {
  facilities?: FacilityItem[];
  counts?: VerificationSummaryCounts;
  className?: string;
}

export function VerificationSummary({
  facilities,
  counts: directCounts,
  className = "",
}: VerificationSummaryProps) {
  const counts = directCounts ?? computeVerificationSummary(facilities);
  const summaryText = formatVerificationSummary(counts);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)] ${className}`}
    >
      <span className="font-medium text-[var(--foreground)]">{summaryText}</span>
      {counts.hasStepFreeEntrance && (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-700 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2
            className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span>Step-free entrance</span>
        </span>
      )}
      {counts.unavailable > 0 && (
        <span className="inline-flex items-center gap-1 rounded border border-red-700 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 dark:border-red-500 dark:bg-red-950 dark:text-red-200">
          <ShieldAlert className="h-3.5 w-3.5 text-red-700 dark:text-red-400" aria-hidden="true" />
          <span>{counts.unavailable} unavailable</span>
        </span>
      )}
    </div>
  );
}
