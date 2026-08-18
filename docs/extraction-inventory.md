# Extraction inventory

## Provenance and scope

This inventory uses only the immutable `rahulyadev/website` release `v1.0.0`, commit `0bfde1c170e2b27ec92d98504b6fa25d66543bed`. Git object IDs below are blob SHAs from that commit. The source and target use the same MIT license.

Change kinds are:

- **Exact byte copy:** no byte changed.
- **Mechanical module-path adaptation:** relocation, NodeNext `.js` specifiers, formatting, or public-barrel placement only.
- **Domain-neutral API adaptation:** the narrowly scoped configurable theme storage contract described below.

## Extracted styles and license

| Source path and blob                                                     | Classification       | Target and change kind                        | Dependencies, evidence, reason, and coupling                                                                                     |
| ------------------------------------------------------------------------ | -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE` — `a0d328f8c0e411e6b5635daee7618281cae84057`                   | extracted in Phase 1 | `LICENSE` — exact byte copy                   | MIT text copied without rewriting; package metadata declares MIT.                                                                |
| `app/styles/tokens.css` — `058631eb8b07d10b9772e8f8fddbfaad2e411370`     | extracted in Phase 1 | `src/styles/tokens.css` — exact byte copy     | Foundation variables; consumed by base and primitive CSS. Theme browser evidence exists in `tests/e2e/theme-foundation.spec.ts`. |
| `app/styles/base.css` — `40918606e89ff93e893870f058e3ffada0c197e5`       | extracted in Phase 1 | `src/styles/base.css` — exact byte copy       | Depends on tokens; preserves global opt-in defaults, focus, no-JavaScript theme fallback, and reduced motion.                    |
| `app/styles/primitives.css` — `6a946cc2204bb345afc27bf9b19b6e5d796a0685` | extracted in Phase 1 | `src/styles/primitives.css` — exact byte copy | Depends on tokens and base conventions; styles the extracted `.ui-*` classes, including forced-colors theme-toggle rules.        |

The four mappings above were compared byte-for-byte. Existing `.ui-*` selectors, custom properties, colors, spacing, typography, shadows, target sizes, media queries, focus rules, reduced-motion rules, and forced-colors rules were preserved.

## Extracted primitives

All primitive implementations depend only on React types or runtime APIs and the listed local helper. Reusable behavior is established by source `tests/unit/primitives.test.tsx` (`657a7030d08ec93572c38fea7cdfb11bfbee6334`) and, for the theme control, the theme test sources listed later.

| Source path and blob                                                                 | Classification       | Target and change kind                                                   | Dependencies, reason, and coupling                                                                         |
| ------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `app/components/ui/index.ts` — `ca44c429dc9fe71a01830f00fdb92985e370c82b`            | extracted in Phase 1 | `src/components/index.ts` — mechanical module-path adaptation            | `.js` specifiers added; theme control moved to the theme barrel; internal helper remains unexposed.        |
| `app/components/ui/badge.tsx` — `0ac70cd83662545233592cea2720a18ff8cce384`           | extracted in Phase 1 | `src/components/badge.tsx` — mechanical module-path adaptation           | React HTML attributes only; native span, variants, data attribute, and class preserved.                    |
| `app/components/ui/button-styles.ts` — `39ffabdf005d32360e08554848bae554c1ee1982`    | extracted in Phase 1 | `src/components/button-styles.ts` — mechanical module-path adaptation    | Shared by Button and LinkButton; finite options and class construction preserved.                          |
| `app/components/ui/button.tsx` — `f2bb22218361e9f6820085622efe4f22407b7463`          | extracted in Phase 1 | `src/components/button.tsx` — mechanical module-path adaptation          | Depends on button styles; native button and default `type="button"` preserved.                             |
| `app/components/ui/card.tsx` — `5691a28814df82bdcaee41c4d6439a9e461bfe0b`            | extracted in Phase 1 | `src/components/card.tsx` — mechanical module-path adaptation            | React HTML attributes; restricted article/div/section choice and variants preserved.                       |
| `app/components/ui/container.tsx` — `765ddf6c18e44c12fc6776e401a09a4d385f4d75`       | extracted in Phase 1 | `src/components/container.tsx` — mechanical module-path adaptation       | React HTML attributes; widths, defaults, and native div preserved.                                         |
| `app/components/ui/icon-button.tsx` — `ee19c328278d34435c620418133fdc712f2cb1a1`     | extracted in Phase 1 | `src/components/icon-button.tsx` — mechanical module-path adaptation     | React `forwardRef`; required accessible-name typing, default type, and variants preserved.                 |
| `app/components/ui/link-button.tsx` — `9c6971266fb9425a619195ae14a6550279973059`     | extracted in Phase 1 | `src/components/link-button.tsx` — mechanical module-path adaptation     | Depends on button styles; native anchor and required href preserved.                                       |
| `app/components/ui/section.tsx` — `f74e811b54c8ab2e287ef42f72820aec46d1eefa`         | extracted in Phase 1 | `src/components/section.tsx` — mechanical module-path adaptation         | React HTML attributes; native section and spacing contract preserved.                                      |
| `app/components/ui/section-heading.tsx` — `a555e796163335351055030892fd0d6a5c3b38a8` | extracted in Phase 1 | `src/components/section-heading.tsx` — mechanical module-path adaptation | React nodes and attributes; h2/h3 restriction and DOM structure preserved.                                 |
| `app/components/ui/skip-link.tsx` — `277e21709523087238805752d341f83a3c06297e`       | extracted in Phase 1 | `src/components/skip-link.tsx` — mechanical module-path adaptation       | React anchor event types; native hash behavior, prevent-default handling, and focus enhancement preserved. |
| `app/components/ui/visually-hidden.tsx` — `3acf7362a117b6f70d7ed65cf9f1e412c2bd910d` | extracted in Phase 1 | `src/components/visually-hidden.tsx` — mechanical module-path adaptation | React HTML attributes; accessibility-tree content and class preserved.                                     |

## Extracted theme behavior

| Source path and blob                                                              | Classification       | Target and change kind                                              | Dependencies, tests, reason, and coupling                                                                                                                                                           |
| --------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/theme/theme.ts` — `360668422c108e687cb388ee9d4c07bdd06701fd`                 | extracted in Phase 1 | `src/theme/core.ts` — domain-neutral API adaptation                 | Storage helpers now accept a key and default to a neutral constant. Parsing, system resolution, root attributes, and failure behavior remain the same. Source evidence: `tests/unit/theme.test.ts`. |
| `app/theme/theme-bootstrap.ts` — `619db8763ad8f854c4d6bde3fc94838436a85468`       | extracted in Phase 1 | `src/theme/bootstrap.ts` — domain-neutral API adaptation            | Fixed script constant replaced by a deterministic generator with safe key serialization. First-paint behavior is based on source bootstrap unit tests and end-to-end theme evidence.                |
| `app/theme/theme-provider.tsx` — `07816d62d6214247558dc894051866afb24d0353`       | extracted in Phase 1 | `src/theme/provider.tsx` — domain-neutral API adaptation            | Depends on theme core and React; provider accepts the key, subscriptions match it, and the internal event is neutral. Stable server snapshot and update behavior remain.                            |
| `app/theme/index.ts` — `03bb15d6fb4521965b2819d3b5e4b92e664487a0`                 | extracted in Phase 1 | `src/theme/index.ts` — mechanical module-path and barrel adaptation | Public theme exports are isolated under `./theme`; no theme runtime is exposed from the root.                                                                                                       |
| `app/components/ui/theme-toggle.tsx` — `a88480641411fc1b1ca77d9def3c95a99370a66b` | extracted in Phase 1 | `src/theme/theme-toggle.tsx` — mechanical module-path adaptation    | Depends on theme core/provider and React; labels, SVGs, radiogroup semantics, roving focus, keyboard behavior, tooltips, classes, and data attributes are unchanged.                                |

