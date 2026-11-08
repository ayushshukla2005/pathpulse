import { ReportCategory } from "@prisma/client";

export interface AiClassifyRequest {
  description: string;
  imageHint?: string;
}

export interface AiClassifyResponse {
  category: ReportCategory;
  severity: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  requiresHumanVerification: true;
  modelVersion: string;
}

export interface AiReportInput {
  id: string;
  description: string;
}

export interface AiSummarizeRequest {
  reports: AiReportInput[];
}

export interface AiSummarizeResponse {
  summary: string;
  coveredReportIds: string[];
  requiresHumanVerification: true;
  modelVersion: string;
}

export interface AiDuplicateScoreItem {
  id: string;
  similarityScore: number;
  isLikelyDuplicate: boolean;
}

export interface AiDuplicateScoresRequest {
  candidateDescription: string;
  comparisonReports: AiReportInput[];
  threshold?: number;
}

export interface AiDuplicateScoresResponse {
  scores: AiDuplicateScoreItem[];
  threshold: number;
  requiresHumanVerification: true;
  modelVersion: string;
}
