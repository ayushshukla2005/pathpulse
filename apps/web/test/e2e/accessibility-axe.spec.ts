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
});
