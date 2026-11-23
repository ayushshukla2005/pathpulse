"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationDashboard } from "@/lib/api/organizations";
import { GlassCard, GlassPanel, GlassButton } from "@/components/ui/glass";
import { useOrganization } from "./organization-context";

export default function OrganizationOverviewPage() {
  const { orgId } = useOrganization();

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organization-dashboard", orgId],
    queryFn: () => getOrganizationDashboard(orgId),
    enabled: Boolean(orgId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6" role="status">
        <p className="text-base font-medium text-[var(--foreground)]">
          Loading organization metrics...
        </p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load dashboard metrics";
    return (
      <GlassPanel
        role="alert"
        className="rounded-lg border-2 border-red-600 bg-red-50/80 p-6 text-red-900 dark:bg-red-950/80 dark:text-red-100"
      >
        <h2 className="text-lg font-bold">Error loading analytics</h2>
        <p className="mt-2 text-sm">{errorMsg}</p>
        <GlassButton type="button" onClick={() => refetch()} className="mt-4 min-h-[24px]">
          Try Again
        </GlassButton>
      </GlassPanel>
    );
  }

  const generatedDate = metrics?.generatedAt
    ? new Date(metrics.generatedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Recently";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Analytics & Key Metrics</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Last updated:{" "}
          <span className="font-semibold text-[var(--foreground)]">{generatedDate}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 shadow-sm">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            Verified Route Coverage
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {metrics?.verifiedRouteCoverage !== undefined
              ? `${metrics.verifiedRouteCoverage.toFixed(1)}%`
              : "0.0%"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Percentage of navigation paths in your buildings that are confirmed operational and
            step-free verified.
          </p>
        </GlassCard>

        <GlassCard className="p-5 shadow-sm">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Pending Issues</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {metrics?.pendingIssues ?? 0}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Barriers actively requiring review, verification, maintenance assignment, or resolution
            confirmation.
          </p>
        </GlassCard>

        <GlassCard className="p-5 shadow-sm">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Verified Facilities</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {metrics?.verifiedFacilities ?? 0}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Total accessibility fixtures, elevators, ramps, and restrooms with verified confirmed
            status.
          </p>
        </GlassCard>

        <GlassCard className="p-5 shadow-sm">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            Resolved (Last 30 Days)
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {metrics?.resolvedReports ?? 0}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Accessibility barrier reports closed and confirmed remediated during the past 30 days.
          </p>
        </GlassCard>
      </div>

      <GlassPanel className="p-6">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          About Institution Data & Integrity
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--foreground)]">•</span>
            <span>
              All accessibility metrics are computed via aggregated database calculations across all
              venues registered to your organization.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--foreground)]">•</span>
            <span>
              When facilities change status (such as an elevator outage), the building graph version
              bumps immediately, invalidating cached routes and broadcasting live updates to
              connected visitors.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[var(--foreground)]">•</span>
            <span>
              Every modification creates a permanent, tamper-resistant audit row for accountability.
            </span>
          </li>
        </ul>
      </GlassPanel>
    </div>
  );
}
