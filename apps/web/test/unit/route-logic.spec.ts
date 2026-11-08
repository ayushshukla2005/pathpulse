import { describe, expect, it } from "vitest";
import type { RouteSegment } from "@pathpulse/shared-types";
import { groupStepsByFloor, validateRouteRequest } from "@pathpulse/validation";

describe("Route Request Validation", () => {
  const validRequest = {
    buildingId: "bld-1",
    originNodeId: "node-origin",
    destinationNodeId: "node-dest",
    profile: "WHEELCHAIR" as const,
  };

  it("accepts a completely valid route request", () => {
    const result = validateRouteRequest(validRequest);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("rejects when origin and destination nodes are identical", () => {
    const result = validateRouteRequest({
      ...validRequest,
      originNodeId: "same-node-123",
      destinationNodeId: "same-node-123",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.destinationNodeId).toBe("Origin and destination cannot be the same node.");
  });

  it("rejects when required fields are missing or empty", () => {
    const result = validateRouteRequest({
      buildingId: "   ",
      originNodeId: "",
      destinationNodeId: undefined,
      profile: undefined,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.buildingId).toBe("Building selection is required.");
    expect(result.errors.originNodeId).toBe("Origin node is required.");
    expect(result.errors.destinationNodeId).toBe("Destination node is required.");
    expect(result.errors.profile).toBe("Mobility profile is required.");
  });

  it("rejects when profile is invalid", () => {
    const result = validateRouteRequest({
      ...validRequest,
      profile: "NON_EXISTENT_PROFILE" as unknown as typeof validRequest.profile,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.profile).toBe("Selected mobility profile is invalid.");
  });
});

describe("Step Grouping by Floor", () => {
  const nodesMap = new Map([
    ["n-entrance", { floorId: "fl-0", floorNumber: 0, floorName: "Ground Floor" }],
    ["n-lobby-0", { floorId: "fl-0", floorNumber: 0, floorName: "Ground Floor" }],
    ["n-corridor-0", { floorId: "fl-0", floorNumber: 0, floorName: "Ground Floor" }],
    ["n-lobby-1", { floorId: "fl-1", floorNumber: 1, floorName: "Floor 1" }],
    ["n-room-101", { floorId: "fl-1", floorNumber: 1, floorName: "Floor 1" }],
    ["n-lobby-2", { floorId: "fl-2", floorNumber: 2, floorName: "Floor 2" }],
    ["n-lab-202", { floorId: "fl-2", floorNumber: 2, floorName: "Floor 2" }],
  ]);

  const step1: RouteSegment = {
    fromNodeId: "n-entrance",
    toNodeId: "n-lobby-0",
    edgeId: "e-1",
    connectionType: "CORRIDOR",
    distanceMeters: 15,
    confidence: "CONFIRMED",
    instruction: "Walk along the corridor for 15 metres",
  };

  const step2: RouteSegment = {
    fromNodeId: "n-lobby-0",
    toNodeId: "n-corridor-0",
    edgeId: "e-2",
    connectionType: "CORRIDOR",
    distanceMeters: 10,
    confidence: "CONFIRMED",
    instruction: "Walk along the corridor for 10 metres",
  };

  const step3Elevator: RouteSegment = {
    fromNodeId: "n-lobby-0",
    toNodeId: "n-lobby-1",
    edgeId: "e-3",
    connectionType: "ELEVATOR",
    distanceMeters: 4,
    confidence: "CONFIRMED",
    instruction: "Take the lift from floor 0 to floor 1",
  };

  const step4: RouteSegment = {
    fromNodeId: "n-lobby-1",
    toNodeId: "n-room-101",
    edgeId: "e-4",
    connectionType: "CORRIDOR",
    distanceMeters: 20,
    confidence: "CONFIRMED",
    instruction: "Walk along the corridor for 20 metres",
  };

  const step5Elevator: RouteSegment = {
    fromNodeId: "n-lobby-1",
    toNodeId: "n-lobby-2",
    edgeId: "e-5",
    connectionType: "ELEVATOR",
    distanceMeters: 4,
    confidence: "CONFIRMED",
    instruction: "Take the lift from floor 1 to floor 2",
  };

  const step6: RouteSegment = {
    fromNodeId: "n-lobby-2",
    toNodeId: "n-lab-202",
    edgeId: "e-6",
    connectionType: "DOOR",
    distanceMeters: 5,
    confidence: "CONFIRMED",
    instruction: "Pass through the door",
  };

  it("preserves exact step order across all floor groups", () => {
    const rawSteps = [step1, step2, step3Elevator, step4, step5Elevator, step6];
    const groups = groupStepsByFloor(rawSteps, nodesMap);

    const flattened = groups.flatMap((g) => g.steps);
    expect(flattened).toHaveLength(rawSteps.length);
    expect(flattened[0]?.edgeId).toBe("e-1");
    expect(flattened[1]?.edgeId).toBe("e-2");
    expect(flattened[2]?.edgeId).toBe("e-3");
    expect(flattened[3]?.edgeId).toBe("e-4");
    expect(flattened[4]?.edgeId).toBe("e-5");
    expect(flattened[5]?.edgeId).toBe("e-6");
  });

  it("keeps segments with no floor boundary together in the same group", () => {
    const singleFloorSteps = [step1, step2];
    const groups = groupStepsByFloor(singleFloorSteps, nodesMap);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.floorId).toBe("fl-0");
    expect(groups[0]?.floorName).toBe("Ground Floor");
    expect(groups[0]?.steps).toHaveLength(2);
    expect(groups[0]?.steps[0]?.edgeId).toBe("e-1");
    expect(groups[0]?.steps[1]?.edgeId).toBe("e-2");
  });

  it("starts a new group when a floor change occurs", () => {
    const multiFloorSteps = [step1, step2, step4, step6];
    const groups = groupStepsByFloor(multiFloorSteps, nodesMap);

    expect(groups).toHaveLength(3);
    expect(groups[0]?.floorId).toBe("fl-0");
    expect(groups[0]?.steps).toHaveLength(2);

    expect(groups[1]?.floorId).toBe("fl-1");
    expect(groups[1]?.floorName).toBe("Floor 1");
    expect(groups[1]?.steps).toHaveLength(1);
    expect(groups[1]?.steps[0]?.edgeId).toBe("e-4");

    expect(groups[2]?.floorId).toBe("fl-2");
    expect(groups[2]?.floorName).toBe("Floor 2");
    expect(groups[2]?.steps).toHaveLength(1);
    expect(groups[2]?.steps[0]?.edgeId).toBe("e-6");
  });

  it("returns empty array when steps input is empty", () => {
    expect(groupStepsByFloor([], nodesMap)).toEqual([]);
  });
});
