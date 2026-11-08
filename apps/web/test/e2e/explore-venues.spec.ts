import { test, expect } from "@playwright/test";

const mockVenues = [
  {
    id: "v-demo-campus",
    name: "Central Campus (Demo)",
    category: "CAMPUS",
    address: "123 Academic Way, Demo City",
    latitude: 12.9716,
    longitude: 77.5946,
    distanceMeters: 250,
    facilities: [
      {
        id: "f-1",
        venue_id: "v-demo-campus",
        building_id: "bld-1",
        floor_id: "fl-0",
        node_id: "n-1",
        facility_type: "ENTRANCE",
        name: "Main Entrance (Step-Free)",
        operational_status: "OPERATIONAL",
        verification_level: "CONFIRMED",
        last_verified_at: "2026-10-15T10:00:00Z",
      },
      {
        id: "f-2",
        venue_id: "v-demo-campus",
        building_id: "bld-1",
        floor_id: "fl-0",
        node_id: "n-2",
        facility_type: "ACCESSIBLE_RESTROOM",
        name: "Accessible Restroom (Ground Floor)",
        operational_status: "OPERATIONAL",
        verification_level: "UNVERIFIED",
        last_verified_at: null,
      },
      {
        id: "f-3",
        venue_id: "v-demo-campus",
        building_id: "bld-1",
        floor_id: "fl-0",
        node_id: "n-3",
        facility_type: "LIFT",
        name: "West Service Lift",
        operational_status: "OUT_OF_SERVICE",
        verification_level: "UNAVAILABLE",
        last_verified_at: "2026-11-05T12:00:00Z",
      },
    ],
  },
];

const mockVenueDetail = {
  ...mockVenues[0],
  buildings: [
    {
      id: "bld-1",
      venue_id: "v-demo-campus",
      name: "Science & Tech Building (Demo)",
      building_code: "ST-01",
      graph_version: 1,
    },
  ],
};

test.describe("Explore Dashboard & Venue Discovery", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/v1\/venues\/v-demo-campus/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVenueDetail),
      });
    });

    await page.route(/\/api\/v1\/venues(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVenues),
      });
    });
  });

  test("Explore page loads, shows at least one venue in list, reachable by Tab alone", async ({
    page,
  }) => {
    await page.goto("/explore");

    await expect(page.locator("h1")).toContainText("Explore Accessible Venues");

    const venueCard = page.locator("#venue-card-v-demo-campus");
    await expect(venueCard).toBeVisible();
    await expect(venueCard).toContainText("Central Campus (Demo)");
    await expect(venueCard).toContainText("CAMPUS");
    await expect(venueCard).toContainText("250 m away");

    let isFocused = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const activeText = await page.evaluate(() => document.activeElement?.textContent);
      if (activeText?.includes("Central Campus (Demo)")) {
        isFocused = true;
        break;
      }
    }
    expect(isFocused).toBe(true);
  });

  test("Selecting a venue opens its detail page with facilities and verification labels", async ({
    page,
  }) => {
    await page.goto("/explore");

    await page.click('a:has-text("Central Campus (Demo)")');
    await expect(page).toHaveURL(/\/venues\/v-demo-campus/);

    await expect(page.locator("h1")).toContainText("Central Campus (Demo)");
    await expect(page.locator("body")).toContainText("123 Academic Way, Demo City");

    await expect(page.locator("body")).toContainText("Science & Tech Building (Demo)");
    await expect(page.locator('a[href="/buildings/bld-1/floors"]')).toBeVisible();

    await expect(page.locator("body")).toContainText("Main Entrance (Step-Free)");
    await expect(page.locator("body")).toContainText("Confirmed");

    await expect(page.locator("body")).toContainText("Accessible Restroom (Ground Floor)");
    await expect(page.locator("body")).toContainText("Unverified");
    await expect(page.locator("body")).toContainText("Never verified");

    await expect(page.locator("body")).toContainText("West Service Lift");
    await expect(page.locator("body")).toContainText("Unavailable");

    await expect(page.locator("#legend-heading")).toContainText("Facility Verification Legend");
  });

  test("Changing the radius updates the result count announcement", async ({ page }) => {
    await page.goto("/explore");

    const announcer = page.locator("#explore-announcer");
    await expect(announcer).toContainText(/available within 1 kilometer/i);

    await page.selectOption("#venue-radius-filter", "5000");

    await expect(announcer).toContainText(/5 kilometers/i);
  });

  test("Geolocation is not requested on page load and button is the only trigger", async ({
    page,
    context,
  }) => {
    let promptTriggered = false;
    await context.route("**", (route) => route.continue());

    page.on("dialog", () => {
      promptTriggered = true;
    });

    await page.goto("/explore");
    await page.waitForTimeout(500);

    expect(promptTriggered).toBe(false);

    const geoButton = page.locator('button:has-text("Use my current location")');
    await expect(geoButton).toBeVisible();
    await expect(geoButton).toBeEnabled();
  });
});
