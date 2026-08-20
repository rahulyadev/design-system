# Consumer contract

## Package status

- Name: `@rahulyadev/design-system`
- Version: `1.0.0-rc.0`
- Status: bootstrap public release candidate after registry publication
- License: MIT
- Output: ESM only
- React peer: `^18.3.1 || ^19.0.0`
- React DOM peer: `^18.3.1 || ^19.0.0`

The package has no runtime dependencies. Consumers must adopt an exact verified registry version rather than a range. The release candidate is installed with `npm install --save-exact @rahulyadev/design-system@1.0.0-rc.0` only after registry metadata and integrity are available.

## Public API

The package root exports:

- `Badge`, `Button`, `Card`, `Container`, `IconButton`, `LinkButton`
- `Section`, `SectionHeading`, `SkipLink`, `VisuallyHidden`
- Public prop types, finite option constants, and finite option types for these primitives

The `@rahulyadev/design-system/theme` entry exports:

- Theme constants and public preference types
- `ThemeProvider`, `ThemeToggle`, and `useTheme`
- `createThemeBootstrapScript`
- Storage read and persistence helpers
- Preference parsing, effective-theme resolution, and root application helpers

`ThemeToggle` is not exported from the package root. Internal class-name helpers and component deep paths are not public.

## CSS and fonts

Consumers may import `styles.css`, or may import `tokens.css`, `base.css`, and `primitives.css` separately in that order. The combined and separate forms must not be used together. Consumer resets precede package CSS; consumer semantic-token overrides and application styles follow it.

Fonts are consumer-controlled. The package does not load font resources or depend on Tailwind.

## Theme, SSR, and CSP

The default theme storage key is domain-neutral. A consumer-specific key may be supplied, but the bootstrap generator and provider must use the same value. Consumers own inline-script placement, CSP nonces or hashes, framework document integration, and any narrowly scoped hydration handling.

## Ownership boundaries

Consumers own routes, content, SEO, authentication, APIs, application shell composition, infrastructure, and deployment. The package does not provide those concerns.

Local packed-artifact checks install the tarball into clean React 18.3.1 and React 19.2.8 consumers with TypeScript 6.0.3 and Vite 8.2.1. They validate public declarations and exports, strict NodeNext and Bundler compilation, SSR, all CSS subpaths, deep-import rejection, no automatic CSS, and one physical React and React DOM installation. The public-import-only packed preview adds local hydration and browser evidence described in [Testing](testing.md).

Local checks do not establish registry availability, hosted workflow success, trusted-publisher configuration, provenance, stable publication, deployment, or production equivalence. Every consumer handoff must include the exact package version and integrity, source commit, supported matrix, migration steps, known limitations, and tested rollback target.
