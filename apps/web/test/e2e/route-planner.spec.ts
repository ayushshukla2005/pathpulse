import { test, expect } from "@playwright/test";

const mockBuildingMap = {
  building: {
    id: "bld-demo-st01",
    venue_id: "v-demo",
    name: "Science & Tech Building (Demo)",
    building_code: "ST-01",
    graph_version: 1,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
  },
  floors: [
    {
      id: "fl-0",
      building_id: "bld-demo-st01",
      floor_number: 0,
      name: "Ground Floor (Demo)",
      level_index: 0,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
    {
      id: "fl-1",
      building_id: "bld-demo-st01",
      floor_number: 1,
      name: "First Floor (Demo)",
      level_index: 1,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
  ],
  nodes: [
    {
      id: "node-entrance",
      building_id: "bld-demo-st01",
      floor_id: "fl-0",
      node_type: "ENTRANCE",
      name: "Main Entrance (Demo)",
      x_coordinate: 10,
      y_coordinate: 10,
      latitude: 12.9716,
      longitude: 77.5946,
      is_accessible: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
    {
      id: "node-lobby-0",
      building_id: "bld-demo-st01",
      floor_id: "fl-0",
      node_type: "LOBBY",
      name: "Ground Lift Lobby (Demo)",
      x_coordinate: 30,
      y_coordinate: 10,
      latitude: null,
      longitude: null,
      is_accessible: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
    {
      id: "node-lobby-1",
      building_id: "bld-demo-st01",
      floor_id: "fl-1",
      node_type: "LOBBY",
      name: "First Floor Lift Lobby (Demo)",
      x_coordinate: 30,
      y_coordinate: 10,
      latitude: null,
      longitude: null,
      is_accessible: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
    {
      id: "node-corridor-1",
      building_id: "bld-demo-st01",
      floor_id: "fl-1",
      node_type: "CORRIDOR",
      name: "First Floor Corridor (Demo)",
      x_coordinate: 50,
      y_coordinate: 10,
      latitude: null,
      longitude: null,
      is_accessible: true,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
  ],
  edges: [
    {
      id: "edge-1",
      building_id: "bld-demo-st01",
      from_node_id: "node-entrance",
      to_node_id: "node-lobby-0",
      connection_type: "RAMP",
      distance_meters: 20,
      step_free: true,
      operational_status: "OPERATIONAL",
      verification_level: "CONFIRMED",
    },
    {
      id: "edge-2",
      building_id: "bld-demo-st01",
      from_node_id: "node-lobby-0",
      to_node_id: "node-lobby-1",
      connection_type: "ELEVATOR",
      distance_meters: 4,
      step_free: true,
      operational_status: "OPERATIONAL",
      verification_level: "CONFIRMED",
    },
    {
      id: "edge-3",
      building_id: "bld-demo-st01",
      from_node_id: "node-lobby-1",
      to_node_id: "node-corridor-1",
      connection_type: "CORRIDOR",
      distance_meters: 20,
      step_free: true,
      operational_status: "OPERATIONAL",
      verification_level: "CONFIRMED",
    },
  ],
};

const mockWheelchairRouteResponse = {
  status: "FOUND",
  steps: [
    {
      fromNodeId: "node-entrance",
      toNodeId: "node-lobby-0",
      edgeId: "edge-1",
      connectionType: "RAMP",
      distanceMeters: 20,
      confidence: "CONFIRMED",
      instruction: "Follow the ramp for 20 metres",
    },
    {
      fromNodeId: "node-lobby-0",
      toNodeId: "node-lobby-1",
      edgeId: "edge-2",
      connectionType: "ELEVATOR",
      distanceMeters: 4,
      confidence: "CONFIRMED",
      instruction: "Take the lift from floor 0 to floor 1",
    },
    {
      fromNodeId: "node-lobby-1",
      toNodeId: "node-corridor-1",
      edgeId: "edge-3",
      connectionType: "CORRIDOR",
      distanceMeters: 20,
      confidence: "CONFIRMED",
      instruction: "Walk along the corridor for 20 metres",
    },
  ],
  totalDistanceMeters: 44,
  accessibility: "STEP_FREE",
  warnings: [],
  cache: "MISS",
};

test.describe("Route Planner Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/v1\/buildings\/bld-demo-st01\/map/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBuildingMap),
      });
    });

    await page.route(/\/api\/v1\/buildings\/bld-demo-st01\/floors/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBuildingMap.floors),
      });
    });
  });

  test("Wheelchair route between two seeded nodes on different floors shows step-free labelling and floor-wise steps", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/routes$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockWheelchairRouteResponse),
      });
    });

    await page.goto("/navigation?buildingId=bld-demo-st01");
    await expect(page.locator("h1")).toContainText("Accessible Route Planner");

    await page.selectOption("#origin-select", "node-entrance");
    await page.selectOption("#destination-select", "node-corridor-1");
    await page.selectOption("#profile-select", "WHEELCHAIR");

    await page.click("button:has-text('Calculate Route')");

    await expect(page.getByText(/Confirmed Step-Free Route/i)).toBeVisible();
    await expect(page.getByText("44 m", { exact: true })).toBeVisible();
    await expect(page.getByText("All segments confirmed")).toBeVisible();

    await expect(page.locator("ol").first()).toBeVisible();
    expect(await page.locator("ol").count()).toBe(2);
    await expect(page.getByText("Follow the ramp for 20 metres")).toBeVisible();
    await expect(page.getByText("Take the lift from floor 0 to floor 1")).toBeVisible();
    await expect(page.getByText("Walk along the corridor for 20 metres")).toBeVisible();

    const confirmedBadges = page.locator("ol").getByText("Confirmed");
    expect(await confirmedBadges.count()).toBe(3);
  });

  test("A route request that the API answers with 422 shows the no-confirmed-route state and no step list", async ({
    page,
  }) => {
    const unverifiedBarrierReason =
      "Route requires confirmed accessibility but contains unverified segment: edge-stairs";

    await page.route(/\/api\/v1\/routes$/, async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 422,
          error: "Unprocessable Entity",
          message: unverifiedBarrierReason,
          path: "/api/v1/routes",
          timestamp: "2026-11-08T12:00:00Z",
          requestId: "req-422-test",
        }),
      });
    });

    await page.goto("/navigation?buildingId=bld-demo-st01");

    await page.selectOption("#origin-select", "node-entrance");
    await page.selectOption("#destination-select", "node-corridor-1");
    await page.selectOption("#profile-select", "WHEELCHAIR");

    await page.click("button:has-text('Calculate Route')");

    const noRouteRegion = page.getByRole("region", { name: "No Confirmed Route Available" });
    await expect(noRouteRegion).toBeVisible();
    await expect(noRouteRegion.getByText(unverifiedBarrierReason)).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Choose a different mobility profile" }),
    ).toBeVisible();
    await expect(page.getByText(/Contact venue:/i)).toBeVisible();
    const reportLink = page.getByRole("link", { name: /Report an accessibility barrier/i });
    await expect(reportLink).toBeVisible();
    await expect(reportLink).toHaveAttribute("href", "/reports/new");

    await expect(page.locator("ol")).toHaveCount(0);
  });

  test("Origin equal to destination shows a validation message and does not call the API", async ({
    page,
  }) => {
    let apiCalled = false;
    await page.route(/\/api\/v1\/routes$/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, body: "{}" });
    });

    await page.goto("/navigation?buildingId=bld-demo-st01");

    await page.selectOption("#origin-select", "node-entrance");
    await page.selectOption("#destination-select", "node-entrance");

    await page.click("button:has-text('Calculate Route')");

    await expect(page.locator("#destination-error")).toContainText(
      "Origin and destination cannot be the same node.",
    );
    expect(apiCalled).toBe(false);
  });

  test("The full planner is operable with the keyboard alone", async ({ page }) => {
    await page.route(/\/api\/v1\/routes$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockWheelchairRouteResponse),
      });
    });

    await page.goto("/navigation?buildingId=bld-demo-st01");

    await page.locator("#origin-select").focus();
    await expect(page.locator("#origin-select")).toBeFocused();
    await page.selectOption("#origin-select", "node-entrance");

    await page.keyboard.press("Tab");
    await expect(page.locator("#destination-select")).toBeFocused();
    await page.selectOption("#destination-select", "node-corridor-1");

    await page.keyboard.press("Tab");
    await expect(page.locator("#profile-select")).toBeFocused();

    await page.keyboard.press("Tab");
    const submitBtn = page.getByRole("button", { name: "Calculate Route" });
    await expect(submitBtn).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.locator("ol").first()).toBeVisible();
    expect(await page.locator("ol").count()).toBe(2);
    await expect(page.getByText(/Confirmed Step-Free Route/i)).toBeVisible();
  });
});
