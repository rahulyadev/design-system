import { expect, test } from "@playwright/test";

import {
  attachEvidence,
  expectNoHorizontalOverflow,
  gotoHydratedPreview,
  monitorClient,
  seedThemePreference,
} from "./helpers.js";

const viewports = [
  { height: 800, width: 320 },
  { height: 1024, width: 768 },
  { height: 768, width: 1024 },
  { height: 1000, width: 1440 },
] as const;

for (const viewport of viewports) {
  test(`responsive layout ${String(viewport.width)}x${String(viewport.height)}`, async ({
    page,
  }, testInfo) => {
    const monitor = await monitorClient(page);
    await page.setViewportSize(viewport);
    await seedThemePreference(page, "system");
    await gotoHydratedPreview(page);
    await expectNoHorizontalOverflow(page);

    const layout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const cards = [...document.querySelectorAll<HTMLElement>(".ui-card")].map(
        (card) => {
          const rectangle = card.getBoundingClientRect();
          return {
            left: rectangle.left,
            right: rectangle.right,
            width: rectangle.width,
          };
        },
      );
      const controls = [
        ...document.querySelectorAll<HTMLElement>(
          ".ui-button, .ui-icon-button, .ui-theme-toggle__option",
        ),
      ].map((control) => {
        const rectangle = control.getBoundingClientRect();
        return { height: rectangle.height, width: rectangle.width };
      });
      const fullToggleElement = document.querySelector<HTMLElement>(
        '.ui-theme-toggle[data-presentation="full"]',
      );
      const longTextElement =
        document.querySelector<HTMLElement>(".preview-long-text");
      if (!fullToggleElement || !longTextElement) {
        throw new Error("Responsive fixtures are missing.");
      }
      const fullToggle = fullToggleElement.getBoundingClientRect();
      const longText = longTextElement.getBoundingClientRect();
      return {
        cards,
        controls,
        fullToggle: { left: fullToggle.left, right: fullToggle.right },
        longText: { left: longText.left, right: longText.right },
        viewportWidth,
      };
    });
    for (const card of layout.cards) {
      expect(card.left).toBeGreaterThanOrEqual(-1);
      expect(card.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect(card.width).toBeGreaterThan(0);
    }
    for (const control of layout.controls) {
      expect(control.height).toBeGreaterThanOrEqual(44);
      expect(control.width).toBeGreaterThanOrEqual(44);
    }
    expect(layout.fullToggle.left).toBeGreaterThanOrEqual(-1);
    expect(layout.fullToggle.right).toBeLessThanOrEqual(
      layout.viewportWidth + 1,
    );
    expect(layout.longText.left).toBeGreaterThanOrEqual(-1);
    expect(layout.longText.right).toBeLessThanOrEqual(layout.viewportWidth + 1);

    const compactSystem = page
      .getByRole("radiogroup", { name: "Compact theme preference" })
      .getByRole("radio", { name: "System" });
    await compactSystem.focus();
    await page.keyboard.press("ArrowLeft");
    const tooltipId = await page
      .getByRole("radiogroup", { name: "Compact theme preference" })
      .getByRole("radio", { name: "Dark" })
      .getAttribute("aria-describedby");
    expect(tooltipId).not.toBeNull();
    if (tooltipId === null) {
      throw new Error("Responsive tooltip association is missing.");
    }
    const tooltipRectangle = await page
      .locator(`#${tooltipId}`)
      .evaluate((element) => {
        const rectangle = element.getBoundingClientRect();
        return { left: rectangle.left, right: rectangle.right };
      });
    expect(tooltipRectangle.right).toBeGreaterThan(0);
    expect(tooltipRectangle.left).toBeLessThan(layout.viewportWidth);

    const activationButton = page.getByTestId("activation-button");
    await activationButton.scrollIntoViewIfNeeded();
    await activationButton.focus();
    await expect(activationButton).toBeInViewport();
    const focusBox = await activationButton.evaluate((element) => {
      const rectangle = element.getBoundingClientRect();
      const outline = Number.parseFloat(getComputedStyle(element).outlineWidth);
      return {
        bottom: rectangle.bottom + outline,
        left: rectangle.left - outline,
        right: rectangle.right + outline,
        top: rectangle.top - outline,
      };
    });
    expect(focusBox.left).toBeGreaterThanOrEqual(-1);
    expect(focusBox.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(focusBox.bottom).toBeGreaterThan(0);
    expect(focusBox.top).toBeLessThan(viewport.height);
    await monitor.assertClean();
    await attachEvidence(
      testInfo,
      `responsive-${String(viewport.width)}`,
      layout,
    );
  });
}

