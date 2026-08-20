import { expect, test } from "@playwright/test";

import {
  attachEvidence,
  gotoHydratedPreview,
  monitorClient,
  seedThemePreference,
} from "./helpers.js";

test("skip link is first, visible on focus, and focuses main", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to preview content" });
  await expect(skipLink).toBeFocused();
  await expect
    .poll(async () => (await skipLink.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(0);
  const focusedStyle = await skipLink.evaluate((element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      top: rectangle.top,
      transform: style.transform,
    };
  });
  expect(focusedStyle.top).toBeGreaterThanOrEqual(0);
  expect(focusedStyle.transform).not.toContain("-180");
  expect(focusedStyle.outlineStyle).toBe("solid");
  expect(focusedStyle.outlineWidth).toBeGreaterThanOrEqual(3);

  await page.keyboard.press("Enter");
  await expect(page.locator("#preview-main")).toBeFocused();
  await monitor.assertClean();
});

test("every keyboard-reachable control has visible focus treatment", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  const expectedFocusOrder = await page.evaluate(() => {
    const candidates = [
      ...document.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => element.tabIndex >= 0);
    return candidates.map((element, index) => {
      const id = `focus-${String(index)}`;
      element.dataset["focusOrder"] = id;
      return id;
    });
  });
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  const actualFocusOrder: string[] = [];
  for (const expectedId of expectedFocusOrder) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const style = getComputedStyle(element);
      return {
        id: element.dataset["focusOrder"],
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    actualFocusOrder.push(focused.id ?? "missing");
    expect(focused.id).toBe(expectedId);
    expect(focused.outlineStyle).toBe("solid");
    expect(focused.outlineWidth).toBeGreaterThanOrEqual(3);
  }
  expect(actualFocusOrder).toEqual(expectedFocusOrder);
  await monitor.assertClean();
});

test("button, link, and icon button retain native keyboard behavior", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  const button = page.getByTestId("activation-button");
  await button.focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("activation-output")).toHaveAttribute(
    "data-button-count",
    "1",
  );

  const iconButton = page.getByTestId("activation-icon-button");
  await iconButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("activation-output")).toHaveAttribute(
    "data-icon-count",
    "1",
  );

  const link = page.getByTestId("activation-link");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#preview-target$/);
  await expect(page.getByTestId("preview-target")).toBeInViewport();
  await monitor.assertClean();
});

test("theme radiogroup implements synchronized roving keyboard selection", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);
  const group = page.getByRole("radiogroup", { name: "Full theme preference" });

  await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(1);
  const system = group.getByRole("radio", { name: "System" });
  await system.focus();

  const keyCases = [
    ["ArrowRight", "Light"],
    ["ArrowLeft", "System"],
    ["ArrowUp", "Dark"],
    ["ArrowDown", "System"],
    ["Home", "Light"],
    ["End", "System"],
  ] as const;

  for (const [key, selectedName] of keyCases) {
    await page.keyboard.press(key);
    const selected = group.getByRole("radio", { name: selectedName });
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute("aria-checked", "true");
    await expect(selected).toHaveAttribute("tabindex", "0");
    await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(1);
  }
  await monitor.assertClean();
});

test("compact theme tooltip is keyboard-visible and described", async ({
  page,
}) => {
  const monitor = await monitorClient(page);
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const compactSystem = page
    .getByRole("radiogroup", { name: "Compact theme preference" })
    .getByRole("radio", { name: "System" });
  await expect(compactSystem).toBeFocused();
  const describedBy = await compactSystem.getAttribute("aria-describedby");
  expect(describedBy).not.toBeNull();
  if (describedBy === null) {
    throw new Error("Compact theme option is missing aria-describedby.");
  }
  const tooltip = page.locator(`#${describedBy}`);
  await expect(tooltip).toHaveRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS("visibility", "visible");
  await expect(tooltip).toHaveCSS("opacity", "1");
  await monitor.assertClean();
});

test("interactive package controls retain at least 44 CSS pixels", async ({
  page,
}, testInfo) => {
  const monitor = await monitorClient(page);
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  const dimensions = await page
    .locator(".ui-button, .ui-icon-button, .ui-theme-toggle__option")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rectangle = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute("aria-label") ?? element.textContent.trim(),
          height: rectangle.height,
          width: rectangle.width,
        };
      }),
    );
  for (const dimension of dimensions) {
    expect(
      dimension.height,
      `${dimension.label} height`,
    ).toBeGreaterThanOrEqual(44);
    expect(dimension.width, `${dimension.label} width`).toBeGreaterThanOrEqual(
      44,
    );
  }
  await monitor.assertClean();
  await attachEvidence(testInfo, "control-dimensions", dimensions);
});

