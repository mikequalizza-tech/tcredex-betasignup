import { test, expect } from "@playwright/test";
import { TEST_USERS } from "./fixtures";

/**
 * Authentication E2E Tests
 *
 * Tests the core auth flows that gate all protected routes.
 * These run against a live dev server with real Supabase auth.
 */

test.describe("Authentication", () => {
  // =========================================================================
  // Sign In
  // =========================================================================
  test.describe("Sign In", () => {
    test("renders sign-in page with email and password fields", async ({
      page,
    }) => {
      await page.goto("/signin");

      await expect(
        page.getByRole("heading", { name: /sign in to tcredex/i }),
      ).toBeVisible();
      await expect(
        page.getByPlaceholder("you@example.com"),
      ).toBeVisible();
      await expect(
        page.getByPlaceholder("Your password"),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign In" }),
      ).toBeVisible();
    });

    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto("/signin");
      await page.getByPlaceholder("you@example.com").fill("bad@example.com");
      await page.getByPlaceholder("Your password").fill("wrongpassword");
      await page.getByRole("button", { name: "Sign In" }).click();

      // Supabase returns "Invalid login credentials"
      await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 10_000 });
    });

    test("signs in sponsor and redirects to dashboard", async ({ page }) => {
      await page.goto("/signin");
      await page
        .getByPlaceholder("you@example.com")
        .fill(TEST_USERS.sponsor.email);
      await page
        .getByPlaceholder("Your password")
        .fill(TEST_USERS.sponsor.password);
      await page.getByRole("button", { name: "Sign In" }).click();

      // Should redirect to /dashboard (or /onboarding if not onboarded)
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/, {
        timeout: 15_000,
      });
    });

    test("has link to sign up page", async ({ page }) => {
      await page.goto("/signin");
      const signUpLink = page.getByRole("link", { name: /sign up/i });
      await expect(signUpLink).toBeVisible();
      await signUpLink.click();
      await expect(page).toHaveURL(/\/signup/);
    });

    test("has magic link toggle", async ({ page }) => {
      await page.goto("/signin");
      const magicLinkButton = page.getByText(
        /sign in with magic link/i,
      );
      await expect(magicLinkButton).toBeVisible();
      await magicLinkButton.click();

      // Password field should disappear, button text should change
      await expect(page.getByPlaceholder("Your password")).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: /send magic link/i }),
      ).toBeVisible();
    });
  });

  // =========================================================================
  // Protected Routes
  // =========================================================================
  test.describe("Protected Routes", () => {
    test("redirects unauthenticated user from /dashboard to /signin", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/signin\?redirect=/, {
        timeout: 10_000,
      });
    });

    test("redirects unauthenticated user from /deals to /signin", async ({
      page,
    }) => {
      await page.goto("/deals");
      await expect(page).toHaveURL(/\/signin\?redirect=/, {
        timeout: 10_000,
      });
    });

    test("redirects unauthenticated user from /map to /signin", async ({
      page,
    }) => {
      await page.goto("/map");
      await expect(page).toHaveURL(/\/signin\?redirect=/, {
        timeout: 10_000,
      });
    });

    test("redirects unauthenticated user from /intake to /signin", async ({
      page,
    }) => {
      await page.goto("/intake");
      await expect(page).toHaveURL(/\/signin\?redirect=/, {
        timeout: 10_000,
      });
    });

    test("preserves redirect param after sign in", async ({ page }) => {
      // Visit protected route → get redirected → sign in → land on original page
      await page.goto("/deals");
      await expect(page).toHaveURL(/\/signin\?redirect=%2Fdeals/, {
        timeout: 10_000,
      });

      // Sign in
      await page
        .getByPlaceholder("you@example.com")
        .fill(TEST_USERS.sponsor.email);
      await page
        .getByPlaceholder("Your password")
        .fill(TEST_USERS.sponsor.password);
      await page.getByRole("button", { name: "Sign In" }).click();

      // Should land on /deals (or /onboarding if not onboarded)
      await expect(page).toHaveURL(/\/(deals|onboarding)/, {
        timeout: 15_000,
      });
    });
  });

  // =========================================================================
  // Public Routes
  // =========================================================================
  test.describe("Public Routes", () => {
    test("homepage loads without auth", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL("/");
      // Check for basic page content (not redirected)
      await expect(page.locator("body")).not.toContainText("Sign in to tCredex");
    });

    test("pricing page loads without auth", async ({ page }) => {
      await page.goto("/pricing");
      await expect(page).toHaveURL("/pricing");
    });

    test("contact page loads without auth", async ({ page }) => {
      await page.goto("/contact");
      await expect(page).toHaveURL("/contact");
    });
  });

  // =========================================================================
  // Sign Up Page Structure
  // =========================================================================
  test.describe("Sign Up", () => {
    test("renders step 1 — org type selection", async ({ page }) => {
      await page.goto("/signup");

      // Should show org type options
      await expect(page.getByText(/sponsor/i).first()).toBeVisible();
      await expect(page.getByText(/cde/i).first()).toBeVisible();
      await expect(page.getByText(/investor/i).first()).toBeVisible();
    });

    test("advances to step 2 after selecting org type", async ({ page }) => {
      await page.goto("/signup");

      // Click Sponsor card
      await page.getByText(/sponsor/i).first().click();

      // Step 2 should show account fields
      await expect(page.getByText(/continue/i).first()).toBeVisible();
      await page.getByText(/continue/i).first().click();

      // Now should see account creation form fields
      await expect(
        page.getByPlaceholder(/organization/i).or(page.locator('input[name="orgName"]')),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  // =========================================================================
  // Claim Code Page Structure
  // =========================================================================
  test.describe("Claim Code", () => {
    test("renders claim code entry page", async ({ page }) => {
      await page.goto("/claim");

      // Should show code entry field
      await expect(
        page.getByPlaceholder(/XXXX/i).or(page.getByRole("textbox")),
      ).toBeVisible();
    });
  });
});
