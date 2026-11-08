import { expect, test } from "@playwright/test";

test.describe("Community Reporting and Evidence Upload", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-test-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("Submit a report with one photo through the UI and see tracking code and SUBMITTED status", async ({
    page,
  }) => {
    let reportCreated = false;
    let evidenceCreated = false;
    let storageUploadDone = false;
    let evidenceCompleted = false;

    await page.route(/\/api\/v1\/venues(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "venue-library",
            name: "Main Campus Library",
            category: "CAMPUS",
            facilities: [
              {
                id: "fac-lift-1",
                name: "North Tower Lift",
                facility_type: "ELEVATOR",
              },
            ],
          },
        ]),
      });
    });

    await page.route(/\/api\/v1\/reports$/, async (route) => {
      if (route.request().method() === "POST") {
        reportCreated = true;
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "report-uuid-12345",
            tracking_code: "PP-2026-LIBLIFT",
            user_id: "user-alpha",
            venue_id: postData.venueId,
            facility_id: postData.facilityId || null,
            category: postData.category,
            title: null,
            description: postData.description,
            status: "SUBMITTED",
            latitude: postData.latitude || null,
            longitude: postData.longitude || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            evidence: [],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(/\/api\/v1\/reports\/report-uuid-12345\/evidence$/, async (route) => {
      evidenceCreated = true;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          evidenceId: "evidence-uuid-67890",
          uploadUrl: "http://localhost:3000/mock-storage/evidence-uuid-67890.jpg",
          expiresInSeconds: 900,
        }),
      });
    });

    await page.route("http://localhost:3000/mock-storage/**", async (route) => {
      storageUploadDone = true;
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "OK",
      });
    });

    await page.route(/\/api\/v1\/evidence\/evidence-uuid-67890\/complete$/, async (route) => {
      evidenceCompleted = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          evidenceId: "evidence-uuid-67890",
          status: "RECEIVED",
          verified: true,
        }),
      });
    });

    await page.goto("/reports/new");

    await expect(page.locator("h1")).toContainText("Report an Accessibility Barrier");

    await page.selectOption("#venue-select", "venue-library");

    await page.fill(
      "#report-description",
      "The primary elevator in the North Tower has a broken door sensor and will not close.",
    );

    const testFileBuffer = Buffer.from(
      "mock-binary-jpeg-data-exceeding-1kb-threshold-for-test-purposes-".repeat(30),
    );
    await page.setInputFiles("#photo-input", {
      name: "broken-door-sensor.jpg",
      mimeType: "image/jpeg",
      buffer: testFileBuffer,
    });

    await expect(page.getByText("broken-door-sensor.jpg")).toBeVisible();

    await page.click('button[type="submit"]');

    await expect(page.getByText("Report Submitted Successfully")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#tracking-code-display")).toHaveText("PP-2026-LIBLIFT");
    await expect(page.getByText("Submitted", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Your report has been received and is queued for verification."),
    ).toBeVisible();

    expect(reportCreated).toBe(true);
    expect(evidenceCreated).toBe(true);
    expect(storageUploadDone).toBe(true);
    expect(evidenceCompleted).toBe(true);
  });

  test("The report appears in My reports for the same user and not for another user", async ({
    page,
    browser,
  }) => {
    const reportItem = {
      id: "report-user-a",
      tracking_code: "PP-2026-USERA1",
      user_id: "user-a",
      venue_id: "venue-library",
      facility_id: null,
      category: "BROKEN_LIFT",
      title: null,
      description: "North tower lift broken.",
      status: "SUBMITTED",
      latitude: null,
      longitude: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      evidence: [
        {
          id: "ev-1",
          report_id: "report-user-a",
          content_type: "image/jpeg",
          size_bytes: 4096,
          status: "RECEIVED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      venue: { id: "venue-library", name: "Main Campus Library" },
      facility: null,
    };

    await page.route(/\/api\/v1\/reports\/mine(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [reportItem],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      });
    });

    await page.goto("/reports");
    await expect(page.locator("h1")).toContainText("My Barrier Reports");
    await expect(page.getByText("PP-2026-USERA1")).toBeVisible();
    await expect(page.getByText("Broken lift or elevator")).toBeVisible();
    await expect(page.getByText("Status: Submitted")).toBeVisible();

    const userBContext = await browser.newContext();
    await userBContext.addCookies([
      {
        name: "pp_refresh",
        value: "e2e-test-token-user-b",
        domain: "localhost",
        path: "/",
      },
    ]);

    const pageB = await userBContext.newPage();

    await pageB.route(/\/api\/v1\/reports\/mine(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        }),
      });
    });

    await pageB.route(/\/api\/v1\/reports\/report-user-a$/, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 404,
          error: "Not Found",
          message: 'Report "report-user-a" not found',
        }),
      });
    });

    await pageB.goto("/reports");
    await expect(pageB.locator("h1")).toContainText("My Barrier Reports");
    await expect(pageB.getByText("No Reports Yet")).toBeVisible();
    await expect(pageB.getByText("PP-2026-USERA1")).not.toBeVisible();

    await pageB.goto("/reports/report-user-a");
    await expect(pageB.getByText("Report Not Found")).toBeVisible();

    await userBContext.close();
  });
});
