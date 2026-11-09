import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Axe Accessibility Scans", () => {
  test("Landing page has zero serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Login page has zero serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/login");
    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Register page has zero serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/register");
    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Explore page has zero serious or critical accessibility violations", async ({ page }) => {
    await page.route(/\/api\/v1\/venues(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "v-demo",
            name: "Central Campus (Demo)",
            category: "CAMPUS",
            address: "123 Academic Way, Demo City",
            latitude: 12.9716,
            longitude: 77.5946,
            distanceMeters: 250,
            facilities: [
              {
                id: "f-1",
                venue_id: "v-demo",
                facility_type: "ENTRANCE",
                name: "Main Entrance (Step-Free)",
                operational_status: "OPERATIONAL",
                verification_level: "CONFIRMED",
                last_verified_at: "2026-10-15T10:00:00Z",
              },
              {
                id: "f-2",
                venue_id: "v-demo",
                facility_type: "ACCESSIBLE_RESTROOM",
                name: "Accessible Restroom (Ground Floor)",
                operational_status: "OPERATIONAL",
                verification_level: "UNVERIFIED",
                last_verified_at: null,
              },
            ],
          },
        ]),
      });
    });

    await page.goto("/explore");
    await expect(page.locator("h1")).toContainText("Explore Accessible Venues");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Venue detail page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/venues\/v-demo/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "v-demo",
          name: "Central Campus (Demo)",
          category: "CAMPUS",
          address: "123 Academic Way, Demo City",
          latitude: 12.9716,
          longitude: 77.5946,
          distanceMeters: 250,
          buildings: [
            {
              id: "bld-1",
              venue_id: "v-demo",
              name: "Science & Tech Building (Demo)",
              building_code: "ST-01",
              graph_version: 1,
            },
          ],
          facilities: [
            {
              id: "f-1",
              venue_id: "v-demo",
              facility_type: "ENTRANCE",
              name: "Main Entrance (Step-Free)",
              operational_status: "OPERATIONAL",
              verification_level: "CONFIRMED",
              last_verified_at: "2026-10-15T10:00:00Z",
            },
            {
              id: "f-2",
              venue_id: "v-demo",
              facility_type: "ACCESSIBLE_RESTROOM",
              name: "Accessible Restroom (Ground Floor)",
              operational_status: "OPERATIONAL",
              verification_level: "UNVERIFIED",
              last_verified_at: null,
            },
            {
              id: "f-3",
              venue_id: "v-demo",
              facility_type: "LIFT",
              name: "West Service Lift",
              operational_status: "OUT_OF_SERVICE",
              verification_level: "UNAVAILABLE",
              last_verified_at: "2026-11-05T12:00:00Z",
            },
          ],
        }),
      });
    });

    await page.goto("/venues/v-demo");
    await expect(page.locator("h1")).toContainText("Central Campus (Demo)");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Navigation route planner page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/buildings\/bld-demo-st01\/map/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          building: {
            id: "bld-demo-st01",
            venue_id: "v-demo",
            name: "Science & Tech Building (Demo)",
            building_code: "ST-01",
            graph_version: 1,
          },
          floors: [
            { id: "fl-0", floor_number: 0, name: "Ground Floor (Demo)", level_index: 0 },
            { id: "fl-1", floor_number: 1, name: "First Floor (Demo)", level_index: 1 },
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
            },
            {
              id: "node-corridor-1",
              building_id: "bld-demo-st01",
              floor_id: "fl-1",
              node_type: "CORRIDOR",
              name: "First Floor Corridor (Demo)",
              x_coordinate: 50,
              y_coordinate: 10,
            },
          ],
          edges: [],
        }),
      });
    });

    await page.goto("/navigation?buildingId=bld-demo-st01");
    await expect(page.locator("h1")).toContainText("Accessible Route Planner");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Floor detail page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/buildings\/bld-demo-st01\/floors\/fl-0/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          floor: {
            id: "fl-0",
            building_id: "bld-demo-st01",
            floor_number: 0,
            name: "Ground Floor (Demo)",
            level_index: 0,
          },
          building: {
            id: "bld-demo-st01",
            venue_id: "v-demo",
            name: "Science & Tech Building (Demo)",
            building_code: "ST-01",
          },
          nodes: [
            {
              id: "node-entrance",
              building_id: "bld-demo-st01",
              floor_id: "fl-0",
              node_type: "ENTRANCE",
              name: "Main Entrance (Demo)",
              x_coordinate: 10,
              y_coordinate: 10,
            },
          ],
          facilities: [
            {
              id: "f-1",
              venue_id: "v-demo",
              building_id: "bld-demo-st01",
              floor_id: "fl-0",
              facility_type: "ENTRANCE",
              name: "Main Entrance",
              operational_status: "OPERATIONAL",
              verification_level: "CONFIRMED",
              last_verified_at: "2026-10-15T10:00:00Z",
            },
          ],
        }),
      });
    });

    await page.goto("/buildings/bld-demo-st01/floors/fl-0");
    await expect(page.locator("h1")).toContainText("Ground Floor (Demo)");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("New report page has zero serious or critical accessibility violations", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-test-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/v1\/venues(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "venue-central",
            name: "Central Campus Center",
            category: "CAMPUS",
            facilities: [],
          },
        ]),
      });
    });

    await page.goto("/reports/new");
    await expect(page.locator("h1")).toContainText("Report an Accessibility Barrier");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("My reports page has zero serious or critical accessibility violations", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-test-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/v1\/reports\/mine(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "report-1",
              tracking_code: "PP-2026-AXETST",
              user_id: "user-1",
              venue_id: "venue-central",
              facility_id: null,
              category: "BROKEN_LIFT",
              title: null,
              description: "The main passenger elevator is out of service.",
              status: "SUBMITTED",
              latitude: 12.9716,
              longitude: 77.5946,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              evidence: [],
              venue: { id: "venue-central", name: "Central Campus Center" },
              facility: null,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      });
    });

    await page.goto("/reports");
    await expect(page.locator("h1")).toContainText("My Barrier Reports");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Moderator review page has zero serious or critical accessibility violations", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-test-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-access-token",
          user: {
            id: "mod-axe-1",
            email: "mod@pathpulse.local",
            name: "Axe Moderator",
            role: "MODERATOR",
            createdAt: new Date().toISOString(),
            preferences: null,
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/notifications$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 }),
      });
    });

    await page.route(/\/api\/v1\/reports\/axe-mod-rep$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "axe-mod-rep",
          tracking_code: "REP-20261108-AXE1",
          user_id: "user-1",
          venue_id: "venue-central",
          facility_id: null,
          category: "BROKEN_LIFT",
          title: "Elevator out of service",
          description: "Elevator buttons unresponsive",
          status: "UNDER_REVIEW",
          latitude: 12.9716,
          longitude: 77.5946,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          evidence: [],
          venue: { id: "venue-central", name: "Central Campus Center" },
          facility: null,
        }),
      });
    });

    await page.route(/\/api\/v1\/reports\/axe-mod-rep\/workflow-summary$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "axe-mod-rep",
          trackingCode: "REP-20261108-AXE1",
          status: "UNDER_REVIEW",
          category: "BROKEN_LIFT",
          reopenCount: 0,
          assignedToUserId: null,
          verifiedByUserId: null,
          resolvedAt: null,
          allowedActions: [
            { action: "VERIFY", label: "Verify Barrier", targetStatus: "VERIFIED" },
            {
              action: "REJECT",
              label: "Reject Report",
              targetStatus: "REJECTED",
              requiresReason: true,
            },
          ],
        }),
      });
    });

    await page.route(/\/api\/v1\/reports\/axe-mod-rep\/audit$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "aud-1",
            actorUserId: "mod-1",
            actorName: "Axe Moderator",
            action: "REVIEW",
            fromStatus: "SUBMITTED",
            toStatus: "UNDER_REVIEW",
            reason: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.route(/\/api\/v1\/reports\/axe-mod-rep\/duplicates$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/moderation/reports/axe-mod-rep");
    await expect(page.locator("h1")).toContainText("Review Report: REP-20261108-AXE1");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Notifications page has zero serious or critical accessibility violations", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-test-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-access-token",
          user: {
            id: "user-1",
            email: "user@pathpulse.local",
            name: "User One",
            role: "USER",
            createdAt: new Date().toISOString(),
            preferences: null,
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/notifications$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "notif-1",
              reportId: "rep-1",
              type: "REPORT_VERIFIED",
              title: "Report Verified",
              message: "Your report REP-20261108-AXE1 has been verified.",
              link: "/reports/rep-1",
              readAt: null,
              createdAt: new Date().toISOString(),
            },
          ],
          unreadCount: 1,
        }),
      });
    });

    await page.goto("/notifications");
    await expect(page.locator("h1")).toContainText("Notifications");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Organization overview page has zero serious or critical accessibility violations", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "mock-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-access-token",
          user: {
            id: "org-admin-1",
            email: "admin@campus.edu",
            name: "Campus Admin",
            role: "ORGANIZATION_ADMIN",
            createdAt: new Date().toISOString(),
            organizationId: "org-1",
            organizationMemberships: [
              {
                organizationId: "org-1",
                role: "ORGANIZATION_ADMIN",
                organizationName: "Main University",
              },
            ],
            preferences: null,
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/organizations\/org-1\/dashboard$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verifiedRouteCoverage: 91.2,
          pendingIssues: 4,
          verifiedFacilities: 18,
          resolvedReports: 5,
          generatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.route(/\/api\/v1\/notifications(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 }),
      });
    });

    await page.goto("/organization");
    await expect(page.locator("h1")).toContainText("Main University");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Organization facilities page has zero serious or critical accessibility violations", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "mock-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-access-token",
          user: {
            id: "org-admin-1",
            email: "admin@campus.edu",
            name: "Campus Admin",
            role: "ORGANIZATION_ADMIN",
            createdAt: new Date().toISOString(),
            organizationId: "org-1",
            organizationMemberships: [
              {
                organizationId: "org-1",
                role: "ORGANIZATION_ADMIN",
                organizationName: "Main University",
              },
            ],
            preferences: null,
          },
        }),
      });
    });

    await page.route(
      /\/api\/v1\/organizations\/org-1\/facilities\?buildingId=bld-axe.*$/,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "fac-axe-1",
                venueId: "ven-1",
                buildingId: "bld-axe",
                floorId: "flr-1",
                floorName: "Level 1",
                nodeId: "node-1",
                facilityType: "ELEVATOR",
                name: "Central Lift",
                operationalStatus: "OPERATIONAL",
                verificationLevel: "CONFIRMED",
                lastVerifiedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 100,
          }),
        });
      },
    );

    await page.route(/\/api\/v1\/notifications(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 }),
      });
    });

    await page.goto("/organization/buildings/bld-axe/facilities");
    await expect(page.locator("h2")).toContainText("Facility Status & Controls");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("About page has zero serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("About PathPulse");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Accessibility statement page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/accessibility");
    await expect(page.locator("h1")).toContainText("Accessibility Statement");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Privacy notice page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("Privacy Notice");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Terms of use page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("Terms of Use");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Contact & feedback page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("Contact & Feedback");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Not found (404) page has zero serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/does-not-exist-page-for-axe");
    await expect(page.locator("h1")).toContainText("Page Not Found");

    const scanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = scanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });
});
