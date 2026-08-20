# Consumer onboarding

## Required handoff

Before adoption, provide the exact package version, registry URL, integrity and shasum, provenance source commit and workflow, public export map, React peer ranges, CSS import choice and order, theme bootstrap/provider contract, storage key, supported environments, accessibility responsibilities, migration steps, rollback source and package version, and known limitations.

Install an exact verified registry version. Import only the root, `theme`, documented CSS, and package metadata subpaths. Do not use component deep imports. Keep one physical React and React DOM installation satisfying the package peer ranges.

Import either `styles.css` or `tokens.css`, `base.css`, and `primitives.css` in that order. Consumer resets come first; consumer token overrides and application styles come after package CSS. JavaScript does not import CSS automatically.

Generate the first-paint script and configure `ThemeProvider` with the same consumer-owned storage key. Place the script before theme-consuming styles. Consumers own per-response CSP nonces or a verified script hash, SSR document integration, route behavior, content, and deployment.

## Tournament application

The tournament application should map shared buttons, links, badges, cards, containers, sections, headings, skip links, visually hidden text, and theme controls to public package exports. Tournament brackets, match states, scoring, registration, permissions, routes, data access, and domain labels remain application-owned. Preserve existing DOM semantics, keyboard order, announcements, responsive behavior, and application-specific visual overrides during migration.

## URL-shortener application

The URL-shortener application should adopt the same primitives, ordered CSS, and configurable theme utilities through public exports. URL creation, validation, redirect behavior, analytics, authentication, rate limits, API integration, routes, and domain copy remain application-owned. Preserve form labels, validation associations, status announcements, copy-button behavior, focus movement, and existing URLs during migration.

For both applications, compare static output, dependency trees, bundle measurements, browser diagnostics, accessibility behavior, computed styles, geometry, and screenshots against an immutable baseline before committing adoption.
