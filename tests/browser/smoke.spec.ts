import { expect, test } from "@playwright/test";

import {
  attachEvidence,
  gotoHydratedPreview,
  monitorClient,
  seedThemePreference,
} from "./helpers.js";

test("packed preview hydrates under its CSP with local assets", async ({
  browser,
  page,
}, testInfo) => {
  const monitor = await monitorClient(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await seedThemePreference(page, "system");
  const response = await gotoHydratedPreview(page);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Reusable interface primitives",
    }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-javascript",
    "enabled",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme-preference",
    "system",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page
      .getByRole("radiogroup", { name: "Full theme preference" })
      .getByRole("radio", { name: "System" }),
  ).toHaveAttribute("aria-checked", "true");

  const csp = response?.headers()["content-security-policy"];
  expect(csp).toContain(
    "script-src 'self' 'nonce-design-system-preview-nonce'",
  );
  expect(csp).toContain("style-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-inline");
  const bootstrapNonce = await page
    .locator('script[data-testid="theme-bootstrap"]')
    .evaluate((element) => (element as HTMLScriptElement).nonce);
  expect(bootstrapNonce).toBe("design-system-preview-nonce");

  const evidence = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const displayElement = document.querySelector<HTMLElement>(
      '[data-testid="display-font-sample"]',
    );
    if (!displayElement) {
      throw new Error("Display font sample is missing.");
    }
    const display = getComputedStyle(displayElement);
    const stylesheets = [...document.styleSheets].map((sheet) => sheet.href);

    return {
      bodyBackground: body.backgroundColor,
      bodyColor: body.color,
      bodyFontFamily: body.fontFamily,
      browserColorScheme: getComputedStyle(document.documentElement)
        .colorScheme,
      displayFontFamily: display.fontFamily,
      stylesheets,
    };
  });
  expect(evidence.bodyBackground).toBe("rgb(20, 23, 25)");
  expect(evidence.bodyColor).toBe("rgb(222, 219, 212)");
  expect(evidence.browserColorScheme).toBe("dark");
  expect(evidence.bodyFontFamily).toContain("Preview Body Override");
  expect(evidence.displayFontFamily).toContain("Preview Display Override");
  expect(evidence.stylesheets).toHaveLength(1);
  expect(evidence.stylesheets[0]).toMatch(
    /^http:\/\/127\.0\.0\.1:4179\/assets\/.*\.css$/,
  );

  await monitor.assertClean();
  await attachEvidence(testInfo, "packed-preview-smoke", {
    browserVersion: browser.version(),
    bootstrapNonce,
    csp,
    ...evidence,
  });
});

test("stored preference reconciles without a hydration mismatch", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await page.emulateMedia({ colorScheme: "light" });
  await seedThemePreference(page, "dark");
  await gotoHydratedPreview(page);

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme-preference",
    "dark",
  );
  await expect(page.getByTestId("theme-preference-output")).toHaveText("dark");
  await expect(page.getByTestId("effective-theme-output")).toHaveText("dark");
  await expect(
    page
      .getByRole("radiogroup", { name: "Full theme preference" })
      .getByRole("radio", { name: "Dark" }),
  ).toHaveAttribute("aria-checked", "true");

  expect(
    monitor.consoleErrors.some((message) =>
      /hydration|did not match/i.test(message),
    ),
  ).toBe(false);
  await monitor.assertClean();
});

test("system and cross-tab changes update the hydrated provider", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await page.emulateMedia({ colorScheme: "light" });
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("effective-theme-output")).toHaveText("dark");

  await page.evaluate(() => {
    const key = "design-system-preview-theme-preference";
    window.localStorage.setItem(key, "light");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: "light",
        oldValue: "system",
        storageArea: window.localStorage,
      }),
    );
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme-preference",
    "light",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("theme-preference-output")).toHaveText("light");
  await monitor.assertClean();
});
