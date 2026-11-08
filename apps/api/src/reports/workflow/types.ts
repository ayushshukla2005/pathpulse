import { AiSuggestionItem } from "@pathpulse/shared-types";

export type ReportStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "RESOLUTION_SUBMITTED"
  | "CLOSED"
  | "REJECTED"
  | "REOPENED";

export type UserRole = "USER" | "ORGANIZATION_ADMIN" | "MODERATOR" | "SUPER_ADMIN";

export type ReportCategory = "BROKEN_LIFT" | "BLOCKED_RAMP" | "INACCESSIBLE_ENTRANCE" | "OTHER";

export type WorkflowAction =
  | "REVIEW"
  | "VERIFY"
  | "REJECT"
  | "ASSIGN"
  | "SUBMIT_RESOLUTION"
  | "CONFIRM_RESOLUTION"
  | "REOPEN"
  | "CLOSE_REJECTED";

export type WorkflowError =
  | "INVALID_TRANSITION"
  | "FORBIDDEN_ROLE"
  | "SELF_ACTION_FORBIDDEN"
  | "SEPARATION_OF_DUTIES"
  | "REASON_REQUIRED"
  | "EVIDENCE_REQUIRED";

export interface WorkflowFacts {
  reporterId: string;
  resolutionSubmittedByUserId?: string | null;
  assigneeIsMember?: boolean;
  receivedEvidenceCount?: number;
  reason?: string | null;
}

export interface WorkflowTransitionContext {
  actorId: string;
  actorRole: UserRole;
  isMemberOfOwningOrg: boolean;
  currentState: ReportStatus;
  action: WorkflowAction;
  facts: WorkflowFacts;
}

export type TransitionSuccess = {
  success: true;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  action: WorkflowAction;
  shouldIncrementReopenCount: boolean;
};

export type TransitionFailure = {
  success: false;
  error: WorkflowError;
  message: string;
};

export type TransitionResult = TransitionSuccess | TransitionFailure;

export interface AllowedActionItem {
  action: WorkflowAction;
  label: string;
  targetStatus: ReportStatus;
  requiresReason?: boolean;
}

export interface WorkflowReportData {
  id: string;
  trackingCode: string;
  status: ReportStatus;
  category: ReportCategory;
  reporterId: string;
  assignedToUserId?: string | null;
  verifiedByUserId?: string | null;
  resolutionSubmittedByUserId?: string | null;
  reopenCount: number;
  resolvedAt?: Date | string | null;
  receivedEvidenceCount?: number;
}

export interface ReportWorkflowSummary {
  id: string;
  trackingCode: string;
  status: ReportStatus;
  category: ReportCategory;
  reopenCount: number;
  assignedToUserId: string | null;
  verifiedByUserId: string | null;
  resolvedAt: string | null;
  allowedActions: AllowedActionItem[];
  aiSuggestions?: AiSuggestionItem[];
}
