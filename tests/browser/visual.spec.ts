import { expect, test } from "@playwright/test";

import {
  gotoHydratedPreview,
  monitorClient,
  seedThemePreference,
} from "./helpers.js";

const visualCases = [
  {
    name: "1440-light.png",
    preference: "light",
    system: "dark",
    viewport: { height: 1000, width: 1440 },
  },
  {
    name: "1440-dark.png",
    preference: "dark",
    system: "light",
    viewport: { height: 1000, width: 1440 },
  },
  {
    name: "768-system.png",
    preference: "system",
    system: "dark",
    viewport: { height: 1024, width: 768 },
  },
  {
    name: "320-light.png",
    preference: "light",
    system: "dark",
    viewport: { height: 800, width: 320 },
  },
  {
    name: "320-dark.png",
    preference: "dark",
    system: "light",
    viewport: { height: 800, width: 320 },
  },
  {
    name: "320-text-200.png",
    preference: "light",
    system: "dark",
    textScale: true,
    viewport: { height: 800, width: 320 },
  },
] as const;

for (const scenario of visualCases) {
  test(`@visual ${scenario.name}`, async ({ page }) => {
    const monitor = await monitorClient(page);
    await page.setViewportSize(scenario.viewport);
    await page.emulateMedia({ colorScheme: scenario.system });
    await seedThemePreference(page, scenario.preference);
    await gotoHydratedPreview(page);
    if ("textScale" in scenario) {
      await page.locator("html").evaluate((element) => {
        element.dataset["textScale"] = "200";
      });
      await expect(page.locator("html")).toHaveCSS("font-size", "32px");
    }
    await page.evaluate(async () => document.fonts.ready);
    await monitor.assertClean();
    await expect(page).toHaveScreenshot(scenario.name, {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      scale: "css",
    });
  });
}
