import { ProfileRules } from "./profiles";
import { Confidence, GraphEdge } from "./types";

export interface PenaltyWeights {
  unverifiedEdgeMultiplier: number;
  stairsPenaltyMeters: number;
  liftUnknownPenaltyMeters: number;
  slopePenaltyPerPercentMeters: number;
}

export const PENALTY_WEIGHTS: PenaltyWeights = Object.freeze({
  unverifiedEdgeMultiplier: 1.5,
  stairsPenaltyMeters: 500,
  liftUnknownPenaltyMeters: 200,
  slopePenaltyPerPercentMeters: 10,
});

export function resolveEdgeConfidence(edge: GraphEdge): Confidence {
  if (edge.connectionType === "ELEVATOR" && edge.operationalStatus === "OUT_OF_SERVICE") {
    return "UNAVAILABLE";
  }
  if (edge.connectionType === "ELEVATOR" && edge.operationalStatus === "UNKNOWN") {
    return "UNVERIFIED";
  }
  return edge.confidence ?? "CONFIRMED";
}

export function edgeCost(
  edge: GraphEdge,
  rules: ProfileRules,
  weights: PenaltyWeights = PENALTY_WEIGHTS,
): number {
  let cost = Math.max(0, edge.distanceMeters);

  if (edge.connectionType === "STAIRS" && rules.allowStairs) {
    cost += weights.stairsPenaltyMeters;
  }

  if (edge.connectionType === "ELEVATOR" && edge.operationalStatus === "UNKNOWN") {
    cost += weights.liftUnknownPenaltyMeters;
  }

  if (edge.slopePercent !== undefined && edge.slopePercent > 0) {
    cost += edge.slopePercent * weights.slopePenaltyPerPercentMeters;
  }

  const confidence = resolveEdgeConfidence(edge);
  if (confidence === "UNVERIFIED") {
    cost *= weights.unverifiedEdgeMultiplier;
  }

  if (!Number.isFinite(cost) || cost < 0) {
    return 0;
  }

  return cost;
}
