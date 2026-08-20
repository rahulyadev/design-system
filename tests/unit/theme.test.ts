import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME_STORAGE_KEY,
  applyThemeToRoot,
  getEffectiveTheme,
  parseThemePreference,
  persistThemePreference,
  readThemePreference,
} from "../../src/theme/index.js";

function createMemoryStorage(
  expectedKey: string,
  initialValue: string | null = null,
) {
  let value = initialValue;

  return {
    getItem(key: string) {
      expect(key).toBe(expectedKey);
      return value;
    },
    setItem(key: string, nextValue: string) {
      expect(key).toBe(expectedKey);
      value = nextValue;
    },
    value() {
      return value;
    },
  };
}

describe("theme preferences", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["system", "system"],
    ["sepia", "system"],
    [null, "system"],
    [undefined, "system"],
  ] as const)("parses %s as %s", (input, expected) => {
    expect(parseThemePreference(input)).toBe(expected);
  });

  it("uses the domain-neutral default storage key", () => {
    expect(DEFAULT_THEME_STORAGE_KEY).toBe("design-system-theme-preference");
    const storage = createMemoryStorage(DEFAULT_THEME_STORAGE_KEY, "dark");

    expect(readThemePreference(storage)).toBe("dark");
    expect(persistThemePreference(storage, "light")).toBe(true);
    expect(storage.value()).toBe("light");
  });

  it("reads and persists with a configurable storage key", () => {
    const storageKey = "consumer-theme";
    const storage = createMemoryStorage(storageKey, "light");

    expect(readThemePreference(storage, storageKey)).toBe("light");
    expect(persistThemePreference(storage, "dark", storageKey)).toBe(true);
    expect(storage.value()).toBe("dark");
  });

  it("falls back safely when storage is unavailable", () => {
    const inaccessibleStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };

    expect(readThemePreference(undefined)).toBe("system");
    expect(readThemePreference(inaccessibleStorage)).toBe("system");
    expect(persistThemePreference(undefined, "dark")).toBe(false);
    expect(persistThemePreference(inaccessibleStorage, "dark")).toBe(false);
  });

  it("resolves system preference without changing explicit modes", () => {
    expect(getEffectiveTheme("system", false)).toBe("light");
    expect(getEffectiveTheme("system", true)).toBe("dark");
    expect(getEffectiveTheme("light", true)).toBe("light");
    expect(getEffectiveTheme("dark", false)).toBe("dark");
  });

  it("applies root data attributes and color-scheme", () => {
    applyThemeToRoot(document.documentElement, "system", "dark");

    expect(document.documentElement).toHaveAttribute(
      "data-theme-preference",
      "system",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
