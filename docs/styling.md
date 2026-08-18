# Styling

The package exposes four explicit CSS subpaths:

- `@rahulyadev/design-system/tokens.css`
- `@rahulyadev/design-system/base.css`
- `@rahulyadev/design-system/primitives.css`
- `@rahulyadev/design-system/styles.css`

`styles.css` is the convenience entry and contains the other three files in `tokens.css`, `base.css`, `primitives.css` order. Consumers must choose either this combined file or the three separate files, not both.

When importing separate files, use this cascade order:

1. Framework or consumer reset
2. `tokens.css`
3. `base.css`
4. `primitives.css`
5. Consumer token overrides
6. Consumer application styles

Base styles are explicit opt-in global styles. No JavaScript entry point imports CSS.

## Tokens and overrides

Supported semantic variable groups are:

- `--color-*`
- `--font-family-*`
- `--font-size-*`
- `--font-weight-*`
- `--line-height-*`
- `--letter-spacing-*`
- `--space-*`
- `--radius-*`
- `--border-*`
- `--shadow-*`
- `--motion-*`
- `--width-*`
- `--page-gutter`
- `--grid-*`
- `--focus-*`
- `--control-min-size`
- `--layer-*`

Consumers should override semantic variables after package CSS. Variables named `--palette-*` and component-local variables are implementation details in v1.

The package does not import fonts. Consumers control font loading and may override the documented `--font-family-*` variables after package CSS.

Selectors beginning with `.ui-` are package-owned implementation selectors. Consumers should not depend on internal DOM structure or generated IDs, and should not edit package files. Prefer semantic variable overrides and public component props.

The package has no Tailwind dependency. CSS values come from the immutable portfolio source baseline and were preserved without redesign in this phase.
