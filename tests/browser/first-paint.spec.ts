import { expect, test } from "@playwright/test";

import {
  PREVIEW_STORAGE_KEY,
  attachEvidence,
  seedThemePreference,
} from "./helpers.js";

interface FirstPaintWindow extends Window {
  __firstPaintCspViolations?: string[];
}

const cases = [
  {
    name: "stored light plus system dark",
    stored: "light",
    system: "dark",
    preference: "light",
    effective: "light",
  },
  {
    name: "stored dark plus system light",
    stored: "dark",
    system: "light",
    preference: "dark",
    effective: "dark",
  },
  {
    name: "stored system plus system dark",
    stored: "system",
    system: "dark",
    preference: "system",
    effective: "dark",
  },
  {
    name: "stored system plus system light",
    stored: "system",
    system: "light",
    preference: "system",
    effective: "light",
  },
  {
    name: "invalid stored value",
    stored: "not-a-theme",
    system: "dark",
    preference: "system",
    effective: "dark",
  },
  {
    name: "no stored value",
    stored: null,
    system: "light",
    preference: "system",
    effective: "light",
  },
] as const;

for (const scenario of cases) {
  test(`first paint: ${scenario.name}`, async ({ page }, testInfo) => {
    const cspConsoleErrors: string[] = [];
    await page.addInitScript(() => {
      const monitoredWindow = window as FirstPaintWindow;
      monitoredWindow.__firstPaintCspViolations = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        monitoredWindow.__firstPaintCspViolations?.push(
          `${event.violatedDirective}: ${event.blockedURI}`,
        );
      });
    });
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /content security policy|csp/i.test(message.text())
      ) {
        cspConsoleErrors.push(message.text());
      }
    });
    await page.emulateMedia({ colorScheme: scenario.system });
    await seedThemePreference(page, scenario.stored);
    await page.route(/\.js(?:\?|$)/, async (route) => {
      await route.abort("blockedbyclient");
    });

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
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
      scenario.preference,
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      scenario.effective,
    );
    await expect(page.locator("#root")).not.toHaveAttribute(
      "data-hydrated",
      "true",
    );

    const evidence = await page.evaluate((storageKey) => {
      const bootstrap = document.querySelector(
        'script[data-testid="theme-bootstrap"]',
      );
      const firstStylesheet = document.querySelector('link[rel="stylesheet"]');
      const bodyStyle = getComputedStyle(document.body);
      const rootStyle = getComputedStyle(document.documentElement);
      const monitoredWindow = window as FirstPaintWindow;

      return {
        backgroundColor: bodyStyle.backgroundColor,
        bootstrapBeforeStylesheet:
          bootstrap !== null &&
          firstStylesheet !== null &&
          Boolean(
            bootstrap.compareDocumentPosition(firstStylesheet) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        color: bodyStyle.color,
        colorScheme: rootStyle.colorScheme,
        cspViolations: monitoredWindow.__firstPaintCspViolations ?? [],
        stylesheetCount: document.styleSheets.length,
        storedValue: window.localStorage.getItem(storageKey),
      };
    }, PREVIEW_STORAGE_KEY);
    expect(evidence.bootstrapBeforeStylesheet).toBe(true);
    expect(evidence.stylesheetCount).toBe(1);
    expect(evidence.colorScheme).toBe(scenario.effective);
    expect(evidence.backgroundColor).toBe(
      scenario.effective === "dark" ? "rgb(20, 23, 25)" : "rgb(246, 243, 238)",
    );
    expect(evidence.color).toBe(
      scenario.effective === "dark" ? "rgb(222, 219, 212)" : "rgb(52, 58, 64)",
    );
    expect(evidence.cspViolations).toEqual([]);
    expect(cspConsoleErrors).toEqual([]);
    expect(response?.headers()["content-security-policy"]).toContain(
      "'nonce-design-system-preview-nonce'",
    );
    await attachEvidence(testInfo, `first-paint-${scenario.name}`, evidence);
  });
}
