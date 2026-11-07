import { MinHeap } from "./min-heap";
import { edgeCost, PenaltyWeights, PENALTY_WEIGHTS } from "./penalties";
import { ProfileRules } from "./profiles";
import { GraphEdge } from "./types";

export interface DijkstraResult {
  found: boolean;
  edges: GraphEdge[];
}

interface Predecessor {
  edge: GraphEdge;
  fromNodeId: string;
}

export function findShortestPath(
  filteredAdjacency: Map<string, GraphEdge[]>,
  startNodeId: string,
  destinationNodeId: string,
  rules: ProfileRules,
  weights: PenaltyWeights = PENALTY_WEIGHTS,
): DijkstraResult {
  if (startNodeId === destinationNodeId) {
    return {
      found: true,
      edges: [],
    };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, Predecessor>();
  const heap = new MinHeap<string>();

  dist.set(startNodeId, 0);
  heap.push(startNodeId, 0);

  while (!heap.isEmpty()) {
    const current = heap.pop()!;

    if (current === destinationNodeId) {
      break;
    }

    const currentDist = dist.get(current);
    if (currentDist === undefined) {
      continue;
    }

    const outgoing = (filteredAdjacency.get(current) ?? []).slice();
    outgoing.sort((a, b) => a.id.localeCompare(b.id));

    for (const edge of outgoing) {
      const neighbor = edge.fromNodeId === current ? edge.toNodeId : edge.fromNodeId;

      const cost = edgeCost(edge, rules, weights);
      const newDist = currentDist + cost;
      const existingDist = dist.get(neighbor) ?? Infinity;

      if (newDist < existingDist) {
        dist.set(neighbor, newDist);
        prev.set(neighbor, { edge, fromNodeId: current });
        heap.push(neighbor, newDist);
      }
    }
  }

  if (!prev.has(destinationNodeId)) {
    return {
      found: false,
      edges: [],
    };
  }

  const path: GraphEdge[] = [];
  let curr = destinationNodeId;

  while (curr !== startNodeId) {
    const predecessor = prev.get(curr);
    if (!predecessor) {
      return {
        found: false,
        edges: [],
      };
    }
    path.unshift(predecessor.edge);
    curr = predecessor.fromNodeId;
  }

  return {
    found: true,
    edges: path,
  };
}
