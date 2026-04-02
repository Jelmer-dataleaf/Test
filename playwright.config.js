// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  // Directory where Playwright looks for test files
  testDir: "./tests",

  // Maximum time one test can run
  timeout: 30_000,

  // Reporter to use when running tests
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],

  use: {
    // Base URL used by page.goto('/') calls — Angular dev server default
    baseURL: process.env.BASE_URL || "http://localhost:4200",

    // Collect trace on first retry
    trace: "on-first-retry",

    // Take a screenshot on failure
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  // Uncomment to start your dev server automatically before running tests:
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
