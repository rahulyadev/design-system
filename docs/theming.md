# Theming

Theme preferences are `light`, `dark`, and `system`. The default storage key is `design-system-theme-preference`; consumers may supply a custom key.

## First paint and provider

`createThemeBootstrapScript()` returns deterministic, self-invoking JavaScript for an inline script in the document head. Place it before theme-consuming stylesheets. Place `ThemeProvider` around the React application. If a custom storage key is used, pass the same key to both the bootstrap generator and provider.

```tsx
import {
  ThemeProvider,
  ThemeToggle,
  createThemeBootstrapScript,
} from "@rahulyadev/design-system/theme";

const storageKey = "product-theme-preference";
const bootstrapScript = createThemeBootstrapScript({ storageKey });

export function Application({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey={storageKey}>
      <ThemeToggle />
      {children}
    </ThemeProvider>
  );
}
```

The consumer is responsible for rendering `bootstrapScript` as an inline head script before the stylesheet. The consumer also owns any CSP nonce or hash. The package generates stable script text but does not generate CSP headers or nonces. It uses no remote script, `eval`, or `new Function`.

## Root contract

The bootstrap and provider maintain:

- `data-javascript="enabled"`
- `data-theme-preference="light|dark|system"`
- `data-theme="light|dark"`
- the root `color-scheme` style

CSS supplies a no-JavaScript system-color fallback. When storage cannot be read or written, the runtime falls back safely and continues to operate. System mode reacts to operating-system theme changes, and the provider reacts to matching cross-tab storage events.

## Server rendering

Public modules do not access DOM or browser storage during module evaluation. The provider uses a stable `system:light` server snapshot. The head bootstrap performs client first-paint selection; this phase does not claim browser hydration or no-flash equivalence.

Framework-specific hydration suppression, when required, should be applied narrowly by the consumer and must not conceal unrelated mismatches.

A later portfolio migration must pass its existing source storage key explicitly to both integration points so existing visitor preferences remain available.
