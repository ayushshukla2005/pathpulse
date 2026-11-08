import type { RouteAccessibility } from "@pathpulse/shared-types";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface RouteSummaryProps {
  totalDistanceMeters: number;
  accessibility: RouteAccessibility;
  unverifiedCount: number;
  className?: string;
}

export function RouteSummary({
  totalDistanceMeters,
  accessibility,
  unverifiedCount,
  className = "",
}: RouteSummaryProps) {
  const formattedDistance =
    totalDistanceMeters >= 1000
      ? `${(totalDistanceMeters / 1000).toFixed(2)} km`
      : `${Math.round(totalDistanceMeters)} m`;

  const isConfirmedStepFree = accessibility === "STEP_FREE" && unverifiedCount === 0;
  const isUnconfirmedStepFree = accessibility === "STEP_FREE" && unverifiedCount > 0;

  let accessibilityLabel = "Mixed Access";
  let accessibilityBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <span>Mixed Access Route</span>
    </span>
  );

  if (isConfirmedStepFree) {
    accessibilityLabel = "Confirmed Step-Free";
    accessibilityBadge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900 dark:bg-green-950 dark:text-green-100">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        <span>Confirmed Step-Free Route</span>
      </span>
    );
  } else if (isUnconfirmedStepFree) {
    accessibilityLabel = "Step-Free (Unverified Segments)";
    accessibilityBadge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <span>Step-Free (Contains Unverified Segments)</span>
      </span>
    );
  } else if (accessibility === "UNVERIFIED") {
    accessibilityLabel = "Unverified Accessibility";
    accessibilityBadge = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        <span>Unverified Accessibility Route</span>
      </span>
    );
  }

  return (
    <section
      aria-label="Route Overview"
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Route Summary
          </h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formattedDistance}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">total distance</span>
          </div>
        </div>
        <div>{accessibilityBadge}</div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
        <div>
          <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Accessibility Status
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
            {accessibilityLabel}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Verification Integrity
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
            {unverifiedCount === 0
              ? "All segments confirmed"
              : `${unverifiedCount} unverified segment${unverifiedCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
        Showing single best route for the selected mobility profile. Alternative route generation is
        not requested.
      </div>
    </section>
  );
}
