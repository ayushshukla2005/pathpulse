import { test, expect } from "@playwright/test";

test.describe("Authentication and Route Protection", () => {
  test("Unauthenticated visit to /profile redirects to /login?next=/profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?next=(%2Fprofile|\/profile)/);
    await expect(page.locator("h2")).toContainText("Sign in to PathPulse");
  });

  test("Log in with wrong credentials shows the generic error", async ({ page }) => {
    await page.route("/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 401,
          error: "Unauthorized",
          message: "Invalid email or password.",
        }),
      });
    });

    await page.goto("/login");
    await page.fill("#login-email", "nonexistent@pathpulse.local");
    await page.fill("#login-password", "InvalidPassword123!");
    await page.click('button[type="submit"]');

    const alert = page.locator("#login-error-summary");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/invalid email or password/i);
  });

  test("Register, then land on the protected area", async ({ page, context }) => {
    const uniqueEmail = `testuser_${Date.now()}@pathpulse.local`;

    await page.route("/api/auth/register", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-test-1",
            email: uniqueEmail,
            name: "Accessible Navigator",
            role: "USER",
            preferences: null,
          },
          accessToken: "mock-jwt-access-token",
        }),
      });
    });

    await page.route("/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          user: {
            id: "user-test-1",
            email: uniqueEmail,
            name: "Accessible Navigator",
            role: "USER",
            preferences: {
              mobility_profile: "DEFAULT",
              avoid_stairs: false,
              prefer_voice_guidance: false,
              high_contrast: false,
              text_scale: 1.0,
            },
          },
          accessToken: "mock-jwt-access-token",
        }),
      });
    });

    await page.goto("/register");
    await page.fill("#register-name", "Accessible Navigator");
    await page.fill("#register-email", uniqueEmail);
    await page.fill("#register-password", "StrongPassw0rd123!");

    await context.addCookies([
      {
        name: "pp_refresh",
        value: "mock-e2e-refresh-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator("h1")).toContainText("Account & Mobility Preferences");
    await expect(page.locator("body")).toContainText("Accessible Navigator");
    await expect(page.locator("body")).toContainText(uniqueEmail);
  });

  test("Log out clears access and returns to the marketing page", async ({ page, context }) => {
    const uniqueEmail = `logoutuser_${Date.now()}@pathpulse.local`;

    await page.route("/api/auth/register", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-logout-1",
            email: uniqueEmail,
            name: "Logout Tester",
            role: "USER",
            preferences: null,
          },
          accessToken: "mock-jwt-access-token",
        }),
      });
    });

    await page.route("/api/auth/session", async (route) => {
      const cookies = await context.cookies();
      const hasToken = cookies.some((c) => c.name === "pp_refresh" && c.value);
      if (hasToken) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            authenticated: true,
            user: {
              id: "user-logout-1",
              email: uniqueEmail,
              name: "Logout Tester",
              role: "USER",
              preferences: null,
            },
            accessToken: "mock-jwt-access-token",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            authenticated: false,
            user: null,
            accessToken: null,
          }),
        });
      }
    });

    await page.route("/api/auth/logout", async (route) => {
      await context.clearCookies();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await context.addCookies([
      {
        name: "pp_refresh",
        value: "mock-e2e-refresh-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);

    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL("/");

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?next=(%2Fprofile|\/profile)/);
  });

  test("Keyboard-only navigation reaches the login form", async ({ page }) => {
    await page.goto("/login");

    await page.keyboard.press("Tab");
    const activeText = await page.evaluate(() => document.activeElement?.textContent);
    expect(activeText).toContain("Skip to main content");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    let isInputFocused = false;
    for (let i = 0; i < 6; i++) {
      const activeId = await page.evaluate(() => document.activeElement?.id);
      if (activeId === "login-email") {
        isInputFocused = true;
        break;
      }
      await page.keyboard.press("Tab");
    }

    expect(isInputFocused).toBe(true);

    await page.keyboard.press("Tab");
    const passId = await page.evaluate(() => document.activeElement?.id);
    expect(passId).toBe("login-password");
  });
});
