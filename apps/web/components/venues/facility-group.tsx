import type { FacilityItem } from "@pathpulse/shared-types";
import { formatSourceText } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass";
import { VerificationBadge } from "./verification-badge";

const TYPE_LABELS: Record<string, string> = {
  ELEVATOR: "Elevators & Lifts",
  LIFT: "Elevators & Lifts",
  RAMP: "Ramps & Slopes",
  ACCESSIBLE_RESTROOM: "Accessible Washrooms",
  WASHROOM: "Accessible Washrooms",
  ENTRANCE: "Entrances & Exits",
  RECEPTION: "Reception & Information Desks",
  TACTILE_PAVING: "Tactile Paving",
  PARKING_BAY: "Accessible Parking Bays",
  HELP_DESK: "Help Desks",
  OTHER: "Other Facilities",
};

function normalizeGroupKey(type: string): string {
  if (type === "ELEVATOR" || type === "LIFT") return "LIFT";
  if (type === "RAMP") return "RAMP";
  if (type === "ACCESSIBLE_RESTROOM" || type === "WASHROOM") return "WASHROOM";
  if (type === "ENTRANCE") return "ENTRANCE";
  if (type === "RECEPTION" || type === "HELP_DESK") return "RECEPTION";
  return "OTHER";
}

const GROUP_ORDER = ["ENTRANCE", "LIFT", "RAMP", "WASHROOM", "RECEPTION", "OTHER"];

function formatDate(rawDate: Date | string | null | undefined): string {
  if (!rawDate) {
    return "Never verified";
  }
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) {
    return "Never verified";
  }
  return `Last verified on ${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

function formatOperationalStatus(status: string): string {
  if (status === "OPERATIONAL") return "Operational";
  if (status === "DEGRADED") return "Degraded service";
  if (status === "OUT_OF_SERVICE") return "Out of service";
  return status;
}

interface FacilityGroupProps {
  facilities: FacilityItem[];
}

export function FacilityGroup({ facilities }: FacilityGroupProps) {
  if (!facilities || facilities.length === 0) {
    return (
      <GlassCard className="p-6 text-center text-[var(--muted-foreground)]">
        <p>No recorded accessibility facilities for this venue.</p>
      </GlassCard>
    );
  }

  const grouped = new Map<string, FacilityItem[]>();
  for (const groupKey of GROUP_ORDER) {
    grouped.set(groupKey, []);
  }

  for (const facility of facilities) {
    const key = normalizeGroupKey(facility.facility_type);
    const list = grouped.get(key) ?? [];
    list.push(facility);
    grouped.set(key, list);
  }

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((groupKey) => {
        const groupFacilities = grouped.get(groupKey) ?? [];
        if (groupFacilities.length === 0) return null;

        const headingTitle = TYPE_LABELS[groupKey] || "Other Facilities";

        return (
          <section key={groupKey} aria-labelledby={`heading-group-${groupKey.toLowerCase()}`}>
            <GlassCard className="p-5 shadow-sm">
              <h3
                id={`heading-group-${groupKey.toLowerCase()}`}
                className="mb-4 text-lg font-bold text-[var(--foreground)] border-b-2 border-[var(--border)] pb-2"
              >
                {headingTitle} ({groupFacilities.length})
              </h3>
              <ul role="list" className="divide-y divide-[var(--border)]">
                {groupFacilities.map((facility) => {
                  const dateText = formatDate(facility.last_verified_at);
                  const isOutOfService = facility.operational_status === "OUT_OF_SERVICE";
                  const isUnverified = facility.verification_level === "UNVERIFIED";

                  return (
                    <li key={facility.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[var(--foreground)]">
                              {facility.name}
                            </h4>
                            <VerificationBadge
                              level={facility.verification_level}
                              status={facility.operational_status}
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                            <span>
                              Status:{" "}
                              <strong
                                className={
                                  isOutOfService
                                    ? "text-red-700 dark:text-red-400"
                                    : isUnverified
                                      ? "text-amber-800 dark:text-amber-300"
                                      : "text-emerald-800 dark:text-emerald-300"
                                }
                              >
                                {formatOperationalStatus(facility.operational_status)}
                              </strong>
                            </span>
                            <span aria-label={dateText}>{dateText}</span>
                            <span className="text-xs font-medium text-[var(--muted-foreground)]">
                              {formatSourceText(facility.source, facility.updated_at)}
                            </span>
                            {facility.notes && (
                              <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]">
                                {facility.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          </section>
        );
      })}
    </div>
  );
}
