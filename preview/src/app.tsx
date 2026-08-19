import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Container,
  IconButton,
  LinkButton,
  Section,
  SectionHeading,
  SkipLink,
  VisuallyHidden,
} from "@rahulyadev/design-system";
import {
  ThemeProvider,
  ThemeToggle,
  useTheme,
} from "@rahulyadev/design-system/theme";

export const PREVIEW_STORAGE_KEY = "design-system-preview-theme-preference";

function ThemeStatus() {
  const { effectiveTheme, preference } = useTheme();

  return (
    <dl className="preview-status" data-testid="theme-status">
      <div>
        <dt>Preference</dt>
        <dd data-testid="theme-preference-output">{preference}</dd>
      </div>
      <div>
        <dt>Effective theme</dt>
        <dd data-testid="effective-theme-output">{effectiveTheme}</dd>
      </div>
    </dl>
  );
}

function PreviewContents() {
  const [buttonActivations, setButtonActivations] = useState(0);
  const [iconActivations, setIconActivations] = useState(0);

  return (
    <div className="preview-shell">
      <SkipLink targetId="preview-main">Skip to preview content</SkipLink>
      <main id="preview-main" tabIndex={-1}>
        <Container width="content">
          <Section spacing="compact">
            <div className="preview-intro">
              <p className="preview-kicker">Packed artifact verification</p>
              <h1>Reusable interface primitives</h1>
              <p>
                This domain-neutral page is server rendered and hydrated from an
                installed package tarball. It deliberately exercises every
                documented component category without application content.
              </p>
              <div className="preview-badges">
                <Badge variant="neutral">Server rendered</Badge>
                <Badge variant="accent">Hydrated</Badge>
                <Badge variant="positive">Public exports</Badge>
              </div>
            </div>
          </Section>
        </Container>

        <Container width="wide">
          <Section spacing="compact" aria-labelledby="theme-heading">
            <SectionHeading
              description={
                <p>
                  Both presentations share one provider and the preview-specific
                  persistence key.
                </p>
              }
              eyebrow="Theme"
              title="Theme controls"
            />
            <div className="preview-grid preview-grid--two">
              <Card
                className="preview-card preview-card--full-theme"
                padding="default"
                variant="raised"
              >
                <h3 id="theme-heading">Full presentation</h3>
                <ThemeToggle aria-label="Full theme preference" />
                <ThemeStatus />
              </Card>
              <Card
                className="preview-card preview-card--compact-theme"
                padding="default"
                variant="outlined"
              >
                <h3>Compact presentation</h3>
                <p>Keyboard focus reveals the associated option tooltip.</p>
                <div className="preview-compact-wrap">
                  <ThemeToggle
                    aria-label="Compact theme preference"
                    presentation="compact"
                  />
                </div>
              </Card>
            </div>
          </Section>

          <Section spacing="default" aria-labelledby="buttons-heading">
            <SectionHeading
              align="center"
              description={
                <p>
                  Native button and anchor behavior is retained across variants
                  and sizes.
                </p>
              }
              eyebrow="Actions"
              title="Buttons and links"
            />
            <div className="preview-grid" id="buttons-heading">
              <Card
                className="preview-card"
                padding="compact"
                variant="outlined"
              >
                <h3>Button variants</h3>
                <div className="preview-actions">
                  <Button
                    data-testid="activation-button"
                    onClick={() => {
                      setButtonActivations((count) => count + 1);
                    }}
                    size="small"
                    variant="primary"
                  >
                    Primary
                  </Button>
                  <Button size="medium" variant="secondary">
                    Secondary
                  </Button>
                  <Button size="large" variant="ghost">
                    Ghost
                  </Button>
                  <Button disabled>Disabled</Button>
                </div>
              </Card>
              <Card className="preview-card" padding="default" variant="raised">
                <h3>Link buttons</h3>
                <div className="preview-actions">
                  <LinkButton
                    data-testid="activation-link"
                    href="#preview-target"
                    variant="primary"
                  >
                    Open target
                  </LinkButton>
                  <LinkButton
                    href="#preview-target"
                    size="small"
                    variant="secondary"
                  >
                    Secondary link
                  </LinkButton>
                </div>
              </Card>
              <Card
                className="preview-card"
                padding="spacious"
                variant="subtle"
              >
                <h3>Icon action</h3>
                <div className="preview-actions">
                  <IconButton
                    aria-label="Add one activation"
                    data-testid="activation-icon-button"
                    onClick={() => {
                      setIconActivations((count) => count + 1);
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      className="preview-icon"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </IconButton>
                  <IconButton aria-label="Ghost icon action" variant="ghost">
                    <svg
                      aria-hidden="true"
                      className="preview-icon"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="7" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </IconButton>
                </div>
              </Card>
            </div>
            <output
              aria-live="polite"
              className="preview-activation-output"
              data-button-count={buttonActivations}
              data-icon-count={iconActivations}
              data-testid="activation-output"
            >
              Button activations: {buttonActivations}; icon activations:{" "}
              {iconActivations}.
            </output>
          </Section>
        </Container>

        <Container width="full">
          <Section spacing="compact" aria-labelledby="cards-heading">
            <Container width="wide">
              <SectionHeading
                as="h2"
                description={
                  <p>All card variants and padding modes are shown.</p>
                }
                eyebrow="Surfaces"
                title="Cards and badges"
              />
              <div className="preview-grid" id="cards-heading">
                <Card
                  className="preview-card"
                  padding="compact"
                  variant="outlined"
                >
                  <Badge variant="neutral">Outlined</Badge>
                  <h3>Compact padding</h3>
                  <p>Neutral surface with the default border treatment.</p>
                </Card>
                <Card
                  className="preview-card"
                  padding="default"
                  variant="raised"
                >
                  <Badge variant="accent">Raised</Badge>
                  <h3>Default padding</h3>
                  <p>Elevated surface with the package shadow token.</p>
                </Card>
                <Card
                  className="preview-card"
                  padding="spacious"
                  variant="subtle"
                >
                  <Badge variant="positive">Subtle</Badge>
                  <h3>Spacious padding</h3>
                  <p>Quiet surface using the semantic subtle color.</p>
                </Card>
              </div>
            </Container>
          </Section>
        </Container>

        <Container width="content">
          <Section spacing="spacious" aria-labelledby="stress-heading">
            <SectionHeading
              as="h3"
              description={
                <p>
                  This content checks wrapping, focus targeting, visual hiding,
                  and consumer typography overrides.
                </p>
              }
              eyebrow="Composition"
              title="Narrow-layout stress content"
            />
            <div className="preview-grid preview-grid--two" id="stress-heading">
              <Card
                className="preview-card"
                padding="default"
                variant="outlined"
              >
                <h3>Long content</h3>
                <p className="preview-long-text">
                  Reusable-interface-primitives-remain-readable-even-when-a-consumer-supplies-an-unusually-long-unbroken-label-and-the-available-inline-space-is-narrow.
                </p>
                <p>
                  <VisuallyHidden data-testid="visually-hidden-content">
                    Additional context available to assistive technology.
                  </VisuallyHidden>
                  Visible text follows the hidden context in logical order.
                </p>
              </Card>
              <Card className="preview-card" padding="default" variant="subtle">
                <h3>Consumer font variables</h3>
                <div className="preview-font-sample">
                  <span
                    className="preview-font-sample__display"
                    data-testid="display-font-sample"
                  >
                    Display family override
                  </span>
                  <span data-testid="body-font-sample">
                    Body family override applied after package CSS.
                  </span>
                </div>
              </Card>
            </div>
          </Section>
        </Container>

        <Container width="content">
          <Card
            as="section"
            className="preview-target"
            data-testid="preview-target"
            id="preview-target"
            padding="default"
            tabIndex={-1}
            variant="raised"
          >
            <h2>Native link target</h2>
            <p>
              This focusable destination confirms that link buttons retain their
              anchor behavior.
            </p>
          </Card>
          <p className="preview-footer-note">
            End of the deterministic packed-package preview.
          </p>
        </Container>
      </main>
    </div>
  );
}

export function PreviewApp() {
  return (
    <ThemeProvider storageKey={PREVIEW_STORAGE_KEY}>
      <PreviewContents />
    </ThemeProvider>
  );
}
