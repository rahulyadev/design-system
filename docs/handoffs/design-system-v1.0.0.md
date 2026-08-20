# Design-system 1.0.0 handoff

## Package

- Package: `@rahulyadev/design-system`
- Version: `1.0.0`
- Registry: `https://registry.npmjs.org/`
- License: MIT
- Module format: ESM only
- Runtime dependencies: none
- Rollback package version: `1.0.0-rc.0`

Install the stable package exactly:

```sh
npm install --save-exact @rahulyadev/design-system@1.0.0
```

React and React DOM remain peer dependencies with ranges `^18.3.1 || ^19.0.0`. Verified packed consumers use React and React DOM `18.3.1` and `19.2.8`, TypeScript `6.0.3`, Vite `8.2.1`, Node.js `24.19.0`, and npm `11.17.0`.

## Public exports

- `@rahulyadev/design-system`
- `@rahulyadev/design-system/theme`
- `@rahulyadev/design-system/tokens.css`
- `@rahulyadev/design-system/base.css`
- `@rahulyadev/design-system/primitives.css`
- `@rahulyadev/design-system/styles.css`
- `@rahulyadev/design-system/package.json`

Component deep imports and internal helpers are not public.

## CSS contract

Import `styles.css` alone, or import the separate files in this exact order:

```ts
import "@rahulyadev/design-system/tokens.css";
import "@rahulyadev/design-system/base.css";
import "@rahulyadev/design-system/primitives.css";
```

Consumer resets precede package CSS. Consumer semantic-token overrides and application styles follow package CSS. JavaScript does not inject CSS, and consumers own font loading.

## Theme, SSR, and CSP

The default storage key is `design-system-theme-preference`. A consumer may supply a domain-specific key, but it must pass the same key to `createThemeBootstrapScript` and `ThemeProvider`. Render the deterministic bootstrap script in the document head before theme-consuming styles and wrap the application with the provider.

Consumers own server-document integration and CSP. Use a fresh per-response nonce or a verified hash of the exact stable bootstrap text; never reuse the preview nonce. Public modules do not access browser globals during module evaluation, and any framework-specific hydration handling must remain narrowly scoped.

## Accessibility responsibilities

The package preserves native semantics, keyboard operation, visible focus, reduced-motion behavior, forced-colors behavior, minimum target sizing, and theme-control labeling. Consumers remain responsible for composition, headings, labels, content, route focus, contrast after overrides, status announcements, and application-level accessibility testing.

## Migration

1. Inventory reusable local primitives and theme utilities separately from application business logic.
2. Install exact version `1.0.0` and verify registry integrity, signatures, and provenance.
3. Replace reusable imports with documented root and theme exports; do not use deep imports.
4. Import either the combined stylesheet or the ordered separate stylesheets.
5. Preserve the consumer's storage key in both theme integration points.
6. Remove duplicated reusable source only after package-backed unit, SSR, browser, accessibility, static-output, and visual-equivalence checks pass.
7. Retain the previous application source commit as the application rollback target.

## Known limitations

The package does not provide routes, content, SEO, authentication, APIs, data access, business components, application shells, font loading, deployment, or infrastructure. Consumer-specific visual overrides and framework integration remain application-owned. Corrections to a published package require a new semantic version; published versions are never overwritten.
