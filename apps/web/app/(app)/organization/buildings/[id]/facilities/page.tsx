"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganizationFacilities, updateFacilityStatus } from "@/lib/api/organizations";
import { useBuildingRealtime } from "@/lib/hooks/use-building-realtime";
import { useOrganization } from "../../../organization-context";
import { GlassBadge, GlassButton, GlassDialog, GlassPanel } from "@/components/ui/glass";
import {
  FacilityType,
  OperationalStatus,
  OrganizationFacilityItem,
  VerificationLevel,
} from "@pathpulse/shared-types";

function FacilityRow({
  facility,
  onSave,
  isSaving,
}: {
  facility: OrganizationFacilityItem;
  onSave: (id: string, status: OperationalStatus, verificationLevel: VerificationLevel) => void;
  isSaving: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = React.useState<OperationalStatus>(
    facility.operationalStatus,
  );
  const [selectedLevel, setSelectedLevel] = React.useState<VerificationLevel>(
    facility.verificationLevel,
  );
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState<boolean>(false);
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setSelectedStatus(facility.operationalStatus);
    setSelectedLevel(facility.verificationLevel);
  }, [facility.operationalStatus, facility.verificationLevel]);

  const hasChanges =
    selectedStatus !== facility.operationalStatus || selectedLevel !== facility.verificationLevel;

  const handleSave = () => {
    onSave(facility.id, selectedStatus, selectedLevel);
    setSaveSuccess(true);
    setIsConfirmDialogOpen(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const formattedDate = facility.lastVerifiedAt
    ? new Date(facility.lastVerifiedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Never verified";

  const statusLabel =
    facility.operationalStatus === "OPERATIONAL"
      ? "Operational"
      : facility.operationalStatus === "OUT_OF_SERVICE"
        ? "Out of service"
        : "Unknown";

  const levelLabel =
    facility.verificationLevel === "CONFIRMED"
      ? "Confirmed"
      : facility.verificationLevel === "UNVERIFIED"
        ? "Unverified"
        : "Unavailable";

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40">
      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
        <div>{facility.name}</div>
        {facility.floorName ? (
          <div className="text-xs text-[var(--muted-foreground)]">Floor: {facility.floorName}</div>
        ) : null}
      </td>
      <td className="px-4 py-3 text-sm text-[var(--foreground)]">
        <span className="font-medium">{statusLabel}</span>
      </td>
      <td className="px-4 py-3 text-sm">
        <GlassBadge
          variant={
            facility.verificationLevel === "CONFIRMED"
              ? "default"
              : facility.verificationLevel === "UNAVAILABLE"
                ? "destructive"
                : "secondary"
          }
        >
          {levelLabel}
        </GlassBadge>
      </td>
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{formattedDate}</td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex flex-wrap items-center justify-end gap-2">
          <div>
            <label htmlFor={`status-${facility.id}`} className="sr-only">
              {facility.name} operational status
            </label>
            <select
              id={`status-${facility.id}`}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OperationalStatus)}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs font-medium text-[var(--foreground)]"
            >
              <option value="OPERATIONAL">Operational</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          <div>
            <label htmlFor={`level-${facility.id}`} className="sr-only">
              {facility.name} verification level
            </label>
            <select
              id={`level-${facility.id}`}
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as VerificationLevel)}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs font-medium text-[var(--foreground)]"
            >
              <option value="CONFIRMED">Confirmed</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>

          <button
            ref={saveButtonRef}
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="rounded-md border-2 border-transparent bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40 min-h-[24px]"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>

          {saveSuccess ? (
            <span
              role="status"
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300"
            >
              Saved
            </span>
          ) : null}

          <GlassDialog
            open={isConfirmDialogOpen}
            onClose={() => setIsConfirmDialogOpen(false)}
            triggerRef={saveButtonRef}
            title="Facility Status Updated"
            description={`Status change for "${facility.name}" has been recorded.`}
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs space-y-1.5 text-[var(--foreground)]">
                <div>
                  <span className="font-semibold text-[var(--muted-foreground)]">
                    Operational Status:
                  </span>{" "}
                  {selectedStatus === "OPERATIONAL"
                    ? "Operational"
                    : selectedStatus === "OUT_OF_SERVICE"
                      ? "Out of service"
                      : "Unknown"}
                </div>
                <div>
                  <span className="font-semibold text-[var(--muted-foreground)]">
                    Verification Level:
                  </span>{" "}
                  {selectedLevel === "CONFIRMED"
                    ? "Confirmed"
                    : selectedLevel === "UNVERIFIED"
                      ? "Unverified"
                      : "Unavailable"}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Status updated successfully
                </span>
                <GlassButton
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  className="min-h-[24px]"
                >
                  Done
                </GlassButton>
              </div>
            </div>
          </GlassDialog>
        </div>
      </td>
    </tr>
  );
}

