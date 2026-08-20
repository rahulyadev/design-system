import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_THEME_STORAGE_KEY,
  SYSTEM_THEME_QUERY,
  ThemeProvider,
  ThemeToggle,
  useTheme,
} from "../../src/theme/index.js";

interface MatchMediaController {
  setMatches: (matches: boolean) => void;
}

function installMatchMedia(initialMatches: boolean): MatchMediaController {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: SYSTEM_THEME_QUERY,
    onchange: null,
    addEventListener(
      event: string,
      listener: (event: MediaQueryListEvent) => void,
    ) {
      if (event === "change") {
        listeners.add(listener);
      }
    },
    removeEventListener(
      event: string,
      listener: (event: MediaQueryListEvent) => void,
    ) {
      if (event === "change") {
        listeners.delete(listener);
      }
    },
  } as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => {
      expect(query).toBe(SYSTEM_THEME_QUERY);
      return mediaQuery;
    }),
  );

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      listeners.forEach((listener) => {
        listener(event);
      });
    },
  };
}

function ThemeProbe() {
  const { effectiveTheme, preference } = useTheme();

  return <output>{`${preference}:${effectiveTheme}`}</output>;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  delete document.documentElement.dataset["theme"];
  delete document.documentElement.dataset["themePreference"];
  document.documentElement.style.colorScheme = "";
});

describe("ThemeProvider and ThemeToggle", () => {
  it("exposes one checked radio and persists pointer selection", async () => {
    installMatchMedia(false);
    window.localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, "dark");
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Theme preference" }),
    ).toHaveAttribute("data-presentation", "full");
    const dark = await screen.findByRole("radio", { name: "Dark" });
    const light = screen.getByRole("radio", { name: "Light" });

    await waitFor(() => {
      expect(dark).toHaveAttribute("aria-checked", "true");
    });
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    expect(dark).toHaveAttribute("tabindex", "0");
    expect(light).toHaveAttribute("tabindex", "-1");
    expect(screen.queryAllByRole("tooltip")).toHaveLength(0);

    await user.click(light);

    expect(light).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem(DEFAULT_THEME_STORAGE_KEY)).toBe(
      "light",
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("supports Arrow, Home, and End keys with roving focus", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const system = await screen.findByRole("radio", { name: "System" });
    const light = screen.getByRole("radio", { name: "Light" });
    const dark = screen.getByRole("radio", { name: "Dark" });

    system.focus();
    await user.keyboard("{ArrowRight}");
    expect(light).toHaveFocus();
    expect(light).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{End}");
    expect(system).toHaveFocus();
    await user.keyboard("{Home}");
    expect(light).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(system).toHaveFocus();

    system.focus();
    await user.keyboard("{ArrowUp}");
    expect(dark).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(system).toHaveFocus();
  });

  it("associates compact controls with accessible tooltips", async () => {
    installMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeToggle aria-label="Compact theme" presentation="compact" />
      </ThemeProvider>,
    );

    const group = screen.getByRole("radiogroup", { name: "Compact theme" });
    expect(group).toHaveAttribute("data-presentation", "compact");

    for (const name of ["Light", "Dark", "System"]) {
      const radio = await screen.findByRole("radio", { name });
      const tooltipId = radio.getAttribute("aria-describedby");
      expect(tooltipId).toBeTruthy();
      expect(radio).not.toHaveAttribute("title");
      expect(document.getElementById(tooltipId ?? "")).toHaveAttribute(
        "role",
        "tooltip",
      );
      expect(document.getElementById(tooltipId ?? "")).toHaveTextContent(name);
    }
  });

  it("tracks operating-system changes while system mode is selected", async () => {
    const matchMedia = installMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(await screen.findByText("system:light")).toBeVisible();

    act(() => {
      matchMedia.setMatches(true);
    });

    expect(await screen.findByText("system:dark")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("responds only to cross-tab changes for the configured key", async () => {
    installMatchMedia(false);
    const storageKey = "consumer-cross-tab-theme";

    render(
      <ThemeProvider storageKey={storageKey}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(await screen.findByText("system:light")).toBeVisible();

    act(() => {
      window.localStorage.setItem(storageKey, "dark");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: storageKey,
          newValue: "dark",
          storageArea: window.localStorage,
        }),
      );
    });
    expect(await screen.findByText("dark:dark")).toBeVisible();

    act(() => {
      window.localStorage.setItem(storageKey, "light");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "unrelated-key",
          newValue: "light",
          storageArea: window.localStorage,
        }),
      );
    });
    expect(screen.getByText("dark:dark")).toBeVisible();
  });

  it("persists with a provider-specific custom key", async () => {
    installMatchMedia(false);
    const storageKey = "consumer-custom-theme";
    const user = userEvent.setup();

    render(
      <ThemeProvider storageKey={storageKey}>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(await screen.findByRole("radio", { name: "Dark" }));
    expect(window.localStorage.getItem(storageKey)).toBe("dark");
    expect(window.localStorage.getItem(DEFAULT_THEME_STORAGE_KEY)).toBeNull();
  });

  it("remains safe when browser storage is blocked", async () => {
    installMatchMedia(false);
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(await screen.findByRole("radio", { name: "Light" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("throws when useTheme is called outside the provider", () => {
    expect(() => render(<ThemeProbe />)).toThrow(
      "useTheme must be used within a ThemeProvider.",
    );
  });
});
