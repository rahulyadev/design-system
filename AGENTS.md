# Repository guidance

- This package owns reusable React primitives, opt-in CSS, and domain-neutral theme utilities only.
- The immutable portfolio source baseline is tag `v1.0.0` at commit `0bfde1c170e2b27ec92d98504b6fa25d66543bed`.
- Preserve source visual values, DOM semantics, keyboard behavior, focus behavior, and accessibility contracts.
- Keep runtime names domain-neutral and make consumer-specific persistence configurable.
- React and React DOM remain peer dependencies; development copies use the exact versions in `package.json`.
- Export only documented root, theme, CSS, and package metadata subpaths. Do not expose internal helpers or deep component paths.
- CSS remains opt-in. Separate imports use tokens, base, then primitives order; JavaScript must not import CSS.
- Do not add authentication, AWS, deployment, routes, content, SEO, or business logic.
- Run `npm run verify` and `npm run pack:dry-run` for complete local verification.
- Do not weaken tests to conceal failures.
- Do not publish, tag, release, push, commit, perform destructive actions, or change repository settings without authorization.
- Public documentation uses normal engineering language.
