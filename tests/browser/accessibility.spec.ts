import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  gotoHydratedPreview,
  monitorClient,
  seedThemePreference,
} from "./helpers.js";

const axeScenarios = [
  { name: "light desktop", preference: "light", system: "dark", width: 1280 },
  { name: "dark desktop", preference: "dark", system: "light", width: 1280 },
  { name: "system desktop", preference: "system", system: "dark", width: 1280 },
  { name: "system 320px", preference: "system", system: "light", width: 320 },
] as const;

for (const scenario of axeScenarios) {
  test(`axe: ${scenario.name}`, async ({ page }) => {
    const monitor = await monitorClient(page);
    await page.setViewportSize({ height: 900, width: scenario.width });
    await page.emulateMedia({ colorScheme: scenario.system });
    await seedThemePreference(page, scenario.preference);
    await gotoHydratedPreview(page);
    await expect(
      page.getByRole("radiogroup", { name: "Full theme preference" }),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Compact theme preference" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await monitor.assertClean();
  });
}
