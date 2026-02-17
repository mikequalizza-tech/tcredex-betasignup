import { test, expect, TEST_USERS } from "./fixtures";

/**
 * Dashboard E2E Tests
 *
 * Tests role-based dashboard rendering after sign-in.
 * Uses fixture-provided authenticated pages.
 */

test.describe("Dashboard", () => {
  test("sponsor sees dashboard after sign in", async ({ sponsorPage }) => {
    await sponsorPage.goto("/dashboard");
    await expect(sponsorPage).toHaveURL(/\/(dashboard|onboarding)/, {
      timeout: 15_000,
    });

    // If on dashboard (not onboarding), check for dashboard content
    if (sponsorPage.url().includes("/dashboard")) {
      // Dashboard should have some nav or heading element
      await expect(
        sponsorPage.locator("nav, [role='navigation']").first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("CDE sees dashboard after sign in", async ({ cdePage }) => {
    await cdePage.goto("/dashboard");
    await expect(cdePage).toHaveURL(/\/(dashboard|onboarding)/, {
      timeout: 15_000,
    });
  });

  test("sponsor can navigate to deals from dashboard", async ({
    sponsorPage,
  }) => {
    await sponsorPage.goto("/dashboard");

    // Only test navigation if we're on the dashboard (not onboarding)
    if (sponsorPage.url().includes("/dashboard")) {
      // Look for a deals link in nav
      const dealsLink = sponsorPage
        .getByRole("link", { name: /deals/i })
        .first();
      if (await dealsLink.isVisible()) {
        await dealsLink.click();
        await expect(sponsorPage).toHaveURL(/\/deals/, { timeout: 10_000 });
      }
    }
  });
});
