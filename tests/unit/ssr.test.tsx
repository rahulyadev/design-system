// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Badge,
  Card,
  Container,
  Section,
  SectionHeading,
  VisuallyHidden,
} from "../../src/index.js";
import {
  ThemeProvider,
  createThemeBootstrapScript,
  useTheme,
} from "../../src/theme/index.js";

function ServerThemeProbe() {
  const { effectiveTheme, preference } = useTheme();

  return <output>{`${preference}:${effectiveTheme}`}</output>;
}

describe("server rendering", () => {
  it("imports both public JavaScript entry points without browser globals", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(typeof globalThis.document).toBe("undefined");
    expect(typeof globalThis.localStorage).toBe("undefined");
    expect(typeof globalThis.matchMedia).toBe("undefined");
    expect(createThemeBootstrapScript()).toContain("document.documentElement");
  });

  it("renders non-interactive primitives without browser access", () => {
    const html = renderToString(
      <Container>
        <Section>
          <SectionHeading title="Foundation" />
          <Card>
            <Badge>Stable</Badge>
            <VisuallyHidden>Current status:</VisuallyHidden>
          </Card>
        </Section>
      </Container>,
    );

    expect(html).toContain("ui-container");
    expect(html).toContain("ui-section");
    expect(html).toContain("ui-card");
    expect(html).toContain("ui-visually-hidden");
  });

  it("uses the stable system:light server snapshot", () => {
    const html = renderToString(
      <ThemeProvider>
        <ServerThemeProbe />
      </ThemeProvider>,
    );

    expect(html).toContain("system:light");
  });
});
