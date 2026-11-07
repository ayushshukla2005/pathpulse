import { ProfileRules } from "./profiles";
import { GraphEdge, NavigationGraph } from "./types";

export interface ExclusionDiagnostics {
  excludedByStairs: number;
  excludedByOutOfService: number;
  excludedByStepFree: number;
  totalExcluded: number;
}

export interface FilterResult {
  filteredAdjacency: Map<string, GraphEdge[]>;
  diagnostics: ExclusionDiagnostics;
}

export function filterGraph(graph: NavigationGraph, rules: ProfileRules): FilterResult {
  const diagnostics: ExclusionDiagnostics = {
    excludedByStairs: 0,
    excludedByOutOfService: 0,
    excludedByStepFree: 0,
    totalExcluded: 0,
  };

  const filteredAdjacency = new Map<string, GraphEdge[]>();
  for (const nodeId of graph.nodes.keys()) {
    filteredAdjacency.set(nodeId, []);
  }

  const seenEdgeIds = new Set<string>();

  for (const edges of graph.adjacency.values()) {
    for (const edge of edges) {
      if (seenEdgeIds.has(edge.id)) {
        continue;
      }
      seenEdgeIds.add(edge.id);

      if (edge.connectionType === "ELEVATOR" && edge.operationalStatus === "OUT_OF_SERVICE") {
        diagnostics.excludedByOutOfService++;
        diagnostics.totalExcluded++;
        continue;
      }

      if (!rules.allowStairs && edge.connectionType === "STAIRS") {
        diagnostics.excludedByStairs++;
        diagnostics.totalExcluded++;
        continue;
      }

      if (rules.requireStepFree && !edge.stepFree) {
        diagnostics.excludedByStepFree++;
        diagnostics.totalExcluded++;
        continue;
      }

      const fromList = filteredAdjacency.get(edge.fromNodeId);
      if (fromList) {
        fromList.push(edge);
      }

      if (edge.isBidirectional) {
        const toList = filteredAdjacency.get(edge.toNodeId);
        if (toList) {
          toList.push(edge);
        }
      }
    }
  }

  return {
    filteredAdjacency,
    diagnostics,
  };
}
