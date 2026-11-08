import { getAllowedActions } from "../state-machine";
import { WorkflowReportData } from "../types";

describe("getAllowedActions", () => {
  const baseReport: WorkflowReportData = {
    id: "rep-101",
    trackingCode: "REP-20261108-ABCD",
    status: "SUBMITTED",
    category: "BROKEN_LIFT",
    reporterId: "user-rep-1",
    reopenCount: 0,
    receivedEvidenceCount: 1,
  };

  test("returns REVIEW for MODERATOR when report is SUBMITTED", () => {
    const actions = getAllowedActions(baseReport, "mod-1", "MODERATOR", false);
    expect(actions).toEqual([
      {
        action: "REVIEW",
        label: "Review Report",
        targetStatus: "UNDER_REVIEW",
        requiresReason: undefined,
      },
    ]);
  });

  test("returns VERIFY and REJECT for independent MODERATOR on UNDER_REVIEW", () => {
    const underReview: WorkflowReportData = { ...baseReport, status: "UNDER_REVIEW" };
    const actions = getAllowedActions(underReview, "mod-independent", "MODERATOR", false);
    expect(actions).toEqual([
      {
        action: "VERIFY",
        label: "Verify Barrier",
        targetStatus: "VERIFIED",
        requiresReason: undefined,
      },
      {
        action: "REJECT",
        label: "Reject Report",
        targetStatus: "REJECTED",
        requiresReason: true,
      },
    ]);
  });

  test("excludes VERIFY for MODERATOR if they are the reporter", () => {
    const underReview: WorkflowReportData = { ...baseReport, status: "UNDER_REVIEW" };
    const actions = getAllowedActions(underReview, baseReport.reporterId, "MODERATOR", false);
    expect(actions).toEqual([
      {
        action: "REJECT",
        label: "Reject Report",
        targetStatus: "REJECTED",
        requiresReason: true,
      },
    ]);
  });

  test("returns ASSIGN for ORGANIZATION_ADMIN of owning org on VERIFIED report", () => {
    const verified: WorkflowReportData = { ...baseReport, status: "VERIFIED" };
    const actions = getAllowedActions(verified, "admin-org", "ORGANIZATION_ADMIN", true);
    expect(actions).toEqual([
      {
        action: "ASSIGN",
        label: "Assign Maintenance Task",
        targetStatus: "ASSIGNED",
        requiresReason: undefined,
      },
    ]);
  });

  test("returns empty actions for regular USER", () => {
    const actions = getAllowedActions(baseReport, "regular-user", "USER", false);
    expect(actions).toEqual([]);
  });
});
