import { expect, test } from "@playwright/test";

test.describe("Organization Dashboard & Facilities Management (e2e)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-org-admin-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.route(/\/api\/v1\/notifications(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 }),
      });
    });
  });

  test("Org admin views overview metrics and generatedAt timestamp", async ({ page }) => {
    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-org-admin-token",
          user: {
            id: "org-admin-1",
            email: "admin@campus.edu",
            name: "Campus Admin",
            role: "ORGANIZATION_ADMIN",
            createdAt: new Date().toISOString(),
            organizationId: "org-univ-1",
            organizationMemberships: [
              {
                organizationId: "org-univ-1",
                role: "ORGANIZATION_ADMIN",
                organizationName: "Metropolitan University",
              },
            ],
            preferences: null,
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/organizations\/org-univ-1\/dashboard$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verifiedRouteCoverage: 88.5,
          pendingIssues: 3,
          verifiedFacilities: 14,
          resolvedReports: 6,
          generatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto("/organization");

    await expect(page.getByRole("heading", { name: "Metropolitan University" })).toBeVisible();
    await expect(page.getByText("88.5%")).toBeVisible();
    await expect(page.getByText("Verified Route Coverage")).toBeVisible();
    await expect(page.getByText("Pending Issues")).toBeVisible();
    await expect(page.getByText("Verified Facilities")).toBeVisible();
    await expect(page.getByText("Resolved (Last 30 Days)")).toBeVisible();
    await expect(page.getByText(/Last updated:/)).toBeVisible();
  });

  test("Org admin navigates to building facilities and updates elevator status", async ({
    page,
  }) => {
    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-org-admin-token",
          user: {
            id: "org-admin-1",
            email: "admin@campus.edu",
            name: "Campus Admin",
            role: "ORGANIZATION_ADMIN",
            createdAt: new Date().toISOString(),
            organizationId: "org-univ-1",
            organizationMemberships: [
              {
                organizationId: "org-univ-1",
                role: "ORGANIZATION_ADMIN",
                organizationName: "Metropolitan University",
              },
            ],
            preferences: null,
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/organizations\/org-univ-1\/buildings$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "bld-tech-1",
              name: "Technology Center",
              buildingCode: "TECH-A",
              graphVersion: 3,
              venueId: "ven-1",
              venueName: "Main Campus",
              floorCount: 4,
              facilityCount: 8,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
        }),
      });
    });

    let currentStatus = "OPERATIONAL";

    await page.route(
      /\/api\/v1\/organizations\/org-univ-1\/facilities\?buildingId=bld-tech-1.*$/,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "fac-lift-42",
                venueId: "ven-1",
                buildingId: "bld-tech-1",
                floorId: "fl-2",
                floorName: "Level 2",
                nodeId: "node-42",
                facilityType: "ELEVATOR",
                name: "West Tower Passenger Lift",
                operationalStatus: currentStatus,
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

    await page.route(/\/api\/v1\/facilities\/fac-lift-42\/status$/, async (route) => {
      currentStatus = "OUT_OF_SERVICE";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "fac-lift-42",
          operational_status: "OUT_OF_SERVICE",
          verification_level: "CONFIRMED",
          last_verified_at: new Date().toISOString(),
          graphVersion: 4,
        }),
      });
    });

    await page.goto("/organization/buildings");
    await expect(page.getByText("Technology Center")).toBeVisible();

    await page.getByRole("link", { name: "Manage Facilities" }).click();
    await expect(page.getByRole("heading", { name: "Facility Status & Controls" })).toBeVisible();
    await expect(page.getByText("West Tower Passenger Lift", { exact: true })).toBeVisible();

    const selectStatus = page.locator("#status-fac-lift-42");
    await selectStatus.selectOption("OUT_OF_SERVICE");

    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.getByText("Saved")).toBeVisible();
  });

  test("Restricts access for non-organization admin users", async ({ page }) => {
    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-user-token",
          user: {
            id: "user-norm-1",
            email: "user@example.com",
            name: "Normal User",
            role: "USER",
            createdAt: new Date().toISOString(),
            organizationMemberships: [],
            preferences: null,
          },
        }),
      });
    });

    await page.goto("/organization");

    await expect(page.getByRole("heading", { name: "Access Restricted" })).toBeVisible();
    await expect(
      page.getByText(/This area is reserved for organization administrators/),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Explore" })).toBeVisible();
  });
});
