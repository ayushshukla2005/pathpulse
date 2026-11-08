import {
  AllowedActionItem,
  ReportStatus,
  TransitionResult,
  UserRole,
  WorkflowAction,
  WorkflowReportData,
  WorkflowTransitionContext,
} from "./types";

interface TransitionRule {
  action: WorkflowAction;
  fromStates: ReportStatus[];
  toStatus: ReportStatus;
  allowedRoles: UserRole[];
  requiresReason?: boolean;
  requiresEvidence?: boolean;
  incrementsReopenCount?: boolean;
}

const TRANSITION_RULES: TransitionRule[] = [
  {
    action: "REVIEW",
    fromStates: ["SUBMITTED"],
    toStatus: "UNDER_REVIEW",
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"],
  },
  {
    action: "VERIFY",
    fromStates: ["UNDER_REVIEW"],
    toStatus: "VERIFIED",
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"],
  },
  {
    action: "REJECT",
    fromStates: ["UNDER_REVIEW"],
    toStatus: "REJECTED",
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"],
    requiresReason: true,
  },
  {
    action: "ASSIGN",
    fromStates: ["VERIFIED", "REOPENED"],
    toStatus: "ASSIGNED",
    allowedRoles: ["ORGANIZATION_ADMIN", "SUPER_ADMIN"],
  },
  {
    action: "SUBMIT_RESOLUTION",
    fromStates: ["ASSIGNED"],
    toStatus: "RESOLUTION_SUBMITTED",
    allowedRoles: ["ORGANIZATION_ADMIN", "SUPER_ADMIN"],
    requiresEvidence: true,
  },
  {
    action: "CONFIRM_RESOLUTION",
    fromStates: ["RESOLUTION_SUBMITTED"],
    toStatus: "CLOSED",
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"],
  },
  {
    action: "REOPEN",
    fromStates: ["RESOLUTION_SUBMITTED"],
    toStatus: "REOPENED",
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"],
    requiresReason: true,
    incrementsReopenCount: true,
  },
  {
    action: "CLOSE_REJECTED",
    fromStates: ["REJECTED"],
    toStatus: "CLOSED",
    allowedRoles: ["MODERATOR", "SUPER_ADMIN"],
  },
];

const ACTION_LABELS: Record<WorkflowAction, string> = {
  REVIEW: "Review Report",
  VERIFY: "Verify Barrier",
  REJECT: "Reject Report",
  ASSIGN: "Assign Maintenance Task",
  SUBMIT_RESOLUTION: "Submit Resolution Evidence",
  CONFIRM_RESOLUTION: "Confirm & Close Barrier",
  REOPEN: "Reopen Barrier",
  CLOSE_REJECTED: "Acknowledge Rejection",
};

export function transitionReportState(context: WorkflowTransitionContext): TransitionResult {
  const { actorId, actorRole, isMemberOfOwningOrg, currentState, action, facts } = context;

  const rule = TRANSITION_RULES.find((r) => r.action === action);
  if (!rule || !rule.fromStates.includes(currentState)) {
    return {
      success: false,
      error: "INVALID_TRANSITION",
      message: `Action ${action} is not valid from state ${currentState}`,
    };
  }

  const roleAllowed = rule.allowedRoles.includes(actorRole) || actorRole === "SUPER_ADMIN";
  if (!roleAllowed) {
    return {
      success: false,
      error: "FORBIDDEN_ROLE",
      message: `Role ${actorRole} is not permitted to perform action ${action}`,
    };
  }

  if (
    (action === "ASSIGN" || action === "SUBMIT_RESOLUTION") &&
    actorRole === "ORGANIZATION_ADMIN" &&
    !isMemberOfOwningOrg
  ) {
    return {
      success: false,
      error: "FORBIDDEN_ROLE",
      message: "Actor is not a member of the owning organization",
    };
  }

  if (action === "ASSIGN" && facts.assigneeIsMember === false) {
    return {
      success: false,
      error: "FORBIDDEN_ROLE",
      message: "Assignee is not a member of the owning organization",
    };
  }

  if (action === "VERIFY" || action === "ASSIGN" || action === "SUBMIT_RESOLUTION") {
    if (actorId === facts.reporterId) {
      return {
        success: false,
        error: "SELF_ACTION_FORBIDDEN",
        message: "Reporters cannot verify, assign, or resolve their own reports",
      };
    }
  }

  if (action === "CONFIRM_RESOLUTION") {
    if (actorId === facts.reporterId) {
      return {
        success: false,
        error: "SELF_ACTION_FORBIDDEN",
        message: "Reporters cannot close their own reports",
      };
    }
    if (facts.resolutionSubmittedByUserId && actorId === facts.resolutionSubmittedByUserId) {
      return {
        success: false,
        error: "SEPARATION_OF_DUTIES",
        message: "The user who submitted resolution cannot confirm and close the report",
      };
    }
  }

  if (rule.requiresReason) {
    const reasonText = facts.reason?.trim();
    if (!reasonText || reasonText.length === 0) {
      return {
        success: false,
        error: "REASON_REQUIRED",
        message: `A valid non-empty reason is required to ${action.toLowerCase()} this report`,
      };
    }
  }

  if (rule.requiresEvidence) {
    const evidenceCount = facts.receivedEvidenceCount ?? 0;
    if (evidenceCount < 1) {
      return {
        success: false,
        error: "EVIDENCE_REQUIRED",
        message: "At least one received evidence photo is required to submit resolution",
      };
    }
  }

  return {
    success: true,
    fromStatus: currentState,
    toStatus: rule.toStatus,
    action,
    shouldIncrementReopenCount: Boolean(rule.incrementsReopenCount),
  };
}

export function getAllowedActions(
  report: WorkflowReportData,
  actorId: string,
  actorRole: UserRole,
  isMemberOfOwningOrg: boolean,
): AllowedActionItem[] {
  const allowed: AllowedActionItem[] = [];

  for (const rule of TRANSITION_RULES) {
    if (!rule.fromStates.includes(report.status)) {
      continue;
    }

    const testContext: WorkflowTransitionContext = {
      actorId,
      actorRole,
      isMemberOfOwningOrg,
      currentState: report.status,
      action: rule.action,
      facts: {
        reporterId: report.reporterId,
        resolutionSubmittedByUserId: report.resolutionSubmittedByUserId,
        assigneeIsMember: true,
        receivedEvidenceCount: report.receivedEvidenceCount ?? 1,
        reason: "placeholder-reason-for-evaluation",
      },
    };

    const res = transitionReportState(testContext);
    if (res.success) {
      allowed.push({
        action: rule.action,
        label: ACTION_LABELS[rule.action],
        targetStatus: rule.toStatus,
        requiresReason: rule.requiresReason,
      });
    }
  }

  return allowed;
}
