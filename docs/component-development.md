# Component development and change policy

This document is the canonical process for adding, changing, deprecating, or removing a public component, theme control, component style, or related public contract. Complete the applicable requirements before implementation and stop when a required contract cannot be preserved or verified.

Component-level work follows this document. Promotion from an application and every consumer rollout additionally follow the [multi-application lifecycle](ecosystem-lifecycle.md). Work originating in a consumer requires a [reusable-capability proposal](proposals/reusable-capability-template.md) before package implementation.

## Scope qualification

Before implementation, provide written answers to all of these questions:

- What reusable consumer problem does this solve?
- Why can existing primitives or composition not solve it?
- Is it domain-neutral?
- Is it free of routes, content, SEO, authentication, APIs, AWS, deployment, and business logic?
- Does a second real or near-term consumer justify the abstraction?
- Is it a primitive, theme utility or control, token or style change, or application composition?

Application-specific components must be rejected. The following remain outside the package:

- Navigation composition
- Portfolio sections
- Project cards tied to application data
- Article layouts
- Authentication controls
- Profile components
- API-aware controls
- Route-aware links
- Deployment UI

## Change classification and semver

State the proposed semver impact before coding:

- **Patch:** a backward-compatible defect correction or restoration of documented behavior.
- **Minor:** an additive component, prop, variant, constant, type, or token that leaves existing defaults and behavior unchanged.
- **Major:** a removed or renamed export; a changed default, DOM semantic, keyboard interaction, CSS class, or documented token; a changed theme, bootstrap, or CSS-order contract; or a material visual change to an existing component.

Ordinary component development must not change the package version. Version changes occur only in a separately authorized release task.

## Required proposal before code

Submit a concise proposal with these fields:

```text
Problem
Consumers
Proposed public API
Native semantic element
States and variants
Keyboard model
Accessible-name contract
Focus behavior
Reduced-motion behavior
Forced-colors behavior
SSR behavior
No-JavaScript behavior, if applicable
CSS/token changes
Expected bundle impact
Semver classification
Migration or rollback plan
```

For an existing component, also list the current contracts that must remain unchanged. Preservation tests are required before changing existing behavior.

## File placement and exports

Use these locations:

```text
src/components/<component>.tsx
src/components/index.ts
src/index.ts
src/theme/ only for theme-specific runtime
src/styles/primitives.css for component selectors
src/styles/tokens.css only for broadly reusable semantic tokens
preview/ for public-package examples
tests/unit/
tests/browser/
tests/package/
```

- Component file names must use kebab-case.
- Public APIs must use named exports. Do not add default exports.
- Internal helpers must remain private unless consumers require a public contract.
- Do not add per-component package subpaths in v1.
- Do not expose `src/`, `dist/`, or deep component paths.
- Theme-only APIs must remain under `./theme`.
- Root exports must remain application-independent primitives only.
- Update public barrels deliberately.
- Do not export implementation-only class helpers.

## React API rules

- Use native semantics first.
- Public props should extend the relevant native React attributes where practical.
- Preserve normal event and ref behavior.
- Forward a ref when consumers reasonably need focus, measurement, or native integration.
- Buttons must default to `type="button"` unless the component represents submission.
- Icon-only controls must require an accessible name at the type boundary.
- Links must remain native anchors and must not depend on a router.
- Disabled state must use the correct native or documented ARIA contract.
- Do not introduce a generic polymorphic framework, `asChild`, slot abstraction, or router coupling without proven need.
- Do not add a runtime dependency for convenience.
- React and React DOM must remain peer dependencies.

## Accessibility contract

Every interactive component must document and test:

```text
role and native element
accessible name
keyboard operation
tab order
focus entry and exit
visible focus
selected/expanded/pressed state
disabled state
pointer and keyboard parity
minimum target size
reduced motion
forced colors
screen-reader relationship attributes
tooltip or disclosure behavior
```

- Interactive targets must be at least 44 by 44 CSS pixels unless a documented exception is justified.
- Never remove visible focus without an equally visible semantic replacement.
- Do not use `title` as the only accessible name.
- Roving focus must follow the appropriate composite-widget keyboard pattern.
- Focus must not be clipped.
- Tooltip text must remain programmatically associated.
- New color combinations require contrast evidence.
- Passing axe is necessary but not sufficient.

## Styling and tokens

- Package CSS must remain opt-in.
- JavaScript must not import CSS.
- Separate CSS imports must remain in tokens, base, then primitives order.
- Use semantic custom properties.
- Reuse an existing token before creating a new one.
- New tokens must be broadly reusable and documented.
- Do not ship fonts or remote resources; consumers retain font control.
- `.ui-*` selectors are package-owned.
- Existing selectors, data attributes, and documented tokens are public compatibility surfaces.
- Avoid `!important` except for established accessibility utilities with a documented reason.
- Cover light, dark, system, reduced motion, and forced colors.
- A visual change to an existing component requires explicit visual-baseline review and semver analysis.

## Theme, SSR, hydration, and CSP

- Do not access browser globals during module evaluation.
- SSR imports and `renderToString` must work.
- Server snapshots must be stable.
- Theme bootstrap and provider must use the same configurable storage key.
- Package code must not hard-code a consumer-specific key.
- The first-paint script must remain deterministic and safely serialized.
- Consumers own nonces, hashes, and CSP headers.
- Do not introduce `eval`, `new Function`, or remote bootstrap code.
- Hydration warnings and recoverable mismatches are defects.
- Document no-JavaScript behavior where relevant.

