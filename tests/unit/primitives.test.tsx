import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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
} from "../../src/index.js";

describe("design-system primitives", () => {
  it("preserves native button semantics, defaults, and finite attributes", () => {
    render(
      <>
        <Button>Default action</Button>
        <Button disabled size="large" variant="secondary">
          Save changes
        </Button>
      </>,
    );

    const defaultButton = screen.getByRole("button", {
      name: "Default action",
    });
    const disabledButton = screen.getByRole("button", {
      name: "Save changes",
    });

    expect(defaultButton.tagName).toBe("BUTTON");
    expect(defaultButton).toHaveAttribute("type", "button");
    expect(defaultButton).toHaveAttribute("data-size", "medium");
    expect(defaultButton).toHaveAttribute("data-variant", "primary");
    expect(disabledButton).toBeDisabled();
    expect(disabledButton).toHaveAttribute("data-size", "large");
    expect(disabledButton).toHaveAttribute("data-variant", "secondary");
  });

  it("keeps LinkButton a native anchor", () => {
    render(
      <LinkButton href="/projects" size="small" variant="ghost">
        View projects
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "View projects" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/projects");
    expect(link).toHaveAttribute("data-size", "small");
    expect(link).toHaveAttribute("data-variant", "ghost");
  });

  it("provides the restricted Card element and variant behavior", () => {
    render(
      <>
        <Card>Default card</Card>
        <Card as="div" padding="compact" variant="raised">
          Div card
        </Card>
        <Card as="section" variant="subtle">
          Section card
        </Card>
      </>,
    );

    expect(screen.getByText("Default card").tagName).toBe("ARTICLE");
    expect(screen.getByText("Div card").tagName).toBe("DIV");
    expect(screen.getByText("Div card")).toHaveAttribute(
      "data-padding",
      "compact",
    );
    expect(screen.getByText("Div card")).toHaveAttribute(
      "data-variant",
      "raised",
    );
    expect(screen.getByText("Section card").tagName).toBe("SECTION");
  });

  it("preserves structural semantics and token-led attributes", () => {
    render(
      <Container width="content">
        <Section aria-label="Example section" spacing="compact">
          <SectionHeading
            as="h3"
            description={<p>Supporting context</p>}
            eyebrow="Foundation"
            title="Clear hierarchy"
          />
          <Badge variant="positive">Published</Badge>
        </Section>
      </Container>,
    );

    const section = screen.getByLabelText("Example section");
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveAttribute("data-spacing", "compact");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Clear hierarchy",
    );
    expect(screen.getByText("Published")).toHaveAttribute(
      "data-variant",
      "positive",
    );
    expect(
      screen.getByText("Clear hierarchy").closest(".ui-container"),
    ).toHaveAttribute("data-width", "content");
  });

  it("requires and renders an icon-button accessible name", () => {
    render(
      <IconButton aria-label="Copy code" disabled>
        <svg aria-hidden="true" />
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Copy code" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName("Copy code");
  });

  it("keeps visually hidden content in the accessibility tree", () => {
    render(
      <p>
        <VisuallyHidden>Current status: </VisuallyHidden>
        Ready
      </p>,
    );

    const hiddenText = screen.getByText("Current status:");
    expect(hiddenText).toHaveClass("ui-visually-hidden");
    expect(hiddenText).toBeInTheDocument();
  });

  it("keeps native skip-link href behavior and enhances focus", async () => {
    const user = userEvent.setup();

    render(
      <>
        <SkipLink />
        <main id="main-content" tabIndex={-1}>
          Content
        </main>
      </>,
    );

    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    const main = screen.getByRole("main");

    expect(skipLink).toHaveAttribute("href", "#main-content");
    await user.click(skipLink);
    expect(main).toHaveFocus();
  });

  it("honors a prevented skip-link click", async () => {
    const user = userEvent.setup();

    render(
      <>
        <SkipLink
          onClick={(event) => {
            event.preventDefault();
          }}
        />
        <main id="main-content" tabIndex={-1}>
          Content
        </main>
      </>,
    );

    await user.click(screen.getByRole("link", { name: "Skip to content" }));
    expect(screen.getByRole("main")).not.toHaveFocus();
  });
});