The source portfolio key is `rahuly-theme-preference`. It is not a package runtime default. A later portfolio migration must pass this key explicitly to both `createThemeBootstrapScript` and `ThemeProvider` to preserve existing preferences.

## Behavioral test sources

| Source path and blob                                                              | Classification         | Target use                                        | Dependencies, evidence, and coupling                                                                                                                              |
| --------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/primitives.test.tsx` — `657a7030d08ec93572c38fea7cdfb11bfbee6334`     | behavioral test source | Adapted into `tests/unit/primitives.test.tsx`     | Testing Library and user-event; reusable semantic and focus assertions only. Portfolio route strings are not part of the package contract.                        |
| `tests/unit/theme.test.ts` — `47bcb46f0b696bc5ff0fe04e2f1046368b4f8ee4`           | behavioral test source | Adapted into `tests/unit/theme.test.ts`           | Vitest; parsing, persistence failures, and effective-theme behavior extended for configurable keys.                                                               |
| `tests/unit/theme-bootstrap.test.ts` — `d14c1b4593e4c5d605c9118a7b3da147bbeb5aca` | behavioral test source | Adapted into `tests/unit/theme-bootstrap.test.ts` | Vitest and executed script behavior; extended for generator determinism and safe serialization.                                                                   |
| `tests/unit/theme-toggle.test.tsx` — `97011dfc32990836689d927079e31d2b10f6a0df`   | behavioral test source | Adapted into `tests/unit/theme-toggle.test.tsx`   | Testing Library; radiogroup, persistence, keyboard, system, and tooltip behavior extended for configured storage and cross-tab updates.                           |
| `tests/e2e/theme-foundation.spec.ts` — `a57d9b9c00858dd7c21769292764f45496d1457c` | behavioral test source | No Phase 1 browser target                         | Playwright evidence for first paint, theme indicator, reduced motion, and forced colors. It is deferred to Phase 2 rather than copied as a package browser suite. |

## Consumer-owned, deferred, and later-review candidates

| Source path and blob                                                                 | Classification                     | Target                                           | Dependencies, reason, tests, and coupling                                                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `app/styles/site-shell.css` — `4c3bed0a1f49f5e00927e7f16a6fb2b37ac1466a`             | consumer-owned and excluded        | —                                                | Site navigation and footer layout; depends on portfolio shell DOM.                                                        |
| `app/styles/home.css` — `3749eb240dfaaef0be7bda94ad1b982caee1c862`                   | consumer-owned and excluded        | —                                                | Home content and layout; coupled to portfolio content components.                                                         |
| `app/styles/professional.css` — `7f551faa7ccd878c8b328061eb8e03d80c7592c9`           | consumer-owned and excluded        | —                                                | Professional-history presentation; application content concern.                                                           |
| `app/styles/projects.css` — `d671acdfe384cf911fe20adf0224a9c2ce041e7b`               | consumer-owned and excluded        | —                                                | Project route and card composition styling.                                                                               |
| `app/styles/writings.css` — `3236d75af8eb6a29e1b653c9fd987de54cba1f31`               | consumer-owned and excluded        | —                                                | Writing route, table, and code presentation styling.                                                                      |
| `app/components/responsive-picture.tsx` — `4b94bf1fc8bfda4cbd572cd0ed96096812fb54b8` | deferred                           | —                                                | Depends on portfolio responsive-image domain types; deferred for v1.                                                      |
| `app/components/organization-logo.tsx` — `d3fef32cf400c37c3ff1103034c793ec11895998`  | consumer-owned and excluded        | —                                                | Depends on organization-logo route data and identity content.                                                             |
| `app/root.tsx` — `98fab23e9f2aa7fbf61f24b57b09d51294b811bd`                          | consumer-owned and excluded        | —                                                | React Router document, loaders, SEO, shell, content, and application CSS integration.                                     |
| `app/app.css` — `230f5c81077f6ef931a5438a97d9394d15fffebe`                           | consumer-owned and excluded        | —                                                | Consumer stylesheet composition and Tailwind import. Tailwind remains a consumer concern and is not a package dependency. |
| `docs/design-system.md` — `cbee729b82b5efa3268dbb7882d937a51b3b04a5`                 | inspect or selectively adapt later | —                                                | Portfolio design notes were evidence only; prose was not copied.                                                          |
| `package.json` — `6503b91aead0bd5252ecdcbc3988d0b839d528b4`                          | inspect or selectively adapt later | `package.json` uses selected exact tool versions | Supplies Node/npm and applicable development-tool baselines; application runtime and framework dependencies are excluded. |

### Site shell files

All are **consumer-owned and excluded** because they depend on React Router, portfolio route data, navigation, responsive media, or application shell state. Their behavior remains covered by portfolio application tests.

| Source path                                 | Blob SHA                                   |
| ------------------------------------------- | ------------------------------------------ |
| `app/components/site-shell/site-footer.tsx` | `025ef208d7f008088db4e5a261a7538cc203f9db` |
| `app/components/site-shell/site-header.tsx` | `602bec9d238e4fc57ca440c32ce67d83401cb644` |
| `app/components/site-shell/site-shell.tsx`  | `f097a5fe26adcd1f0078b56a51cf20efc76026be` |

### Home files

All are **consumer-owned and excluded** because they depend on portfolio route data, content types, project composition, organization identity, or shell behavior. Portfolio unit and route tests remain their evidence.

| Source path                                  | Blob SHA                                   |
| -------------------------------------------- | ------------------------------------------ |
| `app/components/home/contact-actions.tsx`    | `93f99492a148c62926664e753ed69aed6dfa9912` |
| `app/components/home/education-section.tsx`  | `cb53bb0acf15756b22c13156e1a4b0483fa30eb1` |
| `app/components/home/experience-section.tsx` | `901f546666e61ba1f9323e0d6c384a32303254f9` |
| `app/components/home/home-page.tsx`          | `45525d6c66a52ad63c21f008d9e7121f0d4bc2d7` |
| `app/components/home/projects-section.tsx`   | `80845b24ef53793004a5302bd4e25a80c1e7e744` |
| `app/components/home/skills-section.tsx`     | `5ca4f8490f8b68fdffe813a2e4faa6d779e2e2da` |

### Project files

All are **consumer-owned and excluded** because they depend on portfolio project content types, route links, marks, and statuses. Portfolio project component and route tests remain their evidence.

| Source path                                        | Blob SHA                                   |
| -------------------------------------------------- | ------------------------------------------ |
| `app/components/projects/project-card.tsx`         | `81faf62089ab745f42b6513bcbdd455373ffc8dd` |
| `app/components/projects/project-mark.tsx`         | `27c2a09ab42cbfa56e23b299078fb80328222d82` |
| `app/components/projects/project-status-badge.tsx` | `5dc6b20009ce3241141a7dd3ed1ca56559c0a12a` |

### Writing files

All are **consumer-owned and excluded** because they depend on portfolio article-domain types, routing, content rendering, or application-specific code and table behavior. Portfolio writing tests remain their evidence.

| Source path                                             | Blob SHA                                   |
| ------------------------------------------------------- | ------------------------------------------ |
| `app/components/writings/article-content.tsx`           | `7d3ecee568a8be5815c42bf6da78582e00a0c705` |
| `app/components/writings/article-table-of-contents.tsx` | `04ff087843aa0cf3bf5592cd0b4cd2921e491fb5` |
| `app/components/writings/code-block.tsx`                | `643704cae662b3a32643bfd59649fbeca0b88b51` |
| `app/components/writings/responsive-table.tsx`          | `c50ca6e9f30532d46ad6b75251961c9631f1d609` |

### Design-system preview files

Both are **deferred** to Phase 2 because a browser preview is outside the package foundation scope.

| Source path                                           | Blob SHA                                   |
| ----------------------------------------------------- | ------------------------------------------ |
| `app/design-system-preview/design-system-preview.tsx` | `822c09d5917d85c7031a42f618566d8e52322c47` |
| `app/design-system-preview/preview-gate.tsx`          | `8a540020611caeb93e5f7091a62d96bd5a909b0c` |

## Boundary conclusions

Application routes, content, SEO, shell composition, authentication, identity and profile logic, APIs, AWS, deployment, infrastructure, and business components remain outside the package. No organization logos, responsive-picture implementation, home, project, writing, or site-shell component was extracted.

The source visual values and `.ui-*` selectors were preserved. The package adds no framework reset, font import, Tailwind dependency, runtime dependency, route, or business behavior. The portfolio end-to-end theme suite remains Phase 2 behavioral evidence. No browser or portfolio visual equivalence is claimed in Phase 1.
