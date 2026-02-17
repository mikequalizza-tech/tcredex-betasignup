import { test, expect } from "./fixtures";

/**
 * Navigation E2E Tests
 *
 * Tests that key navigation elements work for authenticated users.
 */

test.describe("Navigation", () => {
  test("sponsor sees nav sidebar with key links", async ({ sponsorPage }) => {
    await sponsorPage.goto("/dashboard");

    if (sponsorPage.url().includes("/onboarding")) {
      test.skip();
      return;
    }

    // Check for common nav links
    const nav = sponsorPage.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test("map page loads for authenticated user", async ({ sponsorPage }) => {
    await sponsorPage.goto("/map");

    if (sponsorPage.url().includes("/onboarding")) {
      test.skip();
      return;
    }

    // Map page should load without crashing
    await expect(sponsorPage).toHaveURL(/\/map/, { timeout: 15_000 });
    await expect(sponsorPage.locator("body")).not.toHaveText(
      "Internal Server Error",
    );
  });

  test("intake page accessible for sponsor", async ({ sponsorPage }) => {
    await sponsorPage.goto("/intake");

    if (sponsorPage.url().includes("/onboarding")) {
      test.skip();
      return;
    }

    await expect(sponsorPage).toHaveURL(/\/intake/, { timeout: 15_000 });
    await expect(sponsorPage.locator("body")).not.toHaveText("500");
  });
});
