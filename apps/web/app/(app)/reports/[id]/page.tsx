"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  EVIDENCE_STATUS_LABELS,
  REPORT_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
} from "@pathpulse/validation";
import { getReportById } from "@/lib/api/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportDetailPage() {
  const params = useParams();
  const id = Array.isArray(params["id"]) ? params["id"][0] : (params["id"] as string);

  const [copiedCode, setCopiedCode] = React.useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("");

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["report-detail", id],
    queryFn: () => getReportById(id as string),
    enabled: !!id,
  });

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setLiveAnnouncement("Tracking code copied to clipboard.");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      setLiveAnnouncement("Could not copy code to clipboard.");
    }
  };

  if (isLoading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-3xl mx-auto p-12 text-center text-[var(--muted-foreground)]">
          Loading report details...
        </div>
      </main>
    );
  }

  if (isError || !report) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <div
            role="alert"
            className="p-5 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          >
            <h1 className="text-xl font-bold">Report Not Found</h1>
            <p className="mt-1 text-sm">
              {error instanceof Error ? error.message : "The requested report could not be found."}
            </p>
          </div>
          <Link
            href="/reports"
            className="inline-flex items-center text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            &larr; Back to My Reports
          </Link>
        </div>
      </main>
    );
  }

  const statusMeta = REPORT_STATUS_LABELS[report.status] || {
    label: "Submitted",
    explanation: "Your report has been received and is queued for verification.",
  };

  const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const evidenceList = report.evidence || [];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="container mx-auto px-4 py-8 focus:outline-none"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div aria-live="polite" className="sr-only" role="status">
          {liveAnnouncement}
        </div>

        <nav aria-label="Breadcrumb">
          <Link
            href="/reports"
            className="inline-flex items-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            &larr; Back to My Reports
          </Link>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {REPORT_CATEGORY_LABELS[report.category]}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Submitted on {formattedDate}
            </p>
          </div>
        </div>

        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--foreground)]">
              Tracking & Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[var(--muted)] border-2 border-[var(--border)]">
              <div>
                <span className="block text-xs font-semibold text-[var(--muted-foreground)]">
                  Tracking Code
                </span>
                <span className="font-mono text-xl font-bold tracking-wider text-[var(--foreground)]">
                  {report.tracking_code}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(report.tracking_code)}
                aria-label="Copy tracking code"
              >
                {copiedCode ? "Copied!" : "Copy Code"}
              </Button>
            </div>

            <div className="p-4 rounded-lg border-2 border-[var(--border)] space-y-1">
              <span className="block text-xs font-semibold text-[var(--muted-foreground)]">
                Status
              </span>
              <div className="flex items-center space-x-2">
                <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] pt-1">
                {statusMeta.explanation}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--foreground)]">Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block font-semibold text-[var(--muted-foreground)]">Venue</span>
                <span className="font-medium text-[var(--foreground)]">
                  {report.venue?.name || "Not specified"}
                </span>
              </div>

              <div>
                <span className="block font-semibold text-[var(--muted-foreground)]">Facility</span>
                <span className="font-medium text-[var(--foreground)]">
                  {report.facility?.name || "General Venue Area"}
                </span>
              </div>

              {(report.latitude !== null && report.latitude !== undefined) ||
              (report.longitude !== null && report.longitude !== undefined) ? (
                <div className="sm:col-span-2">
                  <span className="block font-semibold text-[var(--muted-foreground)]">
                    Coordinates
                  </span>
                  <span className="font-mono text-sm text-[var(--foreground)]">
                    Latitude: {report.latitude ?? "N/A"}, Longitude: {report.longitude ?? "N/A"}
                  </span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--foreground)]">Barrier Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
              {report.description}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--foreground)]">
              Photographic Evidence ({evidenceList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evidenceList.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No photographs were attached to this barrier report.
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Attached evidence items">
                {evidenceList.map((ev, index) => {
                  const evStatus = EVIDENCE_STATUS_LABELS[ev.status] || ev.status;
                  const kbSize = (ev.size_bytes / 1024).toFixed(1);

                  return (
                    <li
                      key={ev.id}
                      className="p-4 rounded-lg border-2 border-[var(--border)] bg-[var(--muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-sm text-[var(--foreground)]">
                          Photo #{index + 1}
                        </span>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 space-x-2">
                          <span>Format: {ev.content_type}</span>
                          <span>&bull;</span>
                          <span>Size: {kbSize} KB</span>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ev.status === "RECEIVED"
                              ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200"
                              : ev.status === "REJECTED"
                                ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200"
                          }`}
                        >
                          {evStatus}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
