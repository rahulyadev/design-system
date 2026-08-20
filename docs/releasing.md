# Release process

## Manual semver workflow

Each version is prepared on a release branch, reviewed through a pull request, verified locally and in hosted CI, and squash-merged to `main`. Package versions are immutable: an existing version is never overwritten or unpublished as routine rollback. No Git tag or GitHub Release is required by this workflow.

Before any publication, confirm the package name, version, license, repository, export map, peers, zero-runtime-dependency state, packed allowlist, declarations, CSS bytes, browser matrix, visual comparisons, audit result, and registry version absence. Generate and retain a release manifest containing the tarball SHA-256, npm integrity, shasum, sizes, and every packed path.

## Bootstrap release candidate

The first package version is `1.0.0-rc.0`. A new package cannot use its final trusted-publisher relationship until its package record exists, so this one bootstrap artifact is published interactively with npm 2FA, explicit public access, and the `next` dist-tag. Publish only the exact locally verified tarball. Confirm that `latest` does not point to the release candidate.

## Stable staged publication

The stable workflow is `.github/workflows/release.yml`. It is manually dispatched from public `main`, accepts the exact stable version, uses a GitHub-hosted runner with `id-token: write`, verifies that the registry version is absent, recreates the deterministic artifact, and calls `npm stage publish` with public access and the `latest` dist-tag.

The npm trusted publisher must identify repository `rahulyadev/design-system` and workflow `release.yml`, permit staged publication only, and reject direct OIDC publication. The workflow contains no npm token, `NODE_AUTH_TOKEN`, or GitHub npm secret. A maintainer downloads and compares the pending stage to the local and workflow artifacts, then approves the exact stage interactively with npm 2FA.

After approval, verify registry metadata, `latest` and `next`, tarball equality, React 18 and React 19 consumers, signatures, provenance source repository, provenance source commit, workflow identity, and transparency-log attestations.

## Rollback policy

Before publication, rollback is the previous `main` source commit. After release-candidate publication, leave it under `next` and correct source through a new pull request. Reject a mismatched pending stage. After stable publication, do not overwrite or unpublish the version; stop consumer adoption and prepare a separately authorized patch release if a defect is found. Consumer applications roll back to their prior source commit or prior exact package version.

Publication does not deploy any consumer application or change production infrastructure.
