import { describe, expect, it } from "vitest";
import { AllowedActionItem, DuplicateSuggestion } from "@pathpulse/shared-types";

describe("Moderation Workflow Logic", () => {
  it("filters actionable workflow items correctly", () => {
    const actions: AllowedActionItem[] = [
      { action: "REVIEW", label: "Review Report", targetStatus: "UNDER_REVIEW" },
      { action: "VERIFY", label: "Verify Barrier", targetStatus: "VERIFIED" },
      { action: "REJECT", label: "Reject Report", targetStatus: "REJECTED", requiresReason: true },
    ];

    expect(actions).toHaveLength(3);
    const requiresReason = actions.filter((a) => a.requiresReason);
    expect(requiresReason).toHaveLength(1);
    expect(requiresReason[0]?.action).toBe("REJECT");
  });

  it("formats duplicate candidate match percentage", () => {
    const duplicate: DuplicateSuggestion = {
      candidateId: "rep-cand-1",
      trackingCode: "REP-20261108-XYZ1",
      title: "Broken elevator",
      similarity: 0.8571,
      status: "SUBMITTED",
      createdAt: "2026-11-08T10:00:00Z",
    };

    const formattedMatch = `${Math.round(duplicate.similarity * 100)}% match`;
    expect(formattedMatch).toBe("86% match");
  });

  it("sorts duplicate candidates by similarity descending", () => {
    const duplicates: DuplicateSuggestion[] = [
      {
        candidateId: "c1",
        trackingCode: "REP-1",
        title: null,
        similarity: 0.55,
        status: "SUBMITTED",
        createdAt: "2026-11-08T10:00:00Z",
      },
      {
        candidateId: "c2",
        trackingCode: "REP-2",
        title: null,
        similarity: 0.92,
        status: "UNDER_REVIEW",
        createdAt: "2026-11-08T10:00:00Z",
      },
    ];

    const sorted = [...duplicates].sort((a, b) => b.similarity - a.similarity);
    expect(sorted[0]?.candidateId).toBe("c2");
    expect(sorted[1]?.candidateId).toBe("c1");
  });
});
