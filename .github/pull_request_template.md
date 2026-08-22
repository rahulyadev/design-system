# Summary

Describe the reusable problem, consumers, scope, changed paths, and known limitations. Required categories must use `Not applicable — <reason>` when they do not apply; do not silently omit them.

## Change type and semver

- Change classification:
- Proposed semver impact:
- Confirmation that package version is unchanged outside an authorized release task:

## Ecosystem lifecycle

- Originating application or `None`:
- Verified consumer baseline:
- Affected consumers:
- Lifecycle phase:
- Packed-artifact proof:
- Consumer handoff:
- Consumer registry update:
- Sequential rollout or `Not applicable — reason`:

## Public API

- Public API diff:
- Native semantic element and preserved contracts:
- Bundle impact:

## Accessibility

- Accessible-name, keyboard, focus, state, target-size, reduced-motion, forced-colors, and relationship contract:
- Axe and manual evidence:

## Verification

- Exact commands, exit status, and relevant counts:
- Browser engines:
- SSR, hydration, no-JavaScript, and CSP evidence:

## Packed package

- Artifact and allowlist result:
- React 18 and React 19 peer matrix:
- NodeNext, Bundler, SSR, CSS subpath, deep-import, and single-React results:

## Visual evidence

- Snapshot paths or unchanged-output evidence:
- Required viewports, themes, reduced motion, forced colors, and manual inspection:

## Consumer impact

- Known consumers and first-consumer verification:
- CSS-order, theme, peer, migration, and compatibility implications:

## Rollback

- Immediate rollback version or application commit:
- Deprecation or migration plan:

## Definition of done

- [ ] Scope qualification is written and the change is package-owned.
- [ ] The required proposal and preserved existing contracts are documented.
- [ ] The public API is native-first, domain-neutral, and intentionally bounded.
- [ ] The semver classification is stated; ordinary development did not change the package version.
- [ ] Source placement, named exports, refs, events, and native behavior meet policy.
- [ ] Public barrels and export-map behavior are verified without deep imports.
- [ ] CSS and token contracts are preserved or verified.
- [ ] The accessibility contract is documented and verified.
- [ ] SSR, theme, hydration, no-JavaScript, and CSP boundaries are verified where applicable.
- [ ] Unit and preservation tests pass.
- [ ] Required browser interaction, axe, responsive, and engine checks pass.
- [ ] Packed consumers, types, SSR, CSS subpaths, and single-peer resolution pass.
- [ ] Required visual evidence and manual inspection are complete.
- [ ] Applicable public documentation and changelog entries are updated.
- [ ] Known consumers and the first real consumer are verified where required.
- [ ] An immediate rollback version or application commit is recorded.
- [ ] Required pull request evidence and the release handoff are complete; publication remains separately authorized.
