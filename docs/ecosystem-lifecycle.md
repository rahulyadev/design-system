# Multi-application design-system lifecycle

This document is the canonical cross-repository process for identifying, proving, releasing, adopting, and rolling out reusable capabilities. Component-level design-system work also follows the [component development and change policy](component-development.md).

## Current state and inactive periods

- Current active originating application: none.
- One originating application may be active at a time.
- No application becomes active unless Rahul explicitly names it and supplies its verified repository baseline.
- Do not create speculative components during an inactive period.
- Do not inspect, branch, install into, or modify Tourney or another future application until Rahul starts that project.
- Process documentation, dependency security maintenance, and verified defect fixes may continue while no application is active.
- Planned applications are not consumers. [The consumer registry](consumers.md) contains only verified adopters.

## State machine

```text
No active application
→ application planning
→ originating application implementation
→ reusable gap identified
→ local incubation
→ package proposal
→ package implementation
→ packed-artifact proof
→ package release
→ originating-app adoption
→ sequential affected-consumer rollout
→ lifecycle complete
```

## Lifecycle stages

1. **Select one originating application.** Rahul names one application and supplies its repository URL, local path, default branch, exact commit, and working-tree status. No other application is implicitly in scope.
2. **Bootstrap with an exact stable package.** When appropriate, the application installs the current exact stable version, presently `@rahulyadev/design-system@1.0.0`, after verifying registry metadata, integrity, signatures, provenance, peer compatibility, and public exports.
3. **Decide ownership.** Routes, content, business behavior, services, and page composition remain application- or platform-owned. Only domain-neutral primitives, broadly reusable semantic tokens, and intrinsic accessibility behavior qualify for the package.
4. **Incubate uncertain abstractions locally.** A capability stays in the originating application until its API, semantics, states, and ownership boundary are supported by actual use. Local incubation is not package adoption by another application.
5. **Qualify a second consumer.** Promotion requires a second real consumer or a credible near-term consumer with a concrete use case. A planned application name alone is not qualification.
6. **Submit a reusable-capability proposal.** Use the [proposal template](proposals/reusable-capability-template.md) to record the originating baseline, local implementation, reusable need, proposed contract, accessibility, platform implications, semver, affected consumers, proof plan, and rollback.
7. **Implement without version mutation.** Design-system implementation occurs in this repository under the component policy. Ordinary implementation does not change the package version, tag, release, or npm state.
8. **Prove the real packed artifact.** Build the actual `.tgz`, install it into the originating application, and verify public imports, CSS order, peer resolution, SSR or static behavior, hydration, CSP, accessibility, bundle impact, and affected application behavior. Repository-source aliases are not packed-artifact proof.
9. **Classify semver.** Classify the verified change as patch, minor, or major from its public compatibility impact. Application and package versions remain independent.
10. **Release through staged OIDC publication.** A separately authorized release task applies the version, runs the release gates, stages the exact artifact through the trusted GitHub OIDC workflow, verifies the pending stage, and requires normal approval before registry availability.
11. **Adopt in the originating application first.** Replace the packed test with the exact registry version, repeat the required application verification, and record the adoption in a versioned handoff.
12. **Roll out sequentially.** Update affected existing consumers one at a time in the defined order. Each application retains its own baseline, proof, review, rollback, and handoff; a package release never authorizes implicit multi-repository edits.
13. **Create versioned handoffs.** Complete the [consumer-adoption handoff](handoffs/consumer-adoption-template.md) with artifact, integration, test, migration, limitation, deployment, and rollback evidence.
14. **Update the consumer registry.** Add or update [verified consumers](consumers.md) only after exact registry adoption and its handoff are verified. Planned or partially migrated applications remain absent.
15. **Handle rollback and deprecation.** Consumers roll back to a recorded application commit or exact package version. Published versions remain immutable. Deprecate public contracts before removal when practical; removal requires the appropriate major release and a sequential migration plan.
16. **Handle security fixes explicitly.** A verified security defect may justify an expedited patch without speculative abstraction or second-consumer proof. Preserve the ownership boundary, test every affected consumer, use the normal trusted release path, disclose according to repository policy, and roll out sequentially by risk.
17. **Close the lifecycle.** When all affected consumers have adopted or documented deferral, handoffs and registry entries are current, and rollback evidence is retained, return to no active originating application.
18. **Honor stop conditions.** Stop at the nearest safe boundary when the required baseline, ownership, packed proof, checks, release integrity, sequential scope, authentication, or rollback cannot be verified.

## Exact-version and rollout policy

- Consumers pin exact package versions.
- “Latest” means the latest version verified for that consumer, not automatic adoption of npm `latest`.
- Unaffected applications do not need every package release.
- Application versions and package versions are independent.

Affected consumers roll out in this order:

