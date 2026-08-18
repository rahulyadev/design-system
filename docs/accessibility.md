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

Browser-level verification is scheduled for the next phase. This repository has not yet completed axe, browser, 320px viewport, 200% text, forced-colors browser, or no-JavaScript browser verification.
