import { transitionReportState } from "../state-machine";
import { WorkflowTransitionContext } from "../types";

describe("Report Workflow State Machine", () => {
  const baseContext: WorkflowTransitionContext = {
    actorId: "mod-1",
    actorRole: "MODERATOR",
    isMemberOfOwningOrg: false,
    currentState: "SUBMITTED",
    action: "REVIEW",
    facts: {
      reporterId: "user-reporter-1",
      reason: null,
      receivedEvidenceCount: 0,
      assigneeIsMember: true,
      resolutionSubmittedByUserId: null,
    },
  };

  test("allows MODERATOR to transition SUBMITTED to UNDER_REVIEW", () => {
    const res = transitionReportState({
      ...baseContext,
      action: "REVIEW",
      currentState: "SUBMITTED",
    });
    expect(res).toEqual({
      success: true,
      fromStatus: "SUBMITTED",
      toStatus: "UNDER_REVIEW",
      action: "REVIEW",
      shouldIncrementReopenCount: false,
    });
  });

  test("rejects regular USER trying to review report", () => {
    const res = transitionReportState({
      ...baseContext,
      actorRole: "USER",
      action: "REVIEW",
      currentState: "SUBMITTED",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("FORBIDDEN_ROLE");
    }
  });

  test("allows MODERATOR to verify report when not reporter", () => {
    const res = transitionReportState({
      ...baseContext,
      currentState: "UNDER_REVIEW",
      action: "VERIFY",
      actorId: "mod-independent",
      facts: { ...baseContext.facts, reporterId: "user-reporter-1" },
    });
    expect(res).toEqual({
      success: true,
      fromStatus: "UNDER_REVIEW",
      toStatus: "VERIFIED",
      action: "VERIFY",
      shouldIncrementReopenCount: false,
    });
  });

  test("forbids reporter from verifying their own report", () => {
    const res = transitionReportState({
      ...baseContext,
      currentState: "UNDER_REVIEW",
      action: "VERIFY",
      actorId: "user-reporter-1",
      facts: { ...baseContext.facts, reporterId: "user-reporter-1" },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("SELF_ACTION_FORBIDDEN");
    }
  });

  test("requires reason when rejecting report", () => {
    const resWithoutReason = transitionReportState({
      ...baseContext,
      currentState: "UNDER_REVIEW",
      action: "REJECT",
      facts: { ...baseContext.facts, reason: "   " },
    });
    expect(resWithoutReason.success).toBe(false);
    if (!resWithoutReason.success) {
      expect(resWithoutReason.error).toBe("REASON_REQUIRED");
    }

    const resWithReason = transitionReportState({
      ...baseContext,
      currentState: "UNDER_REVIEW",
      action: "REJECT",
      facts: { ...baseContext.facts, reason: "Duplicate or invalid coordinate" },
    });
    expect(resWithReason).toEqual({
      success: true,
      fromStatus: "UNDER_REVIEW",
      toStatus: "REJECTED",
      action: "REJECT",
      shouldIncrementReopenCount: false,
    });
  });

  test("allows ORGANIZATION_ADMIN of owning org to assign report", () => {
    const res = transitionReportState({
      ...baseContext,
      actorId: "admin-org-1",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: true,
      currentState: "VERIFIED",
      action: "ASSIGN",
      facts: { ...baseContext.facts, assigneeIsMember: true },
    });
    expect(res).toEqual({
      success: true,
      fromStatus: "VERIFIED",
      toStatus: "ASSIGNED",
      action: "ASSIGN",
      shouldIncrementReopenCount: false,
    });
  });

  test("rejects assign if organization admin does not belong to owning org", () => {
    const res = transitionReportState({
      ...baseContext,
      actorId: "admin-other-org",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: false,
      currentState: "VERIFIED",
      action: "ASSIGN",
      facts: { ...baseContext.facts, assigneeIsMember: true },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("FORBIDDEN_ROLE");
    }
  });

  test("rejects assign if assignee is not a member of the owning org", () => {
    const res = transitionReportState({
      ...baseContext,
      actorId: "admin-org-1",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: true,
      currentState: "VERIFIED",
      action: "ASSIGN",
      facts: { ...baseContext.facts, assigneeIsMember: false },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("FORBIDDEN_ROLE");
    }
  });

  test("forbids reporter from assigning their own report", () => {
    const res = transitionReportState({
      ...baseContext,
      actorId: "user-reporter-1",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: true,
      currentState: "VERIFIED",
      action: "ASSIGN",
      facts: { ...baseContext.facts, reporterId: "user-reporter-1", assigneeIsMember: true },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("SELF_ACTION_FORBIDDEN");
    }
  });

  test("requires evidence when submitting resolution", () => {
    const noEvidence = transitionReportState({
      ...baseContext,
      actorId: "admin-org-1",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: true,
      currentState: "ASSIGNED",
      action: "SUBMIT_RESOLUTION",
      facts: { ...baseContext.facts, receivedEvidenceCount: 0 },
    });
    expect(noEvidence.success).toBe(false);
    if (!noEvidence.success) {
      expect(noEvidence.error).toBe("EVIDENCE_REQUIRED");
    }

    const withEvidence = transitionReportState({
      ...baseContext,
      actorId: "admin-org-1",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: true,
      currentState: "ASSIGNED",
      action: "SUBMIT_RESOLUTION",
      facts: { ...baseContext.facts, receivedEvidenceCount: 2 },
    });
    expect(withEvidence).toEqual({
      success: true,
      fromStatus: "ASSIGNED",
      toStatus: "RESOLUTION_SUBMITTED",
      action: "SUBMIT_RESOLUTION",
      shouldIncrementReopenCount: false,
    });
  });

  test("enforces separation of duties when confirming resolution", () => {
    const sameResolver = transitionReportState({
      ...baseContext,
      actorId: "mod-also-resolver",
      actorRole: "MODERATOR",
      currentState: "RESOLUTION_SUBMITTED",
      action: "CONFIRM_RESOLUTION",
      facts: {
        ...baseContext.facts,
        reporterId: "user-reporter-1",
        resolutionSubmittedByUserId: "mod-also-resolver",
      },
    });
    expect(sameResolver.success).toBe(false);
    if (!sameResolver.success) {
      expect(sameResolver.error).toBe("SEPARATION_OF_DUTIES");
    }

    const reporterClosing = transitionReportState({
      ...baseContext,
      actorId: "user-reporter-1",
      actorRole: "MODERATOR",
      currentState: "RESOLUTION_SUBMITTED",
      action: "CONFIRM_RESOLUTION",
      facts: {
        ...baseContext.facts,
        reporterId: "user-reporter-1",
        resolutionSubmittedByUserId: "admin-solver-1",
      },
    });
    expect(reporterClosing.success).toBe(false);
    if (!reporterClosing.success) {
      expect(reporterClosing.error).toBe("SELF_ACTION_FORBIDDEN");
    }

    const validModerator = transitionReportState({
      ...baseContext,
      actorId: "independent-mod",
      actorRole: "MODERATOR",
      currentState: "RESOLUTION_SUBMITTED",
      action: "CONFIRM_RESOLUTION",
      facts: {
        ...baseContext.facts,
        reporterId: "user-reporter-1",
        resolutionSubmittedByUserId: "admin-solver-1",
      },
    });
    expect(validModerator).toEqual({
      success: true,
      fromStatus: "RESOLUTION_SUBMITTED",
      toStatus: "CLOSED",
      action: "CONFIRM_RESOLUTION",
      shouldIncrementReopenCount: false,
    });
  });

  test("allows reopening resolution with reason and increments count", () => {
    const resNoReason = transitionReportState({
      ...baseContext,
      currentState: "RESOLUTION_SUBMITTED",
      action: "REOPEN",
      facts: { ...baseContext.facts, reason: "" },
    });
    expect(resNoReason.success).toBe(false);
    if (!resNoReason.success) {
      expect(resNoReason.error).toBe("REASON_REQUIRED");
    }

    const resValid = transitionReportState({
      ...baseContext,
      currentState: "RESOLUTION_SUBMITTED",
      action: "REOPEN",
      facts: { ...baseContext.facts, reason: "Evidence photo still shows obstruction" },
    });
    expect(resValid).toEqual({
      success: true,
      fromStatus: "RESOLUTION_SUBMITTED",
      toStatus: "REOPENED",
      action: "REOPEN",
      shouldIncrementReopenCount: true,
    });
  });

  test("allows assigning from REOPENED state", () => {
    const res = transitionReportState({
      ...baseContext,
      actorId: "admin-org-1",
      actorRole: "ORGANIZATION_ADMIN",
      isMemberOfOwningOrg: true,
      currentState: "REOPENED",
      action: "ASSIGN",
      facts: { ...baseContext.facts, assigneeIsMember: true },
    });
    expect(res).toEqual({
      success: true,
      fromStatus: "REOPENED",
      toStatus: "ASSIGNED",
      action: "ASSIGN",
      shouldIncrementReopenCount: false,
    });
  });

  test("returns INVALID_TRANSITION when state does not allow action", () => {
    const res = transitionReportState({
      ...baseContext,
      currentState: "SUBMITTED",
      action: "CONFIRM_RESOLUTION",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("INVALID_TRANSITION");
    }
  });
});
