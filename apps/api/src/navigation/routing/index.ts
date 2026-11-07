import { findShortestPath } from "./dijkstra";
import { filterGraph } from "./filter";
import { PenaltyWeights, PENALTY_WEIGHTS } from "./penalties";
import { getProfileRules, MobilityProfile } from "./profiles";
import { buildRoute } from "./route-builder";
import { GraphEdge, GraphNode, NavigationGraph, RouteResult } from "./types";

export * from "./dijkstra";
export * from "./filter";
export * from "./min-heap";
export * from "./penalties";
export * from "./profiles";
export * from "./route-builder";
export * from "./types";

export function buildNavigationGraph(nodes: GraphNode[], edges: GraphEdge[]): NavigationGraph {
  const nodesMap = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  for (const node of nodes) {
    nodesMap.set(node.id, node);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const fromList = adjacency.get(edge.fromNodeId);
    if (fromList) {
      fromList.push(edge);
    }
    if (edge.isBidirectional) {
      const toList = adjacency.get(edge.toNodeId);
      if (toList) {
        toList.push(edge);
      }
    }
  }

  return {
    nodes: nodesMap,
    adjacency,
  };
}

export function findAccessibleRoute(
  graph: NavigationGraph,
  originId: string,
  destinationId: string,
  profile: MobilityProfile,
  weights: PenaltyWeights = PENALTY_WEIGHTS,
): RouteResult {
  if (!graph.nodes.has(originId)) {
    return {
      status: "INVALID_INPUT",
      reason: `Origin node not found: ${originId}`,
    };
  }

  if (!graph.nodes.has(destinationId)) {
    return {
      status: "INVALID_INPUT",
      reason: `Destination node not found: ${destinationId}`,
    };
  }

  if (originId === destinationId) {
    return {
      status: "FOUND",
      steps: [],
      totalDistanceMeters: 0,
      accessibility: "STEP_FREE",
      warnings: [],
    };
  }

  const rules = getProfileRules(profile);
  const { filteredAdjacency } = filterGraph(graph, rules);
  const searchResult = findShortestPath(filteredAdjacency, originId, destinationId, rules, weights);

  if (!searchResult.found) {
    return {
      status: "UNREACHABLE",
      reason: `No path exists between node ${originId} and node ${destinationId}`,
    };
  }

  return buildRoute(searchResult.edges, originId, graph.nodes, rules);
}
