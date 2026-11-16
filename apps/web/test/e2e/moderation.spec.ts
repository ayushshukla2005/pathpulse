import { expect, test } from "@playwright/test";

test.describe("Moderator Review Workflow (e2e)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "mock-e2e-mod-token",
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

  test("Displays report details, duplicate suggestions, audit log, and allowed actions", async ({
    page,
  }) => {
    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-access-token",
          user: {
            id: "mod-1",
            email: "moderator@pathpulse.local",
            name: "Test Moderator",
            role: "MODERATOR",
            createdAt: new Date().toISOString(),
            preferences: null,
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/reports\/rep-100$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep-100",
          tracking_code: "REP-20261108-TEST",
          user_id: "user-reporter-9",
          venue_id: "v-1",
          facility_id: null,
          category: "BROKEN_LIFT",
          title: "East wing lift broken",
          description: "Elevator buttons unresponsive on all floors",
          status: "UNDER_REVIEW",
          latitude: 12.9716,
          longitude: 77.5946,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          evidence: [
            {
              id: "ev-1",
              report_id: "rep-100",
              object_key: "evidence/rep-100/photo.jpg",
              content_type: "image/jpeg",
              size_bytes: 45000,
              status: "RECEIVED",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          venue: { id: "v-1", name: "Engineering Block A" },
          facility: null,
        }),
      });
    });

    await page.route(/\/api\/v1\/reports\/rep-100\/workflow-summary$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep-100",
          trackingCode: "REP-20261108-TEST",
          status: "UNDER_REVIEW",
          category: "BROKEN_LIFT",
          reopenCount: 0,
          assignedToUserId: null,
          verifiedByUserId: null,
          resolvedAt: null,
          allowedActions: [
            {
              action: "VERIFY",
              label: "Verify Barrier",
              targetStatus: "VERIFIED",
            },
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

    await page.route(/\/api\/v1\/reports\/rep-100\/audit$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "aud-1",
            actorUserId: "mod-1",
            actorName: "Test Moderator",
            action: "REVIEW",
            fromStatus: "SUBMITTED",
            toStatus: "UNDER_REVIEW",
            reason: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.route(/\/api\/v1\/reports\/rep-100\/duplicates$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            candidateId: "rep-dup-1",
            trackingCode: "REP-20261108-DUP1",
            title: "East wing elevator out of order",
            similarity: 0.88,
            status: "SUBMITTED",
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.goto("/moderation/reports/rep-100");

    await expect(page.locator("h1")).toContainText("Review Report: REP-20261108-TEST");
    await expect(page.getByText("East wing lift broken")).toBeVisible();
    await expect(page.getByText("88% match")).toBeVisible();
    await expect(page.getByText("REP-20261108-DUP1")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Test Moderator" })).toBeVisible();

    const verifyBtn = page.getByRole("button", { name: "Verify Barrier" });
    const rejectBtn = page.getByRole("button", { name: "Reject Report" });

    await expect(verifyBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();

    await rejectBtn.click();
    await expect(page.getByLabel("Reason for action")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm REJECT" })).toBeVisible();
  });

  test("Restricts non-moderator from moderation review page", async ({ page }) => {
    await page.route(/\/api\/auth\/session$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          accessToken: "mock-access-token",
          user: {
            id: "user-reg-1",
            email: "user@pathpulse.local",
            name: "Standard User",
            role: "USER",
            createdAt: new Date().toISOString(),
            preferences: null,
          },
        }),
      });
    });

    await page.goto("/moderation/reports/rep-100");
    await expect(page.locator("h1")).toContainText("Access Restricted");
  });
});
