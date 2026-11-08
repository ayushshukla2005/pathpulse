"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EVIDENCE_STATUS_LABELS,
  REPORT_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
} from "@pathpulse/validation";
import {
  AllowedActionItem,
  AuditLogItem,
  DuplicateSuggestion,
  ReportWorkflowSummary,
  WorkflowAction,
} from "@pathpulse/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  confirmResolution,
  getReportAudit,
  getReportById,
  getReportDuplicates,
  getReportWorkflowSummary,
  rejectReport,
  reopenReport,
  reviewReport,
  verifyReport,
} from "@/lib/api/reports";
import { useAuth } from "@/lib/auth/auth-context";

export default function ModeratorReportReviewPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Array.isArray(params["id"]) ? params["id"][0] : (params["id"] as string);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isModerator = user?.role === "MODERATOR" || user?.role === "SUPER_ADMIN";

  const [activeReasonAction, setActiveReasonAction] = React.useState<WorkflowAction | null>(null);
  const [reasonInput, setReasonInput] = React.useState("");
  const [reasonError, setReasonError] = React.useState("");
  const [announcement, setAnnouncement] = React.useState("");

  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
    error: reportErr,
  } = useQuery({
    queryKey: ["moderator-report", id],
    queryFn: () => getReportById(id as string),
    enabled: !!id && isAuthenticated && isModerator,
  });

  const { data: workflowSummary, isLoading: summaryLoading } = useQuery<ReportWorkflowSummary>({
    queryKey: ["report-workflow-summary", id],
    queryFn: () => getReportWorkflowSummary(id as string),
    enabled: !!id && isAuthenticated && isModerator,
  });

  const { data: auditHistory = [] } = useQuery<AuditLogItem[]>({
    queryKey: ["report-audit", id],
    queryFn: () => getReportAudit(id as string),
    enabled: !!id && isAuthenticated && isModerator,
  });

  const { data: duplicates = [] } = useQuery<DuplicateSuggestion[]>({
    queryKey: ["report-duplicates", id],
    queryFn: () => getReportDuplicates(id as string),
    enabled: !!id && isAuthenticated && isModerator,
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewReport(id as string),
    onSuccess: () => {
      setAnnouncement("Report state transitioned to Under Review.");
      queryClient.invalidateQueries({ queryKey: ["moderator-report", id] });
      queryClient.invalidateQueries({ queryKey: ["report-workflow-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["report-audit", id] });
    },
    onError: (err: Error) => {
      setAnnouncement(`Review action failed: ${err.message}`);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyReport(id as string),
    onSuccess: () => {
      setAnnouncement("Report verified and confirmed as an active barrier.");
      queryClient.invalidateQueries({ queryKey: ["moderator-report", id] });
      queryClient.invalidateQueries({ queryKey: ["report-workflow-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["report-audit", id] });
    },
    onError: (err: Error) => {
      setAnnouncement(`Verification failed: ${err.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectReport(id as string, reason),
    onSuccess: () => {
      setAnnouncement("Report rejected with recorded rationale.");
      setActiveReasonAction(null);
      setReasonInput("");
      queryClient.invalidateQueries({ queryKey: ["moderator-report", id] });
      queryClient.invalidateQueries({ queryKey: ["report-workflow-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["report-audit", id] });
    },
    onError: (err: Error) => {
      setAnnouncement(`Rejection failed: ${err.message}`);
    },
  });

  const confirmResolutionMutation = useMutation({
    mutationFn: () => confirmResolution(id as string),
    onSuccess: () => {
      setAnnouncement("Barrier resolution confirmed and report closed.");
      queryClient.invalidateQueries({ queryKey: ["moderator-report", id] });
      queryClient.invalidateQueries({ queryKey: ["report-workflow-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["report-audit", id] });
    },
    onError: (err: Error) => {
      setAnnouncement(`Resolution confirmation failed: ${err.message}`);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (reason: string) => reopenReport(id as string, reason),
    onSuccess: () => {
      setAnnouncement("Barrier report reopened for remediation.");
      setActiveReasonAction(null);
      setReasonInput("");
      queryClient.invalidateQueries({ queryKey: ["moderator-report", id] });
      queryClient.invalidateQueries({ queryKey: ["report-workflow-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["report-audit", id] });
    },
    onError: (err: Error) => {
      setAnnouncement(`Reopen failed: ${err.message}`);
    },
  });

  if (authLoading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-4xl mx-auto p-12 text-center text-[var(--muted-foreground)]">
          Loading moderation dashboard...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !isModerator) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            role="alert"
            className="p-5 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          >
            <h1 className="text-xl font-bold">Access Restricted</h1>
            <p className="mt-1 text-sm">
              Moderator privileges are required to inspect and act on this report.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            &larr; Return to Explore
          </Link>
        </div>
      </main>
    );
  }

  if (reportLoading || summaryLoading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-4xl mx-auto p-12 text-center text-[var(--muted-foreground)]">
          Loading moderation dashboard...
        </div>
      </main>
    );
  }

  if (reportError || !report) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            role="alert"
            className="p-5 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          >
            <h1 className="text-xl font-bold">Report Not Found</h1>
            <p className="mt-1 text-sm">
              {reportErr instanceof Error
                ? reportErr.message
                : "The requested report was not found."}
            </p>
          </div>
          <Link
            href="/reports"
            className="inline-flex items-center text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            &larr; Return to Reports
          </Link>
        </div>
      </main>
    );
  }

  const handleActionClick = (item: AllowedActionItem) => {
    setReasonError("");
    if (item.requiresReason) {
      setActiveReasonAction(item.action);
      setReasonInput("");
      return;
    }

    if (item.action === "REVIEW") {
      reviewMutation.mutate();
    } else if (item.action === "VERIFY") {
      verifyMutation.mutate();
    } else if (item.action === "CONFIRM_RESOLUTION") {
      confirmResolutionMutation.mutate();
    }
  };

  const handleReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reasonInput.trim();
    if (!trimmed) {
      setReasonError("Please enter a valid non-empty reason.");
      return;
    }

    if (activeReasonAction === "REJECT") {
      rejectMutation.mutate(trimmed);
    } else if (activeReasonAction === "REOPEN") {
      reopenMutation.mutate(trimmed);
    }
  };

  const allowedActions = workflowSummary?.allowedActions || [];
  const statusMeta = REPORT_STATUS_LABELS[report.status] || {
    label: report.status,
    explanation: "",
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="container mx-auto max-w-5xl px-4 py-8 focus:outline-none space-y-8"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <nav aria-label="Breadcrumbs" className="text-sm text-[var(--muted-foreground)] mb-1">
            <Link href="/reports" className="hover:underline">
              Reports
            </Link>{" "}
            / <span aria-current="page">Moderation Review</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Review Report: {report.tracking_code}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
            Status: {statusMeta.label}
          </span>
          {workflowSummary && workflowSummary.reopenCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              Reopened {workflowSummary.reopenCount}x
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Barrier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Category
                </span>
                <p className="text-base font-semibold text-[var(--foreground)] mt-0.5">
                  {REPORT_CATEGORY_LABELS[report.category] || report.category}
                </p>
              </div>

              {report.title && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Title
                  </span>
                  <p className="text-base font-semibold text-[var(--foreground)] mt-0.5">
                    {report.title}
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Description
                </span>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap mt-0.5">
                  {report.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] font-semibold">
                    Venue
                  </span>
                  <p className="font-medium text-[var(--foreground)]">
                    {report.venue?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] font-semibold">
                    Facility
                  </span>
                  <p className="font-medium text-[var(--foreground)]">
                    {report.facility?.name || "General area"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence Photographs</CardTitle>
            </CardHeader>
            <CardContent>
              {!report.evidence || report.evidence.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No photographic evidence submitted for this barrier.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.evidence.map((ev, idx) => (
                    <div
                      key={ev.id}
                      className="border-2 border-[var(--border)] rounded-md p-3 space-y-2 bg-[var(--card)]"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">Photo #{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold border border-[var(--border)]">
                          {EVIDENCE_STATUS_LABELS[ev.status] || ev.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Size: {(ev.size_bytes / 1024).toFixed(1)} KB ({ev.content_type})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duplicate Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[var(--muted-foreground)]">
                Candidates evaluated by normalized token similarity. Suggestions are for moderation
                review only; reports are never automatically merged.
              </p>

              {duplicates.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] italic">
                  No duplicate reports detected within the active window.
                </p>
              ) : (
                <ul
                  className="divide-y divide-[var(--border)]"
                  aria-label="Duplicate report candidates"
                >
                  {duplicates.map((dup) => (
                    <li key={dup.candidateId} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--foreground)]">
                            {dup.trackingCode}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                            {dup.status}
                          </span>
                        </div>
                        {dup.title && (
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {dup.title}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          {Math.round(dup.similarity * 100)}% match
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Append-Only Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              {auditHistory.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No previous state transitions recorded.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" aria-label="Report audit timeline">
                    <thead>
                      <tr className="border-b text-xs uppercase text-[var(--muted-foreground)]">
                        <th className="py-2 pr-3">Timestamp</th>
                        <th className="py-2 pr-3">Actor</th>
                        <th className="py-2 pr-3">Action</th>
                        <th className="py-2 pr-3">Transition</th>
                        <th className="py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {auditHistory.map((item) => (
                        <tr key={item.id} className="text-xs">
                          <td className="py-2 pr-3 whitespace-nowrap text-[var(--muted-foreground)]">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 pr-3 font-semibold text-[var(--foreground)]">
                            {item.actorName || "System"}
                          </td>
                          <td className="py-2 pr-3 font-mono">{item.action}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            <span className="text-[var(--muted-foreground)]">
                              {item.fromStatus || "—"}
                            </span>
                            {" &rarr; "}
                            <span className="font-bold text-[var(--foreground)]">
                              {item.toStatus}
                            </span>
                          </td>
                          <td className="py-2 text-[var(--muted-foreground)]">
                            {item.reason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-[var(--border)]">
            <CardHeader>
              <CardTitle>Moderator Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                Available actions are computed by the verification state machine based on your role,
                separation of duties, and barrier requirements.
              </p>

              {allowedActions.length === 0 ? (
                <div className="p-3 bg-[var(--muted)] rounded text-xs text-[var(--muted-foreground)]">
                  No moderation actions available for this report at its current status.
                </div>
              ) : (
                <div className="space-y-2" role="group" aria-label="Workflow actions">
                  {allowedActions.map((item) => (
                    <Button
                      key={item.action}
                      type="button"
                      variant={item.action === "REJECT" ? "outline" : "default"}
                      className="w-full justify-center font-bold"
                      onClick={() => handleActionClick(item)}
                      disabled={
                        reviewMutation.isPending ||
                        verifyMutation.isPending ||
                        rejectMutation.isPending ||
                        confirmResolutionMutation.isPending ||
                        reopenMutation.isPending
                      }
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              )}

              {activeReasonAction && (
                <form
                  onSubmit={handleReasonSubmit}
                  className="mt-4 p-4 border-2 border-[var(--primary)] rounded-lg bg-[var(--card)] space-y-3"
                  aria-labelledby="reason-heading"
                >
                  <h3 id="reason-heading" className="text-sm font-bold text-[var(--foreground)]">
                    Rationale Required for {activeReasonAction}
                  </h3>
                  <div>
                    <label htmlFor="action-reason-input" className="sr-only">
                      Reason for action
                    </label>
                    <textarea
                      id="action-reason-input"
                      rows={3}
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      placeholder="Enter a descriptive rationale for audit records..."
                      className="w-full p-2 text-sm border-2 border-[var(--input)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      required
                      aria-invalid={!!reasonError}
                      aria-describedby={reasonError ? "reason-error-msg" : undefined}
                    />
                    {reasonError && (
                      <p
                        id="reason-error-msg"
                        role="alert"
                        className="text-xs text-red-600 mt-1 font-semibold"
                      >
                        {reasonError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="font-bold flex-1">
                      Confirm {activeReasonAction}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveReasonAction(null);
                        setReasonInput("");
                        setReasonError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
