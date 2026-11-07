import { edgeCost, PENALTY_WEIGHTS } from "../penalties";
import { PROFILE_RULES } from "../profiles";
import { GraphEdge } from "../types";

describe("Penalty weights and edgeCost calculation", () => {
  const baseCorridor: GraphEdge = {
    id: "edge-corridor",
    fromNodeId: "a",
    toNodeId: "b",
    distanceMeters: 20,
    connectionType: "CORRIDOR",
    stepFree: true,
    operationalStatus: "OPERATIONAL",
    isBidirectional: true,
  };

  it("should never return negative numbers or NaN", () => {
    const rules = PROFILE_RULES.CUSTOM;

    const zeroDistance: GraphEdge = { ...baseCorridor, distanceMeters: 0 };
    expect(edgeCost(zeroDistance, rules)).toBe(0);

    const negativeDistance: GraphEdge = { ...baseCorridor, distanceMeters: -50 };
    expect(edgeCost(negativeDistance, rules)).toBe(0);

    const normal = edgeCost(baseCorridor, rules);
    expect(Number.isFinite(normal)).toBe(true);
    expect(normal).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(normal)).toBe(false);
  });

  it("should apply stairs penalty when stairs are allowed by the profile", () => {
    const stairsEdge: GraphEdge = {
      id: "edge-stairs",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 10,
      connectionType: "STAIRS",
      stepFree: false,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    };

    const rulesAllowStairs = PROFILE_RULES.VISUALLY_IMPAIRED;
    const cost = edgeCost(stairsEdge, rulesAllowStairs);

    expect(cost).toBe(10 + PENALTY_WEIGHTS.stairsPenaltyMeters);
  });

  it("should apply lift unknown penalty when elevator operational status is UNKNOWN", () => {
    const unknownLift: GraphEdge = {
      id: "edge-unknown-lift",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 5,
      connectionType: "ELEVATOR",
      stepFree: true,
      operationalStatus: "UNKNOWN",
      isBidirectional: true,
    };

    const rules = PROFILE_RULES.VISUALLY_IMPAIRED;
    const cost = edgeCost(unknownLift, rules);

    const expectedBaseWithLiftPenalty = 5 + PENALTY_WEIGHTS.liftUnknownPenaltyMeters;
    const expected = expectedBaseWithLiftPenalty * PENALTY_WEIGHTS.unverifiedEdgeMultiplier;
    expect(cost).toBe(expected);
  });

  it("should penalize steep slopes proportionally", () => {
    const slopeEdge: GraphEdge = {
      id: "edge-ramp-steep",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMeters: 30,
      connectionType: "RAMP",
      stepFree: true,
      slopePercent: 8,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    };

    const rules = PROFILE_RULES.WHEELCHAIR;
    const cost = edgeCost(slopeEdge, rules);

    expect(cost).toBe(30 + 8 * PENALTY_WEIGHTS.slopePenaltyPerPercentMeters);
  });
});
