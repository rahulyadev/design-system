# React design system

`@rahulyadev/design-system` provides reusable React primitives, opt-in CSS, and domain-neutral theme utilities. Version `1.0.0-rc.0` is the bootstrap public release candidate; after registry publication it is installed exactly with:

```sh
npm install --save-exact @rahulyadev/design-system@1.0.0-rc.0
```

Registry availability and tarball integrity must be verified before consumer adoption. The source and package use the MIT license. Development requires Node.js `24.19.0` and npm `11.17.0`.

## Development and verification

Install the locked development dependencies and run the complete local verification:

```sh
npm ci
npm run verify
```

The full release-candidate gate includes packed React consumers and digest-pinned browser comparisons:

```sh
npm run test:packed
npm run test:browser:container
npm run test:visual:container
npm run verify:release -- --expected-version=1.0.0-rc.0
npm run package:release-artifact -- --expected-version=1.0.0-rc.0
```

`test:packed` installs a generated tarball into clean React 18.3.1 and React 19.2.8 consumers. It checks strict NodeNext and Bundler compilation, SSR, public exports, CSS subpaths, bundle output, deep-import rejection, and one physical React and React DOM installation. Both consumers use TypeScript 6.0.3 and Vite 8.2.1.

The container commands use Playwright 1.62.1 from `mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`. The matrix covers Chromium 151.0.7922.34, Firefox 153.0, and WebKit 26.5. Visual baselines are updated only with `npm run test:visual:update:container`, followed by inspection and two immediate comparison passes.

Generated tarballs, consumers, previews, reports, and results are ignored under `.artifacts/`, `.tmp/`, `.preview/`, `playwright-report/`, and `test-results/`.

## Public API

The package root exports `Badge`, `Button`, `Card`, `Container`, `IconButton`, `LinkButton`, `Section`, `SectionHeading`, `SkipLink`, and `VisuallyHidden`, together with their public prop types and finite option constants and types.

Theme runtime is separate. `@rahulyadev/design-system/theme` exports theme constants, the bootstrap generator, provider, toggle, hook, storage utilities, theme resolution, the root application helper, and their public types.

The JavaScript output is ESM-only. React and React DOM are peer dependencies with ranges `^18.3.1 || ^19.0.0`; the package has no runtime dependencies.

## Styling

Consumers may import the combined stylesheet:

```ts
import "@rahulyadev/design-system/styles.css";
```

Alternatively, import the separate stylesheets in this exact order:

```ts
import "@rahulyadev/design-system/tokens.css";
import "@rahulyadev/design-system/base.css";
import "@rahulyadev/design-system/primitives.css";
```

Do not use the combined and separate forms together. JavaScript never injects CSS. Consumer resets precede package CSS; consumer semantic-token overrides and application styles follow it. Consumers own font loading.

## Theme, SSR, and CSP

Generate the deterministic first-paint script with `createThemeBootstrapScript`, place it in the document head before theme-consuming stylesheets, and wrap the application in `ThemeProvider`. When using a consumer-specific storage key, pass the same value to the bootstrap generator and provider.

The local packed preview uses a fixed nonce only for deterministic testing. Production consumers must generate a fresh nonce per response or authorize the exact stable bootstrap text with a CSP hash. Consumers own SSR document integration, CSP policy, and any narrowly scoped hydration handling.

## Accessibility and ownership

The package preserves native semantics, keyboard behavior, visible focus, reduced-motion behavior, forced-colors behavior, minimum target sizing, and theme-control labeling. Consumers remain responsible for accessible composition, content, headings, labels, route focus management, contrast after overrides, and application-level testing.

Consumers retain routes, content, SEO, shell composition, authentication, APIs, infrastructure, deployment, and business components. Tailwind and other consumer frameworks are not package dependencies.

## Documentation

- [Consumer contract](docs/consumer-contract.md)
- [Consumer onboarding](docs/consumer-onboarding.md)
- [Release process](docs/releasing.md)
- [Styling](docs/styling.md)
- [Theming](docs/theming.md)
- [Accessibility](docs/accessibility.md)
- [Testing](docs/testing.md)
- [Extraction inventory](docs/extraction-inventory.md)

Local verification does not establish registry availability, hosted-check success, trusted-publisher configuration, provenance, final stable publication, consumer deployment, or production equivalence.