## Required implementation updates

For a new component, update every applicable area:

```text
component source
public barrel
root or theme export
public types/constants
primitive CSS
preview
unit tests
SSR tests
browser interaction tests
axe coverage
responsive tests
forced-colors and reduced-motion tests
visual snapshots
package export verification
packed-consumer fixtures
README public API
accessibility documentation
styling or theming documentation
CHANGELOG Unreleased entry when user-facing
```

For an existing component, add preservation tests before changing behavior. Do not update snapshots before semantic and computed assertions pass.

## Test tiers

Run the focused checks for the changed area and the complete gate for the applicable tier.

### Documentation-only

```sh
npm run format:check
npm run lint
npm run verify
npm run pack:dry-run
```

### Nonvisual internal refactor with unchanged public output

```sh
npm run verify
npm run test:packed
```

When unchanged built runtime output is claimed, prove it with byte-level or equivalently deterministic evidence.

### Additive or behavioral component change

```sh
npm run verify
npm run test:packed
npm run test:browser:container
```

### CSS, theme, layout, focus, interaction, or visual change

```sh
npm run verify:full
```

When visual snapshots intentionally change, run:

```sh
npm run test:visual:update:container
npm run test:visual:container
npm run test:visual:container
```

Manually inspect every changed PNG. Never update snapshots merely to silence a failure.

## Packed-package and peer verification

- Tests must consume the real `.tgz`, not repository source.
- React 18 and React 19 consumers must pass.
- NodeNext and Bundler type resolution must pass.
- SSR must pass.
- All public CSS subpaths must resolve.
- Deep imports must fail.
- JavaScript-only imports must not inject CSS.
- Exactly one React and one React DOM installation must resolve.
- Do not use a consumer dedupe alias to hide a package defect.
- The tarball allowlist must remain intentional.
- Declarations and maps must be present.
- No runtime dependency may appear unexpectedly.

## Preview and visual review

The preview must:

- Import only public package paths.
- Demonstrate every new state and variant.
- Contain domain-neutral content.
- Include long-label and narrow-layout stress cases.
- Show keyboard focus and disabled states.
- Exercise light, dark, and system themes.

Visual review must cover:

```text
1440px
intermediate width
320px
200% text proxy
light
dark
system
reduced motion
forced colors
no JavaScript when applicable
```

Do not redesign unrelated components while adding one component.

## Consumer impact

For a change to an existing public contract:

- Identify all known consumers.
- Test a packed artifact in a clean fixture.
- Test the first real consumer before release when visual or interaction behavior may change.
- Record CSS-order, theme, peer, and migration implications.
- Provide an immediate rollback version or application commit.
- Do not delete duplicated consumer source until packed-artifact equivalence is established.

## Deprecation and removal

- Deprecate before removal where practical.
- Document the replacement.
- Keep runtime behavior available for the documented deprecation period.
- Removal requires a major release.
- Never reuse or overwrite a published version.
- Do not use unpublish as routine rollback.

## Pull request evidence

Every component pull request must report:

```text
Problem and consumers
Public API diff
Semver assessment
Changed paths
Accessibility contract
Test commands and counts
Packed artifact result
React peer matrix
Browser engines
Visual snapshot paths or unchanged-output evidence
Bundle impact
Consumer impact
Known limitations
Rollback
```

Do not claim a check passed without command evidence.

## Stop conditions

Stop rather than weakening checks when:

```text
duplicate React resolves
deep import is required
SSR import fails
hydration warns
axe reports an unresolved violation
keyboard behavior is incomplete
focus is invisible or clipped
forced-colors state is ambiguous
reduced-motion behavior is unusable
320px or text scaling overflows
visual snapshots differ unexpectedly
public export or declaration fails
tarball contains an unexpected file
runtime dependency is introduced without architectural review
bundle growth is unexplained
consumer behavior changes unexpectedly
```

## Definition of done

- [ ] Scope qualification is written and the change is package-owned.
- [ ] The required proposal and preserved existing contracts are documented.
- [ ] The public API is native-first, domain-neutral, and intentionally bounded.
- [ ] The semver classification is stated; ordinary development did not change the package version.
- [ ] Source placement, named exports, refs, events, and native behavior meet policy.
- [ ] Public barrels and export-map behavior are verified without deep imports.
- [ ] CSS and token changes preserve opt-in loading, order, compatibility surfaces, and consumer font control.
- [ ] The accessibility contract, keyboard behavior, focus, target size, contrast, reduced motion, and forced colors are verified.
- [ ] SSR, stable server output, theme storage, hydration, no-JavaScript behavior, and CSP boundaries are verified where applicable.
- [ ] Unit and preservation tests pass.
- [ ] Required browser interaction, axe, responsive, and engine checks pass.
- [ ] Packed React 18 and React 19 consumers, types, SSR, CSS subpaths, and single-peer resolution pass.
- [ ] Visual evidence covers required viewports and modes; changed snapshots were manually inspected and compared twice.
- [ ] Public API, accessibility, styling, theming, testing, and changelog documentation is updated where applicable.
- [ ] Known consumers and the first real consumer are verified where required.
- [ ] An immediate rollback version or application commit is recorded.
- [ ] The pull request contains the required evidence, limitations, bundle impact, and release handoff.
