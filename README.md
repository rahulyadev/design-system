# React design system

This repository contains reusable React primitives, opt-in CSS, and theme utilities for `@rahulyadev/design-system`. The package is currently private and unpublished at version `0.0.0-development`; registry installation is not available.

The source and package use the MIT license. Development requires Node.js `24.19.0` and npm `11.17.0`.

## Development

Install the locked development dependencies and run the complete local verification:

```sh
npm ci
npm run verify
```

Useful individual commands include:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
npm run verify:package
npm run pack:dry-run
```

Packed-package and browser verification use these commands:

```sh
npm run test:packed
npm run test:browser:container
npm run test:visual:container
npm run verify:full
```

`test:packed` creates a local tarball, installs it into clean React 18.3.1 and React 19.2.8 consumers, and checks strict NodeNext and Bundler compilation, SSR, public exports, CSS subpaths, bundle output, and single physical React and React DOM installations. Both consumers use TypeScript 6.0.3 and Vite 8.2.1. Generated tarballs, consumers, previews, browser reports, and test results are ignored under `.artifacts/`, `.tmp/`, `.preview/`, `playwright-report/`, and `test-results/`.

The container commands use Playwright 1.62.1 from `mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`. The current local matrix covers Chromium 151.0.7922.34, Firefox 153.0, and WebKit 26.5. Correctly provisioned systems may use `npm run test:browser`, `npm run test:visual`, and `npm run test:visual:update` directly. Update snapshots only with `npm run test:visual:update:container`, inspect every required PNG, and require two immediate `npm run test:visual:container` comparisons before retaining a baseline.

## Public source API

The package root exports `Badge`, `Button`, `Card`, `Container`, `IconButton`, `LinkButton`, `Section`, `SectionHeading`, `SkipLink`, and `VisuallyHidden`, together with their public prop types and finite option constants and types.

Theme runtime is intentionally separate. `@rahulyadev/design-system/theme` exports the theme constants, bootstrap generator, provider, toggle, hook, storage utilities, theme resolution, root application helper, and their public types.

The JavaScript output is ESM-only. React and React DOM are peer dependencies; the package has no runtime dependencies.

## Styling

Consumers can import the combined stylesheet:

```ts
import "@rahulyadev/design-system/styles.css";
```

Alternatively, import `tokens.css`, `base.css`, and `primitives.css` separately in that order. Do not use the combined and separate forms together. CSS is never imported automatically by JavaScript, and consumers own font loading and application-level overrides.

## Theme integration

Generate the deterministic first-paint script with `createThemeBootstrapScript`, place it in the document head before theme-consuming stylesheets, and place `ThemeProvider` around the application. A custom storage key is supported; the bootstrap generator and provider must receive the same key.

The local packed preview uses a fixed nonce only for deterministic testing. Production consumers must generate a fresh nonce for each response or authorize the exact stable bootstrap text with a CSP hash.

## Ownership boundaries

This package owns only reusable primitives, their preserved CSS implementation, and theme behavior. Consumers retain routes, content, SEO, shell composition, authentication, APIs, infrastructure, deployment, and business components. Tailwind and other consumer frameworks are not package dependencies.

## Documentation

- [Consumer contract](docs/consumer-contract.md)
- [Styling](docs/styling.md)
- [Theming](docs/theming.md)
- [Accessibility](docs/accessibility.md)
- [Testing](docs/testing.md)
- [Extraction inventory](docs/extraction-inventory.md)

Local packed-consumer, browser, accessibility-automation, and visual-comparison evidence does not establish registry availability, hosted workflow results, portfolio equivalence, provenance, publication, or release completion.
