import { test, expect } from "@playwright/test";

test.describe("Public Launch Pages", () => {
  test("All public pages return 200 without authentication", async ({ page }) => {
    const publicPaths = ["/", "/about", "/accessibility", "/privacy", "/terms", "/contact"];

    for (const path of publicPaths) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);

      const htmlLang = await page.getAttribute("html", "lang");
      expect(htmlLang).toBe("en");

      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
    }
  });

  test("Landing page links to explore and register", async ({ page }) => {
    await page.goto("/");

    const exploreLink = page.getByRole("link", { name: /Explore Venues/i }).first();
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute("href", "/explore");

    const registerLink = page.getByRole("link", { name: /Create Free Account/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("Non-existent URL returns 404 with a link back home", async ({ page }) => {
    const response = await page.goto("/does-not-exist-route");
    expect(response?.status()).toBe(404);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Page Not Found");

    const homeLink = page.getByRole("link", { name: /Return to Home/i });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");
  });

  test("Contact form submits successfully and displays message without revealing storage details", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/feedback/, async (route) => {
      const postData = route.request().postDataJSON() as { message: string; category?: string };
      expect(postData.message).toContain("Handrail missing");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Thank you for your feedback. Our team has received your message.",
        }),
      });
    });

    await page.goto("/contact");
    await page.selectOption("#feedback-category", "ACCESSIBILITY");
    await page.fill("#feedback-message", "Handrail missing on science quad western entrance ramp.");
    await page.getByRole("button", { name: /Send Feedback/i }).click();

    const statusBanner = page.locator("#feedback-success-banner");
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Feedback Received");
    await expect(statusBanner).toContainText(
      "Thank you for your feedback. Our team has received your message.",
    );

    const bannerText = await statusBanner.innerText();
    expect(bannerText).not.toContain("id");
    expect(bannerText).not.toContain("feedback_pkey");
    expect(bannerText).not.toContain("table");
    expect(bannerText).not.toContain("database");
  });

  test("Contact form honeypot submission causes silent rejection and shows success without revealing storage", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/feedback/, async (route) => {
      const postData = route.request().postDataJSON() as { honeypot?: string };
      expect(postData.honeypot).toBe("https://spambot-payload.org");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Thank you for your feedback.",
        }),
      });
    });

    await page.goto("/contact");
    await page.fill("#feedback-message", "Buy cheap products spam text payload here.");
    await page.locator("#website-field").fill("https://spambot-payload.org");
    await page.getByRole("button", { name: /Send Feedback/i }).click();

    const statusBanner = page.locator("#feedback-success-banner");
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Feedback Received");

    const bannerText = await statusBanner.innerText();
    expect(bannerText).not.toContain("id");
    expect(bannerText).not.toContain("database");
    expect(bannerText).not.toContain("postgres");
  });
});
