import { DEFAULT_THEME_STORAGE_KEY } from "./core.js";

export interface ThemeBootstrapOptions {
  storageKey?: string;
}

function serializeInlineScriptValue(value: string): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function createThemeBootstrapScript(
  options?: ThemeBootstrapOptions,
): string {
  const storageKey = serializeInlineScriptValue(
    options?.storageKey ?? DEFAULT_THEME_STORAGE_KEY,
  );

  return `(function(){const storageKey=${storageKey};const root=document.documentElement;root.dataset["javascript"]="enabled";let preference="system";try{const storedPreference=window.localStorage.getItem(storageKey);if(storedPreference==="light"||storedPreference==="dark"||storedPreference==="system"){preference=storedPreference;}}catch{}let systemPrefersDark=false;try{if(typeof window.matchMedia==="function"){systemPrefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;}}catch{}const effectiveTheme=preference==="system"?(systemPrefersDark?"dark":"light"):preference;root.dataset["themePreference"]=preference;root.dataset["theme"]=effectiveTheme;root.style.colorScheme=effectiveTheme;})();`;
}
