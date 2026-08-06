## Context

`wb-palette` is a Stencil web component with shadow DOM. The `.panel` div uses hardcoded values for background, border-radius, padding, and gap. Because of shadow DOM encapsulation, embedding pages cannot override these styles without `::part()` or CSS custom properties. The component does not currently expose any CSS custom properties.

## Goals / Non-Goals

**Goals:**
- Expose `--wb-palette-background`, `--wb-palette-border-radius`, `--wb-palette-padding`, `--wb-palette-gap` on `:host`
- Each var falls back to the current hardcoded value so existing usage is unaffected
- Document the new vars in `readme.md`

**Non-Goals:**
- Exposing vars for `.item` styles (out of scope for this change)
- Changing the component API or behavior

## Decisions

- **Prefix `--wb-palette-`**: Matches the component tag name (`wb-palette`) for discoverability and avoids collisions
- **Fallback on `:host`**: Declaring `--wb-palette-background: #f4f4f2` on `:host` means consumers can set the var on `<wb-palette>` and it cascades into the shadow tree via `var()` usage in `.panel`
- **No `::part()`**: CSS vars are simpler and more composable than `::part()` for theming; consumers can set them at any level in the DOM tree

## Risks / Trade-offs

- CSS vars only affect the four exposed properties; deeper customization still requires `::part()` or component changes
- Var names become part of the public API and must be maintained for backward compatibility
