import { defineConfig } from "@playwright/test";

const focusedCrossEngineTests =
  /(?:accessibility|interaction|responsive|smoke)\.spec\.ts/;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: true,
  fullyParallel: false,
  outputDir: "test-results/artifacts",
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "firefox",
      testMatch: focusedCrossEngineTests,
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      testMatch: focusedCrossEngineTests,
      use: { browserName: "webkit" },
    },
  ],
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder:
          process.env["PLAYWRIGHT_HTML_DIR"] ?? "playwright-report/default",
      },
    ],
    [
      "json",
      {
        outputFile:
          process.env["PLAYWRIGHT_RESULT_FILE"] ??
          "test-results/playwright-results.json",
      },
    ],
  ],
  retries: 0,
  snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{ext}",
  testDir: "./tests/browser",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4179",
    colorScheme: "light",
    locale: "en-US",
    screenshot: "only-on-failure",
    timezoneId: "UTC",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    viewport: { height: 900, width: 1280 },
  },
  webServer: {
    command: "npm run preview:serve",
    reuseExistingServer: false,
    timeout: 30_000,
    url: "http://127.0.0.1:4179",
  },
  workers: process.env["CI"] ? 1 : 2,
});
