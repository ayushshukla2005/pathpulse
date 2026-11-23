"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EVIDENCE_STATUS_LABELS, REPORT_CATEGORY_LABELS } from "@pathpulse/validation";
import { getReportById } from "@/lib/api/reports";
import { GlassCard, GlassPanel, GlassButton } from "@/components/ui/glass";

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
    retry: false,
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
          <GlassPanel
            role="alert"
            className="p-5 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          >
            <h1 className="text-xl font-bold">Report Not Found</h1>
            <p className="mt-1 text-sm">
              {error instanceof Error ? error.message : "The requested report could not be found."}
            </p>
          </GlassPanel>
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

  const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isRejected = report.status === "REJECTED";
  const historySteps = isRejected
    ? [
        {
          key: "SUBMITTED",
          label: "Submitted",
          date: formattedDate,
          state: "completed",
          description: "Report received and logged into PathPulse.",
        },
        {
          key: "UNDER_REVIEW",
          label: "Under Review",
          state: "completed",
          description: "Moderator evaluated the report details.",
        },
        {
          key: "REJECTED",
          label: "Rejected",
          state: "current",
          description: "The report could not be verified or was marked as duplicate.",
        },
      ]
    : [
        {
          key: "SUBMITTED",
          label: "Submitted",
          date: formattedDate,
          state: "completed",
          description: "Report received and queued for verification.",
        },
        {
          key: "UNDER_REVIEW",
          label: "Under Review",
          state:
            report.status === "SUBMITTED"
              ? "upcoming"
              : report.status === "UNDER_REVIEW"
                ? "current"
                : "completed",
          description: "Moderator reviewing barrier evidence and facility context.",
        },
        {
          key: "VERIFIED",
          label: "Verified",
          state:
            report.status === "SUBMITTED" || report.status === "UNDER_REVIEW"
              ? "upcoming"
              : report.status === "VERIFIED"
                ? "current"
                : "completed",
          description: "Barrier confirmed and communicated to facility administrators.",
        },
        {
          key: "CLOSED",
          label: "Resolved & Closed",
          state:
            report.status === "CLOSED" || report.status === "RESOLUTION_SUBMITTED"
              ? "current"
              : "upcoming",
          description: "Barrier remediated and verified accessible.",
        },
      ];

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

        <GlassCard className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Tracking & Verification Status
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
            <div>
              <span className="block text-xs font-semibold text-[var(--muted-foreground)]">
                Tracking Code
              </span>
              <span className="font-mono text-xl font-bold tracking-wider text-[var(--foreground)]">
                {report.tracking_code}
              </span>
            </div>
            <GlassButton
              type="button"
              onClick={() => handleCopyCode(report.tracking_code)}
              aria-label="Copy tracking code"
              className="min-h-[32px] text-xs font-semibold"
            >
              {copiedCode ? "Copied!" : "Copy Code"}
            </GlassButton>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              Status History
            </h3>
            <ol
              className="relative border-l-2 border-[var(--glass-border)] ml-3 space-y-6 list-none p-0"
              aria-label="Status history"
            >
              {historySteps.map((step, idx) => {
                const isComplete = step.state === "completed";
                const isCurrent = step.state === "current";
                return (
                  <li key={step.key} className="ml-6 relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[33px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isComplete
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] ring-4 ring-[var(--primary)]/20"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--glass-border)]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--foreground)]">
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            Current
                          </span>
                        )}
                        {isComplete && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            ✓ Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {step.description}
                      </p>
                      {step.date && (
                        <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 block">
                          {step.date}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Location Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
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
        </GlassCard>

        <GlassCard className="p-6 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Barrier Description</h2>
          </div>
          <p className="text-base text-[var(--foreground)] whitespace-pre-wrap leading-relaxed pt-2">
            {report.description}
          </p>
        </GlassCard>

        <GlassCard className="p-6 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Photographic Evidence ({evidenceList.length})
            </h2>
          </div>
          {evidenceList.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] pt-2">
              No photographs were attached to this barrier report.
            </p>
          ) : (
            <ul className="space-y-3 pt-2" aria-label="Attached evidence items">
              {evidenceList.map((ev, index) => {
                const evStatus = EVIDENCE_STATUS_LABELS[ev.status] || ev.status;
                const kbSize = (ev.size_bytes / 1024).toFixed(1);

                return (
                  <li
                    key={ev.id}
                    className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
        </GlassCard>
      </div>
    </main>
  );
}
