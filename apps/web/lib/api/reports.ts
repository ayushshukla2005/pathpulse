import type {
  CompleteEvidenceResponse,
  CreateEvidenceRequest,
  CreateEvidenceResponse,
  CreateReportRequest,
  IssueReportItem,
  PaginatedReportsResponse,
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