for (const width of [320, 1440] as const) {
  test(`200 percent text proxy at ${String(width)}px`, async ({
    page,
  }, testInfo) => {
    const monitor = await monitorClient(page);
    await page.setViewportSize({ height: width === 320 ? 800 : 1000, width });
    await seedThemePreference(page, "system");
    await gotoHydratedPreview(page);
    await page.locator("html").evaluate((element) => {
      element.dataset["textScale"] = "200";
    });
    await expect(page.locator("html")).toHaveCSS("font-size", "32px");
    await expectNoHorizontalOverflow(page);

    const evidence = await page.evaluate(() => {
      const fullLabels = [
        ...document.querySelectorAll<HTMLElement>(
          '.ui-theme-toggle[data-presentation="full"] .ui-theme-toggle__label',
        ),
      ];
      const longText =
        document.querySelector<HTMLElement>(".preview-long-text");
      const h1 = document.querySelector("h1");
      const target = document.querySelector("#preview-target");
      if (!longText || !h1 || !target) {
        throw new Error("Text scaling fixtures are missing.");
      }
      return {
        compactHasAriaLabels: [
          ...document.querySelectorAll(
            '.ui-theme-toggle[data-presentation="compact"] [role="radio"]',
          ),
        ].every((element) => Boolean(element.getAttribute("aria-label"))),
        contentOrder: Boolean(
          h1.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
        fullLabelsVisible: fullLabels.every(
          (element) => getComputedStyle(element).display !== "none",
        ),
        fullLabelsContained: fullLabels.every((element) => {
          const label = element.getBoundingClientRect();
          const control = element.parentElement?.getBoundingClientRect();
          return Boolean(
            control &&
            label.left >= control.left - 1 &&
            label.right <= control.right + 1,
          );
        }),
        longTextClipped: longText.scrollHeight > longText.clientHeight + 1,
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
      };
    });
    expect(evidence.compactHasAriaLabels).toBe(true);
    expect(evidence.contentOrder).toBe(true);
    expect(evidence.fullLabelsContained).toBe(true);
    expect(evidence.fullLabelsVisible).toBe(true);
    expect(evidence.longTextClipped).toBe(false);

    const activationButton = page.getByTestId("activation-button");
    await activationButton.focus();
    await expect(activationButton).toBeInViewport();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("activation-output")).toHaveAttribute(
      "data-button-count",
      "1",
    );
    await monitor.assertClean();
    await attachEvidence(testInfo, `text-proxy-${String(width)}`, evidence);
  });
}

test("JavaScript-disabled preview remains understandable and native", async ({
  browser,
}) => {
  const context = await browser.newContext({
    colorScheme: "dark",
    javaScriptEnabled: false,
    viewport: { height: 800, width: 320 },
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const remoteRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== "http://127.0.0.1:4179"
    ) {
      remoteRequests.push(request.url());
    }
  });

  try {
    const response = await page.goto("/", { waitUntil: "load" });
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Reusable interface primitives",
      }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-javascript",
      "disabled",
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    await expect(page.locator("#root")).not.toHaveAttribute(
      "data-hydrated",
      "true",
    );
    await expectNoHorizontalOverflow(page);
    const noJavaScriptEvidence = await page.evaluate(() => ({
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      stylesheetCount: document.styleSheets.length,
      themeControlCount: document.querySelectorAll(".ui-theme-toggle").length,
    }));
    expect(noJavaScriptEvidence.backgroundColor).toBe("rgb(20, 23, 25)");
    expect(noJavaScriptEvidence.colorScheme).toBe("dark");
    expect(noJavaScriptEvidence.stylesheetCount).toBe(1);
    expect(noJavaScriptEvidence.themeControlCount).toBe(2);
    await expect(page.getByTestId("activation-button")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Disabled" })).toBeDisabled();
    await page.getByTestId("activation-link").click();
    await expect(page).toHaveURL(/#preview-target$/);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(remoteRequests).toEqual([]);
  } finally {
    await context.close();
  }
});
