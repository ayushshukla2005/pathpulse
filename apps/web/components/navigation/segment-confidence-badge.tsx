import type { Confidence } from "@pathpulse/shared-types";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";

interface SegmentConfidenceBadgeProps {
  confidence: Confidence;
  className?: string;
}

export function SegmentConfidenceBadge({
  confidence,
  className = "",
}: SegmentConfidenceBadgeProps) {
  if (confidence === "CONFIRMED") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900 dark:bg-green-950 dark:text-green-100 ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Confirmed</span>
      </span>
    );
  }

  if (confidence === "UNVERIFIED") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100 ${className}`}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Unverified</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-900 dark:bg-red-950 dark:text-red-100 ${className}`}
    >
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Unavailable</span>
    </span>
  );
}
