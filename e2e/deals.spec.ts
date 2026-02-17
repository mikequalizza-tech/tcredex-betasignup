import { test, expect } from "./fixtures";

/**
 * Deals E2E Tests
 *
 * Tests deal listing and detail page access for authenticated users.
 */

test.describe("Deals", () => {
  test("sponsor can access deals list", async ({ sponsorPage }) => {
    await sponsorPage.goto("/deals");

    // Should either show deals or onboarding redirect
    const url = sponsorPage.url();
    if (url.includes("/onboarding")) {
      // User hasn't completed onboarding — that's OK for this test
      test.skip();
      return;
    }

    await expect(sponsorPage).toHaveURL(/\/deals/, { timeout: 15_000 });

    // Should have some content (not a blank error page)
    await expect(sponsorPage.locator("body")).not.toHaveText("500");
    await expect(sponsorPage.locator("body")).not.toHaveText(
      "Internal Server Error",
    );
  });

  test("CDE can access deals marketplace", async ({ cdePage }) => {
    await cdePage.goto("/deals");

    const url = cdePage.url();
    if (url.includes("/onboarding")) {
      test.skip();
      return;
    }

    await expect(cdePage).toHaveURL(/\/deals/, { timeout: 15_000 });
    await expect(cdePage.locator("body")).not.toHaveText("500");
  });

  test("deals page shows loading or content within 10s", async ({
    sponsorPage,
  }) => {
    await sponsorPage.goto("/deals");

    if (sponsorPage.url().includes("/onboarding")) {
      test.skip();
      return;
    }

    // Wait for either deal cards or an "empty" message to appear
    await expect(
      sponsorPage
        .getByText(/no deals/i)
        .or(sponsorPage.locator("[data-testid='deal-card']"))
        .or(sponsorPage.getByRole("heading").first()),
    ).toBeVisible({ timeout: 10_000 });
  });
});
