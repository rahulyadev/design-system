import { runInNewContext } from "node:vm";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_THEME_STORAGE_KEY,
  createThemeBootstrapScript,
} from "../../src/theme/index.js";

interface BootstrapWindow {
  readonly localStorage: Pick<Storage, "getItem">;
  matchMedia?: (query: string) => { matches: boolean };
}

function executeBootstrap(script: string, scriptWindow: BootstrapWindow): void {
  runInNewContext(script, { document, window: scriptWindow });
}

function createWindow(
  storedValue: string | null,
  systemPrefersDark: boolean,
  expectedStorageKey = DEFAULT_THEME_STORAGE_KEY,
): BootstrapWindow {
  return {
    localStorage: {
      getItem(key: string) {
        expect(key).toBe(expectedStorageKey);
        return storedValue;
      },
    },
    matchMedia(query: string) {
      expect(query).toBe("(prefers-color-scheme: dark)");
      return { matches: systemPrefersDark };
    },
  };
}

afterEach(() => {
  delete document.documentElement.dataset["theme"];
  delete document.documentElement.dataset["themePreference"];
  delete document.documentElement.dataset["javascript"];
  document.documentElement.style.colorScheme = "";
  vi.restoreAllMocks();
});

describe("theme bootstrap script", () => {
  it.each([
    ["light", false, "light"],
    ["dark", false, "dark"],
    ["system", false, "light"],
    ["system", true, "dark"],
  ] as const)(
    "applies stored %s with system-dark=%s as %s",
    (preference, systemPrefersDark, expectedTheme) => {
      executeBootstrap(
        createThemeBootstrapScript(),
        createWindow(preference, systemPrefersDark),
      );

      expect(document.documentElement).toHaveAttribute(
        "data-theme-preference",
        preference,
      );
      expect(document.documentElement).toHaveAttribute(
        "data-theme",
        expectedTheme,
      );
      expect(document.documentElement).toHaveAttribute(
        "data-javascript",
        "enabled",
      );
      expect(document.documentElement.style.colorScheme).toBe(expectedTheme);
    },
  );

  it("falls back from an invalid preference to system", () => {
    executeBootstrap(createThemeBootstrapScript(), createWindow("sepia", true));

    expect(document.documentElement).toHaveAttribute(
      "data-theme-preference",
      "system",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("falls back safely when storage is unavailable", () => {
    const scriptWindow = {
      get localStorage(): Pick<Storage, "getItem"> {
        throw new Error("blocked");
      },
      matchMedia() {
        return { matches: false };
      },
    };

    expect(() => {
      executeBootstrap(createThemeBootstrapScript(), scriptWindow);
    }).not.toThrow();
    expect(document.documentElement).toHaveAttribute(
      "data-theme-preference",
      "system",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("uses light when matchMedia is unavailable", () => {
    const scriptWindow: BootstrapWindow = {
      localStorage: {
        getItem() {
          return "system";
        },
      },
    };

    expect(() => {
      executeBootstrap(createThemeBootstrapScript(), scriptWindow);
    }).not.toThrow();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("uses a custom storage key and keeps the default domain-neutral", () => {
    const customKey = "consumer-theme-preference";

    executeBootstrap(
      createThemeBootstrapScript({ storageKey: customKey }),
      createWindow("dark", false, customKey),
    );

    expect(DEFAULT_THEME_STORAGE_KEY).toBe("design-system-theme-preference");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("is deterministic, self-invoking, and self-contained", () => {
    const first = createThemeBootstrapScript({ storageKey: "one" });
    const second = createThemeBootstrapScript({ storageKey: "one" });
    const different = createThemeBootstrapScript({ storageKey: "two" });

    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first).toMatch(/^\(function\(\)\{/);
    expect(first).toMatch(/\}\)\(\);$/);
    expect(first).toContain("document.documentElement");
    expect(() => {
      executeBootstrap(first, createWindow(null, false, "one"));
    }).not.toThrow();
  });

  it("safely escapes inline-script-sensitive storage keys", () => {
    const hostileKey = "key</script>\u2028next\u2029end";
    const script = createThemeBootstrapScript({ storageKey: hostileKey });

    expect(script).not.toContain("<");
    expect(script).not.toContain("</script>");
    expect(script).not.toContain("\u2028");
    expect(script).not.toContain("\u2029");
    expect(script).toContain("\\u003c/script>");
    expect(script).toContain("\\u2028");
    expect(script).toContain("\\u2029");

    executeBootstrap(script, createWindow("dark", false, hostileKey));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("does not use dynamic code construction or the portfolio key", () => {
    const script = createThemeBootstrapScript();
    const sourcePortfolioKey = ["rahuly", "theme", "preference"].join("-");

    expect(script).not.toMatch(/\beval\b/);
    expect(script).not.toContain("new Function");
    expect(script).not.toContain(sourcePortfolioKey);
  });
});
