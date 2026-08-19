import {
  expect,
  type Page,
  type Request,
  type TestInfo,
} from "@playwright/test";

export const PREVIEW_STORAGE_KEY = "design-system-preview-theme-preference";

interface ClientMonitor {
  assertClean: () => Promise<void>;
  consoleErrors: string[];
  failedRequests: string[];
  pageErrors: string[];
  remoteRequests: string[];
}

interface MonitorWindow extends Window {
  __previewCspViolations?: string[];
}

function requestIsRemote(request: Request) {
  const url = new URL(request.url());
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    url.origin !== "http://127.0.0.1:4179"
  );
}

export async function monitorClient(page: Page): Promise<ClientMonitor> {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const pageErrors: string[] = [];
  const remoteRequests: string[] = [];

  await page.addInitScript(() => {
    const monitoredWindow = window as MonitorWindow;
    monitoredWindow.__previewCspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      monitoredWindow.__previewCspViolations?.push(
        `${event.violatedDirective}: ${event.blockedURI}`,
      );
    });
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("request", (request) => {
    if (requestIsRemote(request)) {
      remoteRequests.push(request.url());
    }
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "unknown"}`,
    );
  });

  return {
    assertClean: async () => {
      const cspViolations = await page.evaluate(() => {
        return (window as MonitorWindow).__previewCspViolations ?? [];
      });
      expect(consoleErrors, "console errors").toEqual([]);
      expect(pageErrors, "page errors").toEqual([]);
      expect(failedRequests, "failed requests").toEqual([]);
      expect(remoteRequests, "remote requests").toEqual([]);
      expect(cspViolations, "CSP violations").toEqual([]);
    },
    consoleErrors,
    failedRequests,
    pageErrors,
    remoteRequests,
  };
}

export async function seedThemePreference(
  page: Page,
  preference: string | null,
) {
  await page.addInitScript(
    ({ storageKey, storedPreference }) => {
      if (storedPreference === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, storedPreference);
      }
    },
    { storageKey: PREVIEW_STORAGE_KEY, storedPreference: preference },
  );
}

export async function gotoHydratedPreview(page: Page) {
  const response = await page.goto("/", { waitUntil: "load" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("#root")).toHaveAttribute("data-hydrated", "true");
  return response;
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

export async function attachEvidence(
  testInfo: TestInfo,
  name: string,
  evidence: unknown,
) {
  await testInfo.attach(name, {
    body: Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`),
    contentType: "application/json",
  });
}
