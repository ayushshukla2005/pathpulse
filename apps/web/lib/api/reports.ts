import type {
  AuditLogItem,
  CompleteEvidenceResponse,
  CreateEvidenceRequest,
  CreateEvidenceResponse,
  CreateReportRequest,
  DuplicateSuggestion,
  IssueReportItem,
  PaginatedReportsResponse,
  ReportWorkflowSummary,
} from "@pathpulse/shared-types";
import { apiClient } from "./client";

export async function createReport(data: CreateReportRequest): Promise<IssueReportItem> {
  return apiClient<IssueReportItem>("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyReports(page = 1, limit = 20): Promise<PaginatedReportsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiClient<PaginatedReportsResponse>(`/reports/mine?${params.toString()}`, {
    method: "GET",
  });
}

export async function getReportById(id: string): Promise<IssueReportItem> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<IssueReportItem>(`/reports/${safeId}`, {
    method: "GET",
  });
}

export async function createEvidence(
  reportId: string,
  data: CreateEvidenceRequest,
): Promise<CreateEvidenceResponse> {
  const safeId = encodeURIComponent(reportId.trim());
  return apiClient<CreateEvidenceResponse>(`/reports/${safeId}/evidence`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function completeEvidence(evidenceId: string): Promise<CompleteEvidenceResponse> {
  const safeId = encodeURIComponent(evidenceId.trim());
  return apiClient<CompleteEvidenceResponse>(`/evidence/${safeId}/complete`, {
    method: "POST",
  });
}

export async function reviewReport(id: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/review`, {
    method: "POST",
  });
}

export async function verifyReport(id: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/verify`, {
    method: "POST",
  });
}

export async function rejectReport(id: string, reason: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function assignReport(
  id: string,
  assignedToUserId: string,
): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignedToUserId }),
  });
}

export async function submitResolution(id: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/resolution`, {
    method: "POST",
  });
}

export async function confirmResolution(id: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/confirm-resolution`, {
    method: "POST",
  });
}

export async function reopenReport(id: string, reason: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/reopen`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getReportAudit(id: string): Promise<AuditLogItem[]> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<AuditLogItem[]>(`/reports/${safeId}/audit`, {
    method: "GET",
  });
}

export async function getReportDuplicates(id: string): Promise<DuplicateSuggestion[]> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<DuplicateSuggestion[]>(`/reports/${safeId}/duplicates`, {
    method: "GET",
  });
}

export async function getReportWorkflowSummary(id: string): Promise<ReportWorkflowSummary> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<ReportWorkflowSummary>(`/reports/${safeId}/workflow-summary`, {
    method: "GET",
  });
}

export function uploadPhotoToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage upload failed with HTTP status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during direct storage upload"));
    };

    xhr.send(file);
  });
}