export default function BuildingFacilitiesPage() {
  const params = useParams();
  const buildingId = (params?.id as string) || "";
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();

  const {
    data: facilitiesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organization-facilities", orgId, buildingId],
    queryFn: () => getOrganizationFacilities(orgId, { buildingId, limit: 100 }),
    enabled: Boolean(orgId && buildingId),
  });

  const { statusText, announcement, manualRefresh } = useBuildingRealtime({
    buildingId,
    onRefresh: () => {
      refetch();
    },
  });

  const mutation = useMutation({
    mutationFn: ({
      facilityId,
      status,
      verificationLevel,
    }: {
      facilityId: string;
      status: OperationalStatus;
      verificationLevel: VerificationLevel;
    }) => updateFacilityStatus(facilityId, { status, verificationLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-facilities", orgId, buildingId],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization-dashboard", orgId],
      });
    },
  });

  const handleUpdate = (
    facilityId: string,
    status: OperationalStatus,
    verificationLevel: VerificationLevel,
  ) => {
    mutation.mutate({ facilityId, status, verificationLevel });
  };

  const [sortCol, setSortCol] = React.useState<
    "name" | "operationalStatus" | "verificationLevel" | "lastVerifiedAt" | null
  >(null);
  const [sortDir, setSortDir] = React.useState<"ascending" | "descending">("ascending");

  const handleSort = (
    col: "name" | "operationalStatus" | "verificationLevel" | "lastVerifiedAt",
  ) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "ascending" ? "descending" : "ascending"));
    } else {
      setSortCol(col);
      setSortDir("ascending");
    }
  };

  const getSortedItems = (items: OrganizationFacilityItem[]) => {
    if (!sortCol) return items;
    return [...items].sort((a, b) => {
      let valA: string | number = a[sortCol] ?? "";
      let valB: string | number = b[sortCol] ?? "";
      if (sortCol === "lastVerifiedAt") {
        valA = a.lastVerifiedAt ? new Date(a.lastVerifiedAt).getTime() : 0;
        valB = b.lastVerifiedAt ? new Date(b.lastVerifiedAt).getTime() : 0;
      }
      if (valA < valB) return sortDir === "ascending" ? -1 : 1;
      if (valA > valB) return sortDir === "ascending" ? 1 : -1;
      return 0;
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6" role="status">
        <p className="text-base font-medium text-[var(--foreground)]">
          Loading building facilities...
        </p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load facilities";
    return (
      <GlassPanel
        role="alert"
        className="rounded-lg border-2 border-red-600 bg-red-50/80 p-6 text-red-900 dark:bg-red-950/80 dark:text-red-100"
      >
        <h2 className="text-lg font-bold">Error loading facilities</h2>
        <p className="mt-2 text-sm">{errorMsg}</p>
        <GlassButton type="button" onClick={() => refetch()} className="mt-4 min-h-[24px]">
          Try Again
        </GlassButton>
      </GlassPanel>
    );
  }

  const facilities = facilitiesData?.items ?? [];

  const grouped = facilities.reduce(
    (acc, fac) => {
      const type = fac.facilityType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(fac);
      return acc;
    },
    {} as Record<FacilityType, OrganizationFacilityItem[]>,
  );

  const groupKeys = Object.keys(grouped) as FacilityType[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1">
            <Link
              href="/organization/buildings"
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              ← Back to Buildings
            </Link>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Facility Status & Controls</h2>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
            role="status"
          >
            {statusText}
          </div>

          <button
            type="button"
            onClick={manualRefresh}
            className="rounded-md border-2 border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {announcement ? (
        <div
          role="status"
          className="rounded-md border border-blue-400 bg-blue-50 p-3 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100"
        >
          {announcement}
        </div>
      ) : null}

      {groupKeys.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-base font-medium text-[var(--foreground)]">No facilities registered</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            This building does not have any recorded accessibility facilities or lifts.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupKeys.map((type) => {
            const items = grouped[type] || [];
            const typeHeader = type.replace(/_/g, " ");

            return (
              <GlassPanel key={type} className="p-4 shadow-sm">
                <h3 className="mb-4 text-base font-bold uppercase tracking-wider text-[var(--foreground)]">
                  {typeHeader} ({items.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      List of {typeHeader} facilities and operational controls
                    </caption>
                    <thead>
                      <tr className="border-b-2 border-[var(--border)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                        <th
                          scope="col"
                          className="px-4 py-2"
                          aria-sort={sortCol === "name" ? sortDir : "none"}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("name")}
                            className="inline-flex min-h-[24px] items-center gap-1 font-semibold uppercase hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                          >
                            <span>Facility Name</span>
                            <span aria-hidden="true" className="text-xs">
                              {sortCol === "name" ? (sortDir === "ascending" ? " ▲" : " ▼") : " ↕"}
                            </span>
                          </button>
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2"
                          aria-sort={sortCol === "operationalStatus" ? sortDir : "none"}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("operationalStatus")}
                            className="inline-flex min-h-[24px] items-center gap-1 font-semibold uppercase hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                          >
                            <span>Operational Status</span>
                            <span aria-hidden="true" className="text-xs">
                              {sortCol === "operationalStatus"
                                ? sortDir === "ascending"
                                  ? " ▲"
                                  : " ▼"
                                : " ↕"}
                            </span>
                          </button>
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2"
                          aria-sort={sortCol === "verificationLevel" ? sortDir : "none"}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("verificationLevel")}
                            className="inline-flex min-h-[24px] items-center gap-1 font-semibold uppercase hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                          >
                            <span>Verification</span>
                            <span aria-hidden="true" className="text-xs">
                              {sortCol === "verificationLevel"
                                ? sortDir === "ascending"
                                  ? " ▲"
                                  : " ▼"
                                : " ↕"}
                            </span>
                          </button>
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2"
                          aria-sort={sortCol === "lastVerifiedAt" ? sortDir : "none"}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("lastVerifiedAt")}
                            className="inline-flex min-h-[24px] items-center gap-1 font-semibold uppercase hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                          >
                            <span>Last Verified</span>
                            <span aria-hidden="true" className="text-xs">
                              {sortCol === "lastVerifiedAt"
                                ? sortDir === "ascending"
                                  ? " ▲"
                                  : " ▼"
                                : " ↕"}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-4 py-2 text-right">
                          Update Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedItems(items).map((facility) => (
                        <FacilityRow
                          key={facility.id}
                          facility={facility}
                          onSave={handleUpdate}
                          isSaving={mutation.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
