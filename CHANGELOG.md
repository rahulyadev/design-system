# Changelog

## Unreleased

No unreleased changes.

## 1.0.0-rc.0 - 2026-08-20

- Prepared the bootstrap public release candidate with an explicit public-access package contract.
- Preserved the extracted reusable styles, React primitives, and domain-neutral theme utilities without implementation or API changes.
- Retained strict ESM-only exports, React peer dependencies, opt-in CSS, and zero runtime dependencies.
- Added deterministic release metadata, tarball, registry-availability, declaration-path, and packed-allowlist verification.
- Added a manually dispatched, stage-only npm workflow using GitHub Actions OIDC and immutable action references for the future stable release.
- Documented manual semver release operations, staged approval, rollback, and consumer onboarding.

The release candidate is published only after its source pull request and hosted checks pass. It uses the `next` dist-tag and does not represent the final stable release.
