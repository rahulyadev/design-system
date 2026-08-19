# Testing

## Final local artifact

The packed-package gate builds the project, runs `npm pack`, verifies an exact file allowlist, extracts the tarball, byte-compares every packed file, validates every export target, and writes `.artifacts/manifest.json`. The final local Phase 2 artifact is:

- Path: `.artifacts/rahulyadev-design-system-0.0.0-development.tgz`
- SHA-256: `dd52430a4663f488068702970742263b2cd57eb61c72b5789993c0269600b751`
- Integrity: `sha512-UgICfpm3AJSKCQ07iTmKmhSm1TxgDeFHDzdE8H8OaVO4EvPm7Ytby9LFdRk3HDOWZnhEs3sw/mD/BFNNQQsU3w==`
- shasum: `5d3a395a11cbf423c8dbaa9f74854fcc77eb8409`
- Files: 80
- Packed size: 26,005 bytes
- Unpacked size: 115,519 bytes

Generated tarballs, manifests, clean consumers, packed previews, browser reports, and browser results remain ignored under `.artifacts/`, `.tmp/`, `.preview/`, `playwright-report/`, and `test-results/`. The six required PNG baselines under `tests/browser/__snapshots__/` are retained as repository evidence.

## Packed consumer matrix

Run `npm run test:packed` to create the artifact and install it into two clean temporary consumers:

| Consumer |  React | React DOM | React types | React DOM types | TypeScript |  Vite |
| -------- | -----: | --------: | ----------: | --------------: | ---------: | ----: |
| React 18 | 18.3.1 |    18.3.1 |     18.3.31 |          18.3.7 |      6.0.3 | 8.2.1 |
| React 19 | 19.2.8 |    19.2.8 |     19.2.18 |          19.2.4 |      6.0.3 | 8.2.1 |

Each consumer passes strict NodeNext and Bundler compilation against public declarations and package exports. The fixtures cover the root entry, theme entry, all four CSS subpaths, JavaScript-only imports with no automatic CSS, expected deep-import rejection, `renderToString`, the stable `system:light` server snapshot, and safe bootstrap insertion. `npm ls react react-dom --all --json` and a physical package scan prove one React and one React DOM installation per consumer without a dedupe alias or package override. Components render through the consumer installation, while React and React DOM remain peer dependencies and the package retains no runtime dependencies.

### Bundle measurements

Measurements are minified Vite outputs. Raw and gzip columns are bytes and include every JavaScript or CSS file emitted for the entry.

| Entry          | React 18 raw | React 18 gzip | React 19 raw | React 19 gzip |
| -------------- | -----------: | ------------: | -----------: | ------------: |
| Button only    |        7,480 |         2,901 |        2,222 |         1,006 |
| Theme          |       11,879 |         4,499 |        6,713 |         2,623 |
| Full preview   |      161,050 |        50,425 |      210,802 |        64,496 |
| Tokens CSS     |        5,327 |         1,600 |        5,327 |         1,600 |
| Base CSS       |        1,565 |           652 |        1,565 |           652 |
| Primitives CSS |        8,607 |         1,942 |        8,607 |         1,942 |
| Combined CSS   |       15,417 |         3,674 |       15,417 |         3,674 |

The React 18 full preview consists of `entry.js` at 145,672 raw and 46,810 gzip bytes plus `full-preview.css` at 15,378 raw and 3,615 gzip bytes. The React 19 full preview uses the same CSS and an `entry.js` at 195,424 raw and 60,881 gzip bytes. Button-only output omits theme implementation strings, theme output retains them, and neither JavaScript-only entry emits CSS.

## Packed preview and browser matrix

The generated preview installs the tarball and imports only:

```text
@rahulyadev/design-system
@rahulyadev/design-system/theme
@rahulyadev/design-system/styles.css
```

It server-renders, inserts the theme bootstrap before the stylesheet, hydrates with React 19.2.8, and uses the preview-only storage key `design-system-preview-theme-preference`. The local static server exposes only `.preview/` on `127.0.0.1:4179`, permits `GET` and `HEAD`, rejects traversal, symlinks, and unsupported file types, and sends a restrictive CSP. Browser monitors require no console errors, page errors, failed requests, remote requests, or CSP violations.

The local preview uses the fixed nonce `design-system-preview-nonce` solely to keep automation deterministic. It is not a production nonce strategy. A production consumer must generate a fresh unpredictable nonce for every response or authorize the exact stable bootstrap text with a CSP hash.

Direct commands for a provisioned system are:

```sh
npm run test:browser
npm run test:visual
npm run test:visual:update
```

The local container commands are:

```sh
npm run test:browser:container
npm run test:visual:container
npm run test:visual:update:container
npm run verify:full
```

They use Playwright 1.62.1 and the immutable image `mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`. The selected Linux AMD64 platform digest is `sha256:c091b21d9fae78c76e85cd4356431e9b018402f172a214fc7d7a5e9a7e29d8ac`. The wrapper supplies the repository's exact Node 24.19.0 and npm 11.17.0 toolchain, maps the host user, mounts only this repository, and uses no privileged mode, daemon socket, host networking, or host port.

Actual bundled browser versions from the final local run were:

| Browser  | Version       | Nonvisual result                       |
| -------- | ------------- | -------------------------------------- |
| Chromium | 151.0.7922.34 | 28 passed                              |
| Firefox  | 153.0         | 21 passed, 1 scoped forced-colors skip |
| WebKit   | 26.5          | 21 passed, 1 scoped forced-colors skip |

The browser suite covers first paint, SSR hydration, storage and system changes, CSP, keyboard order and focus, native activation, theme radiogroup navigation, compact tooltips, target sizes, axe, reduced motion, Chromium forced colors, responsive layouts, no JavaScript, consumer fonts, and a 200% text-size proxy. The proxy sets the root font size to 200% and adds preview-scoped semantic token overrides at 320px to keep the deliberately severe fixture readable. It does not reproduce browser zoom, operating-system text scaling, assistive-technology output, or manual reflow inspection.

## Visual baselines

Generate baselines only in the digest-pinned container after semantic browser checks pass:

```sh
npm run test:visual:update:container
npm run test:visual:container
npm run test:visual:container
```

Inspect all six PNGs before retaining them. Do not raise image thresholds, hide meaningful content, or update snapshots in `verify:full`. The required cases are 1440px light, 1440px dark, 768px system, 320px light, 320px dark, and the 320px text-size proxy. Two immediate comparison runs must both pass after every update.

## Evidence boundary

The local checks do not establish registry availability at a future release date, hosted workflow results, portfolio equivalence, provenance, publication, deployment, or release completion. Human visual and accessibility inspection, real browser zoom, and assistive-technology testing remain separate tasks.
