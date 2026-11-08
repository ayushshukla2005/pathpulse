import type { FloorStepGroup } from "@pathpulse/shared-types";
import { SegmentConfidenceBadge } from "./segment-confidence-badge";
import { ArrowRight } from "lucide-react";

interface StepListProps {
  groups: FloorStepGroup[];
  selectedFloorId?: string;
  className?: string;
}

export function StepList({ groups, selectedFloorId = "ALL", className = "" }: StepListProps) {
  const visibleGroups =
    selectedFloorId === "ALL" ? groups : groups.filter((g) => g.floorId === selectedFloorId);

  let overallStepIndex = 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {visibleGroups.map((group) => (
        <section
          key={group.floorId}
          aria-labelledby={`floor-heading-${group.floorId}`}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3
              id={`floor-heading-${group.floorId}`}
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              {group.floorName}
            </h3>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {group.steps.length} {group.steps.length === 1 ? "step" : "steps"}
            </span>
          </div>

          <ol className="mt-4 space-y-3">
            {group.steps.map((step) => {
              overallStepIndex++;
              const stepNumber = overallStepIndex;
              const roundedDistance = Math.round(step.distanceMeters);

              return (
                <li
                  key={`${step.edgeId}-${step.fromNodeId}-${step.toNodeId}-${stepNumber}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-800/30 dark:hover:bg-slate-800/60"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    aria-hidden="true"
                  >
                    {stepNumber}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {step.instruction}
                      </p>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {roundedDistance} m
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SegmentConfidenceBadge confidence={step.confidence} />
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        <span>{step.connectionType.toLowerCase()}</span>
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
