"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { REPORT_CATEGORY_LABELS, REPORT_STATUS_LABELS } from "@pathpulse/validation";
import { getMyReports } from "@/lib/api/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyReportsPage() {
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-reports", page],
    queryFn: () => getMyReports(page, 20),
  });

  const reports = data?.data || [];
  const totalReports = data?.total || 0;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="container mx-auto px-4 py-8 focus:outline-none"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              My Barrier Reports
            </h1>
            <p className="mt-1 text-base text-[var(--muted-foreground)]">
              Track the status and progress of accessibility barriers you have submitted.
            </p>
          </div>
          <Link
            href="/reports/new"
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] self-start sm:self-auto"
          >
            Report a Barrier
          </Link>
        </div>

        {isLoading && (
          <div className="p-8 text-center border-2 border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--muted-foreground)]">
            Loading your reports...
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="p-4 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          >
            Failed to load your reports: {error instanceof Error ? error.message : "Network error"}
          </div>
        )}

        {!isLoading && !isError && reports.length === 0 && (
          <Card className="text-center py-12 border-2 border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-xl text-[var(--foreground)]">No Reports Yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-[var(--muted-foreground)] max-w-md mx-auto">
                You have not submitted any accessibility reports yet. If you encounter a broken
                lift, blocked ramp, or inaccessible entrance, let us know!
              </p>
              <Link
                href="/reports/new"
                className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] px-5 py-2.5 font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Submit Your First Report
              </Link>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && reports.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Showing {reports.length} of {totalReports} report{totalReports !== 1 ? "s" : ""}
            </p>
            <ul className="space-y-4" aria-label="My submitted accessibility reports">
              {reports.map((report) => {
                const statusMeta = REPORT_STATUS_LABELS[report.status] || {
                  label: "Submitted",
                  explanation: "Your report has been received and is queued for verification.",
                };
                const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const evidenceCount = report.evidence?.length || 0;

                return (
                  <li key={report.id}>
                    <Card className="border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold tracking-wider px-2.5 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]">
                              {report.tracking_code}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                              Status: {statusMeta.label}
                            </span>
                          </div>

                          <h2 className="text-lg font-bold text-[var(--foreground)]">
                            {REPORT_CATEGORY_LABELS[report.category]}
                          </h2>

                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                            {report.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)] pt-1">
                            {report.venue && (
                              <span>
                                Venue: <strong>{report.venue.name}</strong>
                              </span>
                            )}
                            {report.facility && (
                              <span>
                                Facility: <strong>{report.facility.name}</strong>
                              </span>
                            )}
                            <span>Submitted: {formattedDate}</span>
                            {evidenceCount > 0 && (
                              <span>
                                {evidenceCount} photo{evidenceCount !== 1 ? "s" : ""} attached
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/reports/${report.id}`}
                          className="inline-flex items-center justify-center rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] shrink-0 self-start sm:self-center"
                        >
                          View Details
                        </Link>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>

            {data && data.totalPages > 1 && (
              <nav
                aria-label="Pagination Navigation"
                className="flex justify-between items-center pt-4"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border-2 border-[var(--border)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--muted-foreground)]">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border-2 border-[var(--border)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
