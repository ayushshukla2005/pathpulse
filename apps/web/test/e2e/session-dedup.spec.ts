import { expect, test } from "@playwright/test";

test.describe("Session Refresh Deduplication", () => {
  test("Loads /profile with exactly one session request and stays logged in on reload", async ({
    page,
  }) => {
    await page.goto("/register");

    const uniqueEmail = `dedup_live_${Date.now()}@pathpulse.local`;
    await page.fill("#register-name", "Dedup Browser User");
    await page.fill("#register-email", uniqueEmail);
    await page.fill("#register-password", "StrongPass123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator("h1")).toContainText("Account & Mobility Preferences");
    await expect(page.locator("body")).toContainText("Dedup Browser User");

    let reloadSessionRequests = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/session")) {
        reloadSessionRequests++;
      }
    });

    await page.reload();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator("h1")).toContainText("Account & Mobility Preferences");
    await expect(page.locator("body")).toContainText("Dedup Browser User");
    await expect(page.locator("body")).toContainText(uniqueEmail);

    expect(reloadSessionRequests).toBe(1);
  });
});
