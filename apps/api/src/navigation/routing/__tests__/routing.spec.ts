import { buildNavigationGraph, findAccessibleRoute } from "../index";
import { GraphEdge, GraphNode } from "../types";
import {
  createDisconnectedGraph,
  createElevatorGraph,
  createEqualCostGraph,
  createMultiFloorLiftVsRampGraph,
  createSimpleGraph,
  createStairsVsRampGraph,
} from "./fixtures";

describe("Accessibility-Aware Routing Engine", () => {
  it("should find the shortest path on a simple graph with a known answer", () => {
    const { graph, startId, destId } = createSimpleGraph();
    const result = findAccessibleRoute(graph, startId, destId, "CUSTOM");

    expect(result.status).toBe("FOUND");
    if (result.status === "FOUND") {
      expect(result.totalDistanceMeters).toBe(20);
      expect(result.steps.length).toBe(2);
      expect(result.steps[0]?.edgeId).toBe("edge-a-b");
      expect(result.steps[1]?.edgeId).toBe("edge-b-c");
    }
  });

  it("should exclude stairs and pick the longer step-free path for WHEELCHAIR profile", () => {
    const { graph, startId, destId } = createStairsVsRampGraph();

    const wheelchairResult = findAccessibleRoute(graph, startId, destId, "WHEELCHAIR");
    expect(wheelchairResult.status).toBe("FOUND");
    if (wheelchairResult.status === "FOUND") {
      expect(wheelchairResult.accessibility).toBe("STEP_FREE");
      expect(wheelchairResult.totalDistanceMeters).toBe(30);
      const edgeIds = wheelchairResult.steps.map((s) => s.edgeId);
      expect(edgeIds).not.toContain("edge-stairs-direct");
      expect(edgeIds).toEqual(["edge-ramp-1", "edge-ramp-2"]);
    }
  });

  it("should exclude out-of-service elevator and use the ramp alternative", () => {
    const { graph, startId, destId, elevatorEdgeId } = createElevatorGraph("OUT_OF_SERVICE", true);

    const result = findAccessibleRoute(graph, startId, destId, "WHEELCHAIR");
    expect(result.status).toBe("FOUND");
    if (result.status === "FOUND") {
      const edgeIds = result.steps.map((s) => s.edgeId);
      expect(edgeIds).not.toContain(elevatorEdgeId);
      expect(edgeIds).toContain("edge-ramp-seg-1");
      expect(edgeIds).toContain("edge-ramp-seg-2");
    }
  });

  it("should mark UNKNOWN elevator as UNVERIFIED and reject it for WHEELCHAIR with NO_CONFIRMED_ROUTE naming the edge", () => {
    const { graph, startId, destId, elevatorEdgeId } = createElevatorGraph("UNKNOWN", false);

    const result = findAccessibleRoute(graph, startId, destId, "WHEELCHAIR");
    expect(result.status).toBe("NO_CONFIRMED_ROUTE");
    if (result.status === "NO_CONFIRMED_ROUTE") {
      expect(result.reason).toContain(elevatorEdgeId);
    }
  });

  it("should allow VISUALLY_IMPAIRED to use UNVERIFIED route and receive UNVERIFIED accessibility and a warning", () => {
    const { graph, startId, destId } = createElevatorGraph("UNKNOWN", false);

    const result = findAccessibleRoute(graph, startId, destId, "VISUALLY_IMPAIRED");
    expect(result.status).toBe("FOUND");
    if (result.status === "FOUND") {
      expect(result.accessibility).toBe("UNVERIFIED");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(
          (w) => w.includes("unverified") || w.includes("unknown operational status"),
        ),
      ).toBe(true);
    }
  });

  it("should return UNREACHABLE when destination cannot be reached", () => {
    const { graph, startId, unreachableId } = createDisconnectedGraph();

    const result = findAccessibleRoute(graph, startId, unreachableId, "WHEELCHAIR");
    expect(result.status).toBe("UNREACHABLE");
    if (result.status === "UNREACHABLE") {
      expect(result.reason).toContain("No path exists");
    }
  });

  it("should return FOUND with zero steps when start equals destination", () => {
    const { graph, startId } = createSimpleGraph();

    const result = findAccessibleRoute(graph, startId, startId, "WHEELCHAIR");
    expect(result.status).toBe("FOUND");
    if (result.status === "FOUND") {
      expect(result.steps.length).toBe(0);
      expect(result.totalDistanceMeters).toBe(0);
      expect(result.accessibility).toBe("STEP_FREE");
      expect(result.warnings.length).toBe(0);
    }
  });

  it("should return INVALID_INPUT when origin or destination is unknown", () => {
    const { graph, startId } = createSimpleGraph();

    const invalidOrigin = findAccessibleRoute(graph, "non-existent-origin", startId, "WHEELCHAIR");
    expect(invalidOrigin.status).toBe("INVALID_INPUT");
    if (invalidOrigin.status === "INVALID_INPUT") {
      expect(invalidOrigin.reason).toContain("non-existent-origin");
    }

    const invalidDest = findAccessibleRoute(graph, startId, "non-existent-dest", "WHEELCHAIR");
    expect(invalidDest.status).toBe("INVALID_INPUT");
    if (invalidDest.status === "INVALID_INPUT") {
      expect(invalidDest.reason).toContain("non-existent-dest");
    }
  });

  it("should choose cheaper operational lift over long ramp for WHEELCHAIR", () => {
    const { graph, startId, destId } = createMultiFloorLiftVsRampGraph();

    const result = findAccessibleRoute(graph, startId, destId, "WHEELCHAIR");
    expect(result.status).toBe("FOUND");
    if (result.status === "FOUND") {
      expect(result.totalDistanceMeters).toBe(5);
      expect(result.steps[0]?.edgeId).toBe("edge-lift-cheap");
    }
  });

  it("should return the exact same route deterministically when multiple equal-cost paths exist", () => {
    const { graph, startId, destId } = createEqualCostGraph();

    const run1 = findAccessibleRoute(graph, startId, destId, "CUSTOM");
    const run2 = findAccessibleRoute(graph, startId, destId, "CUSTOM");
    const run3 = findAccessibleRoute(graph, startId, destId, "CUSTOM");

    expect(run1.status).toBe("FOUND");
    expect(run2.status).toBe("FOUND");
    expect(run3.status).toBe("FOUND");

    if (run1.status === "FOUND" && run2.status === "FOUND" && run3.status === "FOUND") {
      expect(run1.steps.map((s) => s.edgeId)).toEqual(run2.steps.map((s) => s.edgeId));
      expect(run2.steps.map((s) => s.edgeId)).toEqual(run3.steps.map((s) => s.edgeId));
    }
  });

  it("property test: randomly generated graphs never produce a path through excluded edges for WHEELCHAIR", () => {
    function createRng(seed: number) {
      let state = seed;
      return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
      };
    }

    const rng = createRng(123456789);

    for (let iteration = 0; iteration < 25; iteration++) {
      const nodeCount = 5 + Math.floor(rng() * 4);
      const generatedNodes: GraphNode[] = [];

      for (let i = 0; i < nodeCount; i++) {
        generatedNodes.push({
          id: `rnd-node-${i}`,
          buildingId: "rnd-bld",
          floorId: `fl-${i % 2}`,
          floorNumber: i % 2,
          kind: "CORRIDOR",
          latitude: 12.9 + i * 0.001,
          longitude: 77.5 + i * 0.001,
          label: `Random Node ${i}`,
        });
      }

      const generatedEdges: GraphEdge[] = [];
      let edgeCounter = 0;

      for (let i = 0; i < nodeCount - 1; i++) {
        const isStairs = rng() < 0.35;
        const isOutOfService = !isStairs && rng() < 0.25;

        generatedEdges.push({
          id: `rnd-edge-${edgeCounter++}`,
          fromNodeId: `rnd-node-${i}`,
          toNodeId: `rnd-node-${i + 1}`,
          distanceMeters: 5 + Math.floor(rng() * 20),
          connectionType: isStairs ? "STAIRS" : isOutOfService ? "ELEVATOR" : "CORRIDOR",
          stepFree: !isStairs,
          operationalStatus: isOutOfService ? "OUT_OF_SERVICE" : "OPERATIONAL",
          isBidirectional: true,
        });

        if (rng() < 0.4 && i + 2 < nodeCount) {
          generatedEdges.push({
            id: `rnd-edge-skip-${edgeCounter++}`,
            fromNodeId: `rnd-node-${i}`,
            toNodeId: `rnd-node-${i + 2}`,
            distanceMeters: 10 + Math.floor(rng() * 30),
            connectionType: "RAMP",
            stepFree: true,
            operationalStatus: "OPERATIONAL",
            isBidirectional: true,
          });
        }
      }

      const randomGraph = buildNavigationGraph(generatedNodes, generatedEdges);
      const result = findAccessibleRoute(
        randomGraph,
        "rnd-node-0",
        `rnd-node-${nodeCount - 1}`,
        "WHEELCHAIR",
      );

      if (result.status === "FOUND") {
        for (const step of result.steps) {
          expect(step.connectionType).not.toBe("STAIRS");

          const originalEdge = generatedEdges.find((e) => e.id === step.edgeId);
          expect(originalEdge?.stepFree).toBe(true);
          expect(originalEdge?.operationalStatus).not.toBe("OUT_OF_SERVICE");
        }
      }
    }
  });
});
