# Accessibility

## Package responsibilities

The package preserves native semantic elements and provides these behavior contracts:

- `Button` defaults to `type="button"`.
- `IconButton` requires an accessible name through its type contract.
- Base CSS supplies visible focus treatment.
- Tokens and primitive CSS supply minimum control sizing.
- `SkipLink` retains a native hash destination and enhances focus when its target exists.
- `ThemeToggle` is a labeled radiogroup with one checked radio, roving focus, and Arrow, Home, and End keyboard behavior.
- The compact theme presentation associates each control with a tooltip through `aria-describedby`.
- Copied CSS retains reduced-motion behavior and forced-colors treatment for the theme toggle.
- `VisuallyHidden` keeps content available to assistive technology.

## Consumer responsibilities

Consumers must provide meaningful accessible names, choose correct button intent and link destinations, maintain heading order and landmarks, and ensure the `SkipLink` focus target exists and can receive focus. `ThemeProvider` must surround theme controls. Composed application behavior must be tested in the consuming application.

Do not remove the package focus treatment without an equivalent replacement.

Local browser automation covers Chromium 151.0.7922.34, Firefox 153.0, and WebKit 26.5 in the digest-pinned Playwright 1.62.1 image. The packed preview has zero unresolved axe violations in light, dark, system, desktop, and 320px cases; engine-specific projects exercise keyboard order, focus treatment, radiogroup navigation, tooltip association, 44 CSS-pixel targets, reduced motion, responsive layouts, no JavaScript, and a 200% text-size proxy. Forced-colors behavior is exercised in Chromium, the engine used for that emulation.

Automation does not replace human inspection, assistive-technology testing, real browser zoom, operating-system text scaling, or consumer-application testing. The 200% case changes the root font size and uses preview-scoped semantic token overrides to create a deterministic stress proxy; it is not a browser-zoom claim. See [Testing](testing.md) for exact commands, versions, and evidence boundaries.
