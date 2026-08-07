## Context

The `wb-inspector` component's `:host` rule hardcodes its container styling and enforces `min-width: 220px`. This mirrors the pattern already used by `wb-palette` (see `openspec/specs/palette-css-vars`), which exposes CSS custom properties on `:host` with fallbacks to the current hardcoded values.

## Goals / Non-Goals

**Goals:**
- Expose the inspector container's background, border, border-radius, padding, and font-size as CSS custom properties on `:host`, each falling back to the current value.
- Set the inspector width to `100%` and remove `min-width: 220px` so the host controls width.

**Non-Goals:**
- Theming of inner elements (`.input`, `.select`, `.title`, etc.) — out of scope.
- Changing the component's JavaScript or shadow DOM structure.

## Decisions

- **Use CSS custom properties on `:host` with fallbacks.** Each property is declared as `var(--wb-inspector-<name>, <fallback>)`. This keeps the default appearance identical while allowing consumers to override. Follows the established `wb-palette` convention.
- **Property names prefixed `--wb-inspector-`.** Consistent with the existing `--wb-palette-` naming, avoiding collisions.
- **Width `100%` and remove `min-width`.** The host sets the desired width via its own CSS; the inspector fills its host's width by default.
- **Border as a single property.** The border is a composite value (`1px solid #e4e4e0`), so expose it as one `--wb-inspector-border` variable rather than splitting into width/style/color.

## Risks / Trade-offs

- Removing `min-width: 220px` may cause the inspector to look cramped in narrow hosts → Mitigation: consumers can set their own `min-width` on the host; default width is `100%`.
- Exposing border as a single variable is less granular than separate color/width vars → Mitigation: acceptable for this use case; consumers can override the whole border.
