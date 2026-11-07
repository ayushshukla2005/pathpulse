import { resolveEdgeConfidence } from "./penalties";
import { ProfileRules } from "./profiles";
import { GraphEdge, GraphNode, RouteResult, RouteSegment } from "./types";

function createInstruction(edge: GraphEdge, fromNode?: GraphNode, toNode?: GraphNode): string {
  const fromFloor = fromNode?.floorNumber ?? 0;
  const toFloor = toNode?.floorNumber ?? 0;
  const distance = Math.round(edge.distanceMeters);

  switch (edge.connectionType) {
    case "ELEVATOR":
      return `Take the lift from floor ${fromFloor} to floor ${toFloor}`;
    case "STAIRS":
      return `Use the stairs from floor ${fromFloor} to floor ${toFloor}`;
    case "RAMP":
      return `Follow the ramp for ${distance} metres`;
    case "DOOR":
      return `Pass through the door`;
    case "CORRIDOR":
    default:
      return `Walk along the corridor for ${distance} metres`;
  }
}

export function buildRoute(
  edges: GraphEdge[],
  startNodeId: string,
  nodes: Map<string, GraphNode>,
  rules: ProfileRules,
): RouteResult {
  if (edges.length === 0) {
    return {
      status: "FOUND",
      steps: [],
      totalDistanceMeters: 0,
      accessibility: "STEP_FREE",
      warnings: [],
    };
  }

  let currentNodeId = startNodeId;
  const steps: RouteSegment[] = [];
  let totalDistance = 0;
  let hasUnverified = false;
  let hasStairs = false;
  let hasLiftUnknown = false;
  let allStepFree = true;
  let unverifiedBlockingEdgeId: string | null = null;

  for (const edge of edges) {
    const fromNodeId = currentNodeId;
    const toNodeId = edge.fromNodeId === currentNodeId ? edge.toNodeId : edge.fromNodeId;
    currentNodeId = toNodeId;

    const fromNode = nodes.get(fromNodeId);
    const toNode = nodes.get(toNodeId);
    const confidence = resolveEdgeConfidence(edge);

    if (confidence === "UNVERIFIED") {
      hasUnverified = true;
      if (!unverifiedBlockingEdgeId) {
        unverifiedBlockingEdgeId = edge.id;
      }
    }

    if (edge.connectionType === "STAIRS") {
      hasStairs = true;
    }

    if (edge.connectionType === "ELEVATOR" && edge.operationalStatus === "UNKNOWN") {
      hasLiftUnknown = true;
    }

    if (!edge.stepFree) {
      allStepFree = false;
    }

    totalDistance += edge.distanceMeters;

    steps.push({
      fromNodeId,
      toNodeId,
      edgeId: edge.id,
      connectionType: edge.connectionType,
      distanceMeters: edge.distanceMeters,
      confidence,
      instruction: createInstruction(edge, fromNode, toNode),
    });
  }

  if (!rules.allowUnverifiedSegments && hasUnverified && unverifiedBlockingEdgeId) {
    return {
      status: "NO_CONFIRMED_ROUTE",
      reason: `Route requires confirmed accessibility but contains unverified segment: ${unverifiedBlockingEdgeId}`,
    };
  }

  const warnings: string[] = [];
  if (hasUnverified) {
    warnings.push("Route contains unverified segments that may not be accessible.");
  }
  if (hasStairs) {
    warnings.push("Route contains stairs.");
  }
  if (hasLiftUnknown) {
    warnings.push("Route includes an elevator with unknown operational status.");
  }

  let accessibility: "STEP_FREE" | "MIXED" | "UNVERIFIED" = "MIXED";
  if (hasUnverified) {
    accessibility = "UNVERIFIED";
  } else if (allStepFree) {
    accessibility = "STEP_FREE";
  }

  return {
    status: "FOUND",
    steps,
    totalDistanceMeters: Math.round(totalDistance * 10) / 10,
    accessibility,
    warnings,
  };
}
