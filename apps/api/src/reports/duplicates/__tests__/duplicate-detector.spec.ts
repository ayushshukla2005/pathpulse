import {
  CandidateReport,
  computeJaccardSimilarity,
  findDuplicateCandidates,
  tokenizeText,
} from "../duplicate-detector";

describe("Duplicate Detector", () => {
  test("tokenizes and removes stop words and punctuation", () => {
    const tokens = tokenizeText("The elevator in building A is broken, and it stopped!");
    expect(tokens.has("elevator")).toBe(true);
    expect(tokens.has("building")).toBe(true);
    expect(tokens.has("broken")).toBe(true);
    expect(tokens.has("stopped")).toBe(true);
    expect(tokens.has("the")).toBe(false);
    expect(tokens.has("and")).toBe(false);
  });

  test("computes identical similarity as 1.0", () => {
    const text = "Main elevator broken at south wing";
    const sim = computeJaccardSimilarity(text, text);
    expect(sim).toBe(1.0);
  });

  test("computes zero similarity for disjoint text", () => {
    const textA = "Ramp blocked by debris";
    const textB = "Automatic door sensor failure";
    const sim = computeJaccardSimilarity(textA, textB);
    expect(sim).toBe(0);
  });

  test("finds candidate with similarity above threshold within time window and same category", () => {
    const now = new Date("2026-11-08T12:00:00Z");
    const target: CandidateReport = {
      id: "rep-target",
      trackingCode: "REP-TARGET",
      venueId: "venue-1",
      facilityId: "fac-elev-1",
      category: "BROKEN_LIFT",
      title: "Main elevator out of service",
      description: "South tower lift button stuck and not moving",
      status: "UNDER_REVIEW",
      createdAt: now,
    };

    const candidateMatch: CandidateReport = {
      id: "rep-cand-1",
      trackingCode: "REP-CAND-1",
      venueId: "venue-1",
      facilityId: "fac-elev-1",
      category: "BROKEN_LIFT",
      title: "Elevator not moving south tower",
      description: "Lift button stuck south tower elevator out of service",
      status: "SUBMITTED",
      createdAt: new Date("2026-11-07T12:00:00Z"),
    };

    const candidateDifferentCategory: CandidateReport = {
      id: "rep-cand-2",
      trackingCode: "REP-CAND-2",
      venueId: "venue-1",
      facilityId: "fac-elev-1",
      category: "BLOCKED_RAMP",
      title: "South tower lift button stuck",
      description: "Elevator out of service",
      status: "SUBMITTED",
      createdAt: new Date("2026-11-07T12:00:00Z"),
    };

    const candidateClosed: CandidateReport = {
      id: "rep-cand-3",
      trackingCode: "REP-CAND-3",
      venueId: "venue-1",
      facilityId: "fac-elev-1",
      category: "BROKEN_LIFT",
      title: "Main elevator out of service",
      description: "South tower lift button stuck",
      status: "CLOSED",
      createdAt: new Date("2026-11-07T12:00:00Z"),
    };

    const results = findDuplicateCandidates(
      target,
      [candidateMatch, candidateDifferentCategory, candidateClosed],
      { threshold: 0.5, windowDays: 30 },
    );

    expect(results).toHaveLength(1);
    const firstResult = results[0];
    expect(firstResult).toBeDefined();
    expect(firstResult?.candidateId).toBe("rep-cand-1");
    expect(firstResult?.similarity).toBeGreaterThanOrEqual(0.5);
  });
});
