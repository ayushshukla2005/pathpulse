import { buildNavigationGraph } from "../index";
import { GraphEdge, GraphNode, NavigationGraph, OperationalStatus } from "../types";

export function createSimpleGraph(): {
  graph: NavigationGraph;
  startId: string;
  destId: string;
} {
  const nodes: GraphNode[] = [
    {
      id: "node-a",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ENTRANCE",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Node A",
    },
    {
      id: "node-b",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.9717,
      longitude: 77.5947,
      label: "Node B",
    },
    {
      id: "node-c",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ROOM",
      latitude: 12.9718,
      longitude: 77.5948,
      label: "Node C",
    },
    {
      id: "node-d",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.9719,
      longitude: 77.5949,
      label: "Node D",
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: "edge-a-b",
      fromNodeId: "node-a",
      toNodeId: "node-b",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
    {
      id: "edge-b-c",
      fromNodeId: "node-b",
      toNodeId: "node-c",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
    {
      id: "edge-a-d",
      fromNodeId: "node-a",
      toNodeId: "node-d",
      distanceMeters: 25,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
    {
      id: "edge-d-c",
      fromNodeId: "node-d",
      toNodeId: "node-c",
      distanceMeters: 25,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
  ];

  return {
    graph: buildNavigationGraph(nodes, edges),
    startId: "node-a",
    destId: "node-c",
  };
}

export function createStairsVsRampGraph(): {
  graph: NavigationGraph;
  startId: string;
  destId: string;
} {
  const nodes: GraphNode[] = [
    {
      id: "ground-start",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "LOBBY",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Ground Lobby",
    },
    {
      id: "ramp-mid",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "RAMP_START",
      latitude: 12.9717,
      longitude: 77.5947,
      label: "Ramp Landing",
    },
    {
      id: "floor1-dest",
      buildingId: "bld-1",
      floorId: "fl-1",
      floorNumber: 1,
      kind: "LOBBY",
      latitude: 12.9718,
      longitude: 77.5948,
      label: "Floor 1 Lobby",
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: "edge-stairs-direct",
      fromNodeId: "ground-start",
      toNodeId: "floor1-dest",
      distanceMeters: 8,
      connectionType: "STAIRS",
      stepFree: false,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
    {
      id: "edge-ramp-1",
      fromNodeId: "ground-start",
      toNodeId: "ramp-mid",
      distanceMeters: 15,
      connectionType: "RAMP",
      stepFree: true,
      slopePercent: 4.5,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
    {
      id: "edge-ramp-2",
      fromNodeId: "ramp-mid",
      toNodeId: "floor1-dest",
      distanceMeters: 15,
      connectionType: "RAMP",
      stepFree: true,
      slopePercent: 4.5,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
  ];

  return {
    graph: buildNavigationGraph(nodes, edges),
    startId: "ground-start",
    destId: "floor1-dest",
  };
}

export function createElevatorGraph(
  status: OperationalStatus,
  hasRampAlternative: boolean,
): {
  graph: NavigationGraph;
  startId: string;
  destId: string;
  elevatorEdgeId: string;
} {
  const nodes: GraphNode[] = [
    {
      id: "fl0-lobby",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "LOBBY",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Floor 0 Lobby",
    },
    {
      id: "fl1-lobby",
      buildingId: "bld-1",
      floorId: "fl-1",
      floorNumber: 1,
      kind: "LOBBY",
      latitude: 12.9718,
      longitude: 77.5948,
      label: "Floor 1 Lobby",
    },
  ];

  const elevatorEdgeId = "edge-elevator-main";
  const edges: GraphEdge[] = [
    {
      id: elevatorEdgeId,
      fromNodeId: "fl0-lobby",
      toNodeId: "fl1-lobby",
      distanceMeters: 4,
      connectionType: "ELEVATOR",
      stepFree: true,
      operationalStatus: status,
      isBidirectional: true,
    },
  ];

  if (hasRampAlternative) {
    nodes.push({
      id: "fl0-ramp-point",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "RAMP_START",
      latitude: 12.9717,
      longitude: 77.5947,
      label: "Ramp Point",
    });

    edges.push(
      {
        id: "edge-ramp-seg-1",
        fromNodeId: "fl0-lobby",
        toNodeId: "fl0-ramp-point",
        distanceMeters: 20,
        connectionType: "CORRIDOR",
        stepFree: true,
        operationalStatus: "OPERATIONAL",
        isBidirectional: true,
      },
      {
        id: "edge-ramp-seg-2",
        fromNodeId: "fl0-ramp-point",
        toNodeId: "fl1-lobby",
        distanceMeters: 20,
        connectionType: "RAMP",
        stepFree: true,
        slopePercent: 4.0,
        operationalStatus: "OPERATIONAL",
        isBidirectional: true,
      },
    );
  }

  return {
    graph: buildNavigationGraph(nodes, edges),
    startId: "fl0-lobby",
    destId: "fl1-lobby",
    elevatorEdgeId,
  };
}

export function createMultiFloorLiftVsRampGraph(): {
  graph: NavigationGraph;
  startId: string;
  destId: string;
} {
  const nodes: GraphNode[] = [
    {
      id: "fl0-hub",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "LOBBY",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Hub 0",
    },
    {
      id: "fl1-hub",
      buildingId: "bld-1",
      floorId: "fl-1",
      floorNumber: 1,
      kind: "LOBBY",
      latitude: 12.9718,
      longitude: 77.5948,
      label: "Hub 1",
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: "edge-lift-cheap",
      fromNodeId: "fl0-hub",
      toNodeId: "fl1-hub",
      distanceMeters: 5,
      connectionType: "ELEVATOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
    {
      id: "edge-ramp-expensive",
      fromNodeId: "fl0-hub",
      toNodeId: "fl1-hub",
      distanceMeters: 60,
      connectionType: "RAMP",
      stepFree: true,
      slopePercent: 3.5,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
  ];

  return {
    graph: buildNavigationGraph(nodes, edges),
    startId: "fl0-hub",
    destId: "fl1-hub",
  };
}

export function createEqualCostGraph(): {
  graph: NavigationGraph;
  startId: string;
  destId: string;
} {
  const nodes: GraphNode[] = [
    {
      id: "start-node",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ENTRANCE",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Start",
    },
    {
      id: "branch-a-mid",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.9717,
      longitude: 77.5947,
      label: "Branch A",
    },
    {
      id: "branch-b-mid",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.9717,
      longitude: 77.5945,
      label: "Branch B",
    },
    {
      id: "end-node",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ROOM",
      latitude: 12.9718,
      longitude: 77.5946,
      label: "End",
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: "edge-path-1-a",
      fromNodeId: "start-node",
      toNodeId: "branch-a-mid",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
    {
      id: "edge-path-1-b",
      fromNodeId: "branch-a-mid",
      toNodeId: "end-node",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
    {
      id: "edge-path-2-a",
      fromNodeId: "start-node",
      toNodeId: "branch-b-mid",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
    {
      id: "edge-path-2-b",
      fromNodeId: "branch-b-mid",
      toNodeId: "end-node",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: false,
    },
  ];

  return {
    graph: buildNavigationGraph(nodes, edges),
    startId: "start-node",
    destId: "end-node",
  };
}

export function createDisconnectedGraph(): {
  graph: NavigationGraph;
  startId: string;
  unreachableId: string;
} {
  const nodes: GraphNode[] = [
    {
      id: "island-a-1",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ENTRANCE",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "A1",
    },
    {
      id: "island-a-2",
      buildingId: "bld-1",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "CORRIDOR",
      latitude: 12.9717,
      longitude: 77.5947,
      label: "A2",
    },
    {
      id: "island-b-1",
      buildingId: "bld-2",
      floorId: "fl-0",
      floorNumber: 0,
      kind: "ENTRANCE",
      latitude: 12.975,
      longitude: 77.598,
      label: "B1",
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: "edge-island-a",
      fromNodeId: "island-a-1",
      toNodeId: "island-a-2",
      distanceMeters: 10,
      connectionType: "CORRIDOR",
      stepFree: true,
      operationalStatus: "OPERATIONAL",
      isBidirectional: true,
    },
  ];

  return {
    graph: buildNavigationGraph(nodes, edges),
    startId: "island-a-1",
    unreachableId: "island-b-1",
  };
}
