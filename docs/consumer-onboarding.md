# Consumer onboarding

The canonical sequence for originating applications, packed-artifact proof, releases, adoption, and rollout is the [multi-application lifecycle](ecosystem-lifecycle.md). Use the [consumer-adoption handoff template](handoffs/consumer-adoption-template.md), record completed adopters in [verified consumers](consumers.md), and use the [reusable-capability proposal template](proposals/reusable-capability-template.md) before promoting application-local behavior into the package.

## Adoption contract

Complete a versioned adoption handoff before adoption. It records the exact artifact, provenance, public contracts, consumer integration, verification, migration, rollback, limitations, and deployment status without duplicating the lifecycle process here.

Install an exact verified registry version. Import only the root, `theme`, documented CSS, and package metadata subpaths. Do not use component deep imports. Keep one physical React and React DOM installation satisfying the package peer ranges.

For the stable release, install:

```sh
npm install --save-exact @rahulyadev/design-system@1.0.0
```

Import either `styles.css` or `tokens.css`, `base.css`, and `primitives.css` in that order. Consumer resets come first; consumer token overrides and application styles come after package CSS. JavaScript does not import CSS automatically.

Generate the first-paint script and configure `ThemeProvider` with the same consumer-owned storage key. Place the script before theme-consuming styles. Consumers own per-response CSP nonces or a verified script hash, SSR document integration, route behavior, content, and deployment.

## Future ownership examples

The following are examples only. Tourney, URL shortener, health, and investment applications are not verified consumers and must not be treated as active work without a supplied repository baseline.

### Tourney

The Tourney application could compose shared buttons, links, badges, cards, containers, sections, headings, skip links, visually hidden text, and theme controls from public package exports. Tournament brackets, match states, scoring, registration, permissions, routes, data access, and domain labels remain application-owned. Any future adoption would preserve existing DOM semantics, keyboard order, announcements, responsive behavior, and application-specific visual overrides.

### URL shortener

The URL-shortener application could compose domain-neutral primitives, ordered CSS, and configurable theme utilities through public exports. URL creation, validation, redirect behavior, analytics, authentication, rate limits, API integration, routes, and domain copy remain application-owned. Any future adoption would preserve form labels, validation associations, status announcements, copy-button behavior, focus movement, and existing URLs.

### Health

Domain-neutral controls and accessibility behavior may be package-owned. Patient records, health measurements, clinical interpretation, privacy rules, consent, regulated workflows, APIs, content, routes, and deployment remain application- or platform-owned.

### Investment

Domain-neutral controls and semantic tokens may be package-owned. Holdings, transactions, market data, calculations, tax treatment, risk disclosures, financial copy, APIs, routes, and deployment remain application- or platform-owned.

A future example becomes a verified consumer only after a real baseline, exact registry adoption, completed verification, and a versioned handoff are recorded in [verified consumers](consumers.md).
