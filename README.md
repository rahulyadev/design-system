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

## Ownership boundaries

This package owns only reusable primitives, their preserved CSS implementation, and theme behavior. Consumers retain routes, content, SEO, shell composition, authentication, APIs, infrastructure, deployment, and business components. Tailwind and other consumer frameworks are not package dependencies.

## Documentation

- [Consumer contract](docs/consumer-contract.md)
- [Styling](docs/styling.md)
- [Theming](docs/theming.md)
- [Accessibility](docs/accessibility.md)
- [Extraction inventory](docs/extraction-inventory.md)

Browser verification, packed-consumer validation, publication, and portfolio adoption are not complete in this phase.
