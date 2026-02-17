import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * Run: pnpm e2e        (headless)
 * Run: pnpm e2e:ui     (interactive UI)
 * Run: pnpm e2e:debug  (headed with inspector)
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",

  /* Maximum time one test can run */
  timeout: 30_000,

  /* Shared settings for all tests */
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  /* Run tests sequentially — they share auth state */
  fullyParallel: false,
  workers: 1,

  /* Retry once on failure */
  retries: 1,

  /* Reporter */
  reporter: [["html", { open: "never" }], ["list"]],

  /* Browser config */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Start dev server before running tests (only if not already running) */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
