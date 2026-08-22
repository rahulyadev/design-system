# Contributing

Before changing a component, public API, CSS, token, theme runtime, preview fixture, or related test, read and follow the mandatory [component development and change policy](docs/component-development.md). It is the canonical process and defines proposal, compatibility, accessibility, test-tier, evidence, and definition-of-done requirements.

Before cross-repository or consumer work, read and follow the [multi-application lifecycle](docs/ecosystem-lifecycle.md). Every cross-repository pull request must identify:

- The originating application and its verified baseline.
- The semver impact.
- Packed-artifact proof.
- Every affected consumer.
- The immediate rollback.

Additional references:

- [Testing](docs/testing.md)
- [Accessibility](docs/accessibility.md)
- [Styling](docs/styling.md)
- [Theming](docs/theming.md)
- [Releasing](docs/releasing.md)
- [Consumer contract](docs/consumer-contract.md)
- [Verified consumers](docs/consumers.md)

Create a focused branch from the current `main`, keep the change within package ownership boundaries, and open a pull request for review. Run focused checks while developing, then run the complete gate for the change tier defined by the canonical policy. Report commands and results rather than assuming a check passed.

Package publication, version changes, dist-tag changes, tags, and releases are separate tasks and require explicit authorization. A merged contribution does not authorize publication.
