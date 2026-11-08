"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationMaintenanceTasks } from "@/lib/api/organizations";
import { useOrganization } from "../organization-context";

export default function OrganizationMaintenancePage() {
  const { orgId } = useOrganization();
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organization-maintenance-tasks", orgId, statusFilter],
    queryFn: () =>
      getOrganizationMaintenanceTasks(orgId, {
        status: statusFilter || undefined,
        limit: 100,
      }),
    enabled: Boolean(orgId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6" role="status">
        <p className="text-base font-medium text-[var(--foreground)]">
          Loading maintenance tasks...
        </p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load maintenance tasks";
    return (
      <div
        role="alert"
        className="rounded-lg border-2 border-red-600 bg-red-50 p-6 text-red-900 dark:bg-red-950 dark:text-red-100"
      >
        <h2 className="text-lg font-bold">Error loading tasks</h2>
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

  const tasks = tasksData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Maintenance Tasks</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Active repair and mitigation assignments for accessibility barriers in your venues.
          </p>
        </div>

        <div>
          <label htmlFor="filter-task-status" className="sr-only">
            Filter by task status
          </label>
          <select
            id="filter-task-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-2 border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-base font-medium text-[var(--foreground)]">No maintenance tasks</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            There are currently no maintenance tasks matching your selection.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border-2 border-[var(--border)] bg-[var(--card)] shadow-sm">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">List of assigned maintenance tasks</caption>
            <thead>
              <tr className="border-b-2 border-[var(--border)] text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                <th scope="col" className="px-4 py-3">
                  Report Details
                </th>
                <th scope="col" className="px-4 py-3">
                  Tracking Code
                </th>
                <th scope="col" className="px-4 py-3">
                  Assignee
                </th>
                <th scope="col" className="px-4 py-3">
                  Priority
                </th>
                <th scope="col" className="px-4 py-3">
                  Task Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Date Created
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const formattedDate = new Date(task.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const categoryLabel = task.reportCategory
                  ? task.reportCategory.replace(/_/g, " ")
                  : "General Barrier";

                return (
                  <tr
                    key={task.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                      <div>{task.reportTitle || "Accessibility barrier"}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{categoryLabel}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]">
                      {task.reportTrackingCode || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {task.assignedToName || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                      {task.priority}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-semibold text-[var(--foreground)]">{task.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {formattedDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
