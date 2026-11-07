import { filterGraph } from "../filter";
import { buildNavigationGraph } from "../index";
import { PROFILE_RULES } from "../profiles";
import { GraphEdge, GraphNode } from "../types";

describe("filterGraph and diagnostics", () => {
  const sampleNodes: GraphNode[] = [
    {
      id: "node-1",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ENTRANCE",
      latitude: 12.9,
      longitude: 77.5,
      label: "Node 1",
    },
    {
      id: "node-2",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.9,
      longitude: 77.5,
      label: "Node 2",
    },
    {
      id: "node-3",
      buildingId: "bld-1",
      floorId: "fl-1",
      floorNumber: 1,
      kind: "LOBBY",
      latitude: 12.9,
      longitude: 77.5,
      label: "Node 3",
    },
  ];

  const sampleEdges: GraphEdge[] = [
    {
      id: "edge-valid-corridor",
      fromNodeId: "node-1",
      toNodeId: "node-2",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
    {
      id: "edge-stairs",
      fromNodeId: "node-2",
      toNodeId: "node-3",
      distanceMeters: 6,
      connectionType: "STAIRS",
      stepFree: false,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
    {
      id: "edge-broken-lift",
      fromNodeId: "node-1",
      toNodeId: "node-3",
      distanceMeters: 4,
      connectionType: "ELEVATOR",
      stepFree: true,
      operationalStatus: "OUT_OF_SERVICE",
      isBidirectional: false,
    },
    {
      id: "edge-steep-curb",
      fromNodeId: "node-1",
      toNodeId: "node-2",
      distanceMeters: 2,
      connectionType: "DOOR",
      stepFree: false,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
  ];

  it("should accurately count and remove excluded edges for WHEELCHAIR profile", () => {
    const graph = buildNavigationGraph(sampleNodes, sampleEdges);
    const rules = PROFILE_RULES.WHEELCHAIR;

    const result = filterGraph(graph, rules);

    expect(result.diagnostics.excludedByOutOfService).toBe(1);
    expect(result.diagnostics.excludedByStairs).toBe(1);
    expect(result.diagnostics.excludedByStepFree).toBe(1);
    expect(result.diagnostics.totalExcluded).toBe(3);

    const eligibleEdgesNode1 = result.filteredAdjacency.get("node-1") ?? [];
    expect(eligibleEdgesNode1.length).toBe(1);
    expect(eligibleEdgesNode1[0]?.id).toBe("edge-valid-corridor");
  });

  it("should permit stairs for VISUALLY_IMPAIRED profile while still excluding out-of-service lift", () => {
    const graph = buildNavigationGraph(sampleNodes, sampleEdges);
    const rules = PROFILE_RULES.VISUALLY_IMPAIRED;

    const result = filterGraph(graph, rules);

    expect(result.diagnostics.excludedByOutOfService).toBe(1);
    expect(result.diagnostics.excludedByStairs).toBe(0);
    expect(result.diagnostics.excludedByStepFree).toBe(0);
    expect(result.diagnostics.totalExcluded).toBe(1);

    const eligibleEdgesNode2 = result.filteredAdjacency.get("node-2") ?? [];
    const edgeIds = eligibleEdgesNode2.map((e) => e.id);
    expect(edgeIds).toContain("edge-stairs");
  });
});
