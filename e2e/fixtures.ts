import { test as base, expect, type Page } from "@playwright/test";

/**
 * E2E Test Fixtures
 *
 * Provides reusable auth helpers and page utilities.
 * Test users must exist in Supabase — create them via the dashboard
 * or seed script before running E2E tests.
 *
 * Required env vars (set in .env.test or shell):
 *   E2E_SPONSOR_EMAIL / E2E_SPONSOR_PASSWORD
 *   E2E_CDE_EMAIL / E2E_CDE_PASSWORD
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 */

// ---------------------------------------------------------------------------
// Test user credentials (from env)
// ---------------------------------------------------------------------------
export const TEST_USERS = {
  sponsor: {
    email: process.env.E2E_SPONSOR_EMAIL || "e2e-sponsor@tcredex.test",
    password: process.env.E2E_SPONSOR_PASSWORD || "TestPassword123!",
  },
  cde: {
    email: process.env.E2E_CDE_EMAIL || "e2e-cde@tcredex.test",
    password: process.env.E2E_CDE_PASSWORD || "TestPassword123!",
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || "e2e-admin@tcredex.test",
    password: process.env.E2E_ADMIN_PASSWORD || "TestPassword123!",
  },
};

// ---------------------------------------------------------------------------
// Auth helper — signs in via the UI and returns the page
// ---------------------------------------------------------------------------
async function signIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/signin");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Your password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect away from /signin
  await expect(page).not.toHaveURL(/\/signin/);
}

// ---------------------------------------------------------------------------
// Extended test fixture with per-role authenticated pages
// ---------------------------------------------------------------------------
type AuthFixtures = {
  sponsorPage: Page;
  cdePage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  sponsorPage: async ({ page }, use) => {
    await signIn(page, TEST_USERS.sponsor.email, TEST_USERS.sponsor.password);
    await use(page);
  },
  cdePage: async ({ page }, use) => {
    await signIn(page, TEST_USERS.cde.email, TEST_USERS.cde.password);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await signIn(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await use(page);
  },
});

export { expect };
