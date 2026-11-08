"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationBuildings } from "@/lib/api/organizations";
import { useOrganization } from "../organization-context";

export default function OrganizationBuildingsPage() {
  const { orgId } = useOrganization();

  const {
    data: buildingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organization-buildings", orgId],
    queryFn: () => getOrganizationBuildings(orgId),
    enabled: Boolean(orgId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6" role="status">
        <p className="text-base font-medium text-[var(--foreground)]">Loading buildings...</p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load buildings";
    return (
      <div
        role="alert"
        className="rounded-lg border-2 border-red-600 bg-red-50 p-6 text-red-900 dark:bg-red-950 dark:text-red-100"
      >
        <h2 className="text-lg font-bold">Error loading buildings</h2>
        <p className="mt-2 text-sm">{errorMsg}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-md border-2 border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const buildings = buildingsData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Managed Buildings</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Select a building to inspect and manage real-time status of elevators, ramps, and
          facilities.
        </p>
      </div>

      {buildings.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-base font-medium text-[var(--foreground)]">No buildings found</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            No buildings have been registered under your organization yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <div
              key={building.id}
              className="flex flex-col justify-between rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:border-[var(--primary)]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">{building.name}</h3>
                  {building.buildingCode ? (
                    <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                      {building.buildingCode}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Venue: {building.venueName}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Floors</p>
                    <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                      {building.floorCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Facilities</p>
                    <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                      {building.facilityCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Version</p>
                    <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                      v{building.graphVersion}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/organization/buildings/${building.id}/facilities`}
                  className="inline-flex w-full items-center justify-center rounded-md border-2 border-transparent bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                >
                  Manage Facilities
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