test("reduced motion collapses token durations while controls remain usable", async ({
  page,
}, testInfo) => {
  const monitor = await monitorClient(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  const motion = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const buttonElement = document.querySelector<HTMLElement>(
      '[data-testid="activation-button"]',
    );
    const skipLinkElement =
      document.querySelector<HTMLElement>(".ui-skip-link");
    if (!buttonElement || !skipLinkElement) {
      throw new Error("Reduced-motion controls are missing.");
    }
    const button = getComputedStyle(buttonElement);
    const skipLink = getComputedStyle(skipLinkElement);
    return {
      fastToken: root.getPropertyValue("--motion-duration-fast").trim(),
      standardToken: root.getPropertyValue("--motion-duration-standard").trim(),
      buttonTransitions: button.transitionDuration,
      skipLinkTransitions: skipLink.transitionDuration,
    };
  });
  for (const token of [motion.fastToken, motion.standardToken]) {
    expect(token.endsWith("ms")).toBe(true);
    expect(Number.parseFloat(token)).toBe(0.01);
  }
  for (const duration of [
    motion.buttonTransitions,
    motion.skipLinkTransitions,
  ]) {
    for (const seconds of duration.split(",").map(Number.parseFloat)) {
      expect(seconds).toBeLessThanOrEqual(0.000_01);
    }
  }

  await page.getByTestId("activation-button").click();
  await expect(page.getByTestId("activation-output")).toHaveAttribute(
    "data-button-count",
    "1",
  );
  await page
    .getByRole("radiogroup", { name: "Full theme preference" })
    .getByRole("radio", { name: "Dark" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await monitor.assertClean();
  await attachEvidence(testInfo, "reduced-motion", motion);
});

test("forced colors preserve selection, focus, tooltip, and control boundaries", async ({
  browserName,
  page,
}, testInfo) => {
  test.skip(
    browserName !== "chromium",
    "Forced colors is exercised in Chromium.",
  );
  const monitor = await monitorClient(page);
  await page.emulateMedia({ forcedColors: "active" });
  await seedThemePreference(page, "system");
  await gotoHydratedPreview(page);

  const group = page.getByRole("radiogroup", { name: "Full theme preference" });
  const selected = group.getByRole("radio", { name: "System" });
  const unselected = group.getByRole("radio", { name: "Light" });
  const unfocused = await Promise.all([
    selected.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderColor: style.borderColor,
        borderStyle: style.borderStyle,
        borderWidth: style.borderWidth,
      };
    }),
    unselected.evaluate((element) => getComputedStyle(element).borderColor),
  ]);
  expect(unfocused[0].borderStyle).toBe("solid");
  expect(Number.parseFloat(unfocused[0].borderWidth)).toBeGreaterThanOrEqual(2);
  expect(unfocused[0].borderColor).not.toBe(unfocused[1]);

  await selected.focus();
  await page.keyboard.press("ArrowRight");
  const focused = group.getByRole("radio", { name: "Light" });
  const focusStyle = await focused.evaluate((element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return {
      borderColor: style.borderColor,
      height: rectangle.height,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      width: rectangle.width,
    };
  });
  expect(focusStyle.outlineStyle).toBe("solid");
  expect(focusStyle.outlineColor).not.toBe(focusStyle.borderColor);
  expect(focusStyle.height).toBeGreaterThanOrEqual(44);
  expect(focusStyle.width).toBeGreaterThanOrEqual(44);

  const compact = page.getByRole("radiogroup", {
    name: "Compact theme preference",
  });
  const compactLight = compact.getByRole("radio", { name: "Light" });
  await compactLight.focus();
  await page.keyboard.press("ArrowRight");
  const compactDark = compact.getByRole("radio", { name: "Dark" });
  const tooltipId = await compactDark.getAttribute("aria-describedby");
  expect(tooltipId).not.toBeNull();
  if (tooltipId === null) {
    throw new Error("Forced-colors tooltip association is missing.");
  }
  const tooltip = page.locator(`#${tooltipId}`);
  await expect(tooltip).toBeVisible();
  const tooltipStyle = await tooltip.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      color: style.color,
    };
  });
  expect(tooltipStyle.backgroundColor).not.toBe(tooltipStyle.color);
  expect(tooltipStyle.borderColor).toBe(tooltipStyle.color);
  await monitor.assertClean();
  await attachEvidence(testInfo, "forced-colors", {
    focusStyle,
    tooltipStyle,
    unfocused,
  });
});