1. Originating application.
2. First affected existing consumer.
3. Other affected consumers, one at a time.
4. Unaffected consumers during scheduled maintenance.

## Ownership decision table

| Concern                           | Owner                            | Decision rule                                                                                                                                             |
| --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes                            | Application                      | URLs, navigation state, loaders, and route transitions belong to the application framework.                                                               |
| Content                           | Application                      | Product copy, editorial data, labels, and records remain domain-specific.                                                                                 |
| SEO                               | Application                      | Metadata, canonical URLs, structured data, feeds, and indexing policy are application concerns.                                                           |
| Authentication                    | Application and identity service | Application flows integrate an identity service; the design system may only supply domain-neutral controls.                                               |
| APIs                              | Application or service           | Requests, schemas, caching, errors, and business transactions remain outside presentation primitives.                                                     |
| AWS and deployment                | Platform infrastructure          | Hosting, environments, networking, secrets, observability, and deployment pipelines are not package responsibilities.                                     |
| Domain entities                   | Application                      | Matches, links, health records, holdings, and other business models stay local.                                                                           |
| Page compositions                 | Application                      | Shells, sections tied to content, dashboards, forms, and route layouts stay local.                                                                        |
| Domain-neutral primitives         | Design system                    | Native-first, reusable controls with bounded public contracts may be package-owned after qualification.                                                   |
| Semantic tokens                   | Design system or application     | Broad cross-application semantics may be packaged; brand-, feature-, and page-specific values remain consumer overrides.                                  |
| Accessibility behavior            | Shared by boundary               | Intrinsic component semantics and interaction are package-owned; accessible composition, content, route focus, and end-to-end testing are consumer-owned. |
| Identity-service ownership        | Identity platform                | Identity records, protocols, sessions, policy, and security operations are owned by the identity service and its platform team.                           |
| Platform-infrastructure ownership | Platform team                    | Cloud accounts, DNS, ingress, certificates, data stores, secrets, CI infrastructure, and production operations remain platform-owned.                     |

## Future application examples

These examples illustrate ownership only. They are not verified consumers, no repository baseline has been accepted for them, and they authorize no implementation.

- **Tourney:** buttons, cards, badges, focus utilities, and theme controls may qualify as reusable; brackets, scoring, teams, registrations, permissions, match announcements, routes, and persistence remain application-owned.
- **URL shortener:** form primitives and status presentation may qualify as reusable; URL validation, redirects, analytics, abuse controls, authentication, APIs, and domain copy remain application-owned.
- **Health:** domain-neutral controls may qualify as reusable; patient data, measurements, clinical interpretation, consent, privacy policy, regulated workflows, and health-service integrations remain application- or platform-owned.
- **Investment:** domain-neutral controls and broad semantic tokens may qualify as reusable; holdings, transactions, market data, calculations, tax handling, risk disclosures, and financial-service integrations remain application- or platform-owned.

## Starting a new application with Codex

Before any implementation prompt, Rahul supplies:

- Repository URL and local path.
- Default branch.
- Exact baseline commit.
- Clean or dirty status, including the exact changed paths when dirty.
- Whether the repository is existing or new.
- Node, npm, and package-manager baseline.
- React and framework versions.
- Rendering model: client, SSR, static, or hybrid.
- Existing visual baseline.
- Current accessibility coverage.
- Desired first business feature.
- Proposed consumer-specific theme storage key.
- Confirmation that deployment is excluded unless separately authorized.

The first interaction for a new application is planning-only. It validates the supplied baseline, clarifies application ownership, identifies the smallest first feature, and defines evidence and rollback before any branch or code change. Implementation prompts for multiple future phases are not generated in advance.

## Agent stop conditions

Work stops at the nearest safe boundary when:

- Rahul has not explicitly selected an originating application or supplied its verified baseline.
- The repository, branch, commit, status, toolchain, rendering model, or existing visual/accessibility state differs from the supplied baseline.
- The proposed capability is application-, identity-service-, or platform-infrastructure-owned.
- A reusable proposal lacks a concrete second or near-term consumer, except for a verified security or defect fix.
- Package work would require an implementation-time version change, speculative export, runtime dependency, or unsupported deep import.
- The real `.tgz` cannot be proven in the originating application.
- Verification fails, runtime behavior changes unexpectedly, duplicate React resolves, or accessibility, SSR, hydration, CSP, bundle, or compatibility evidence is incomplete.
- A remote branch changes unexpectedly, normal review or merge is unavailable, authentication needs direct owner interaction, or rollback is missing.
- Completion would require force-push, protection bypass, tag rewrite, unapproved publication, deployment, infrastructure work, secret access, or implicit multi-consumer modification.

The safe result records the exact failure, leaves unrelated repositories untouched, and identifies the smallest correction or owner decision.
