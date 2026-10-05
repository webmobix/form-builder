# Design

## Context

`wb-form-field` is a Stencil web component with shadow DOM. The `css-vars-form-field` change exposed most of its styling as `--wb-field-*` and `--wb-richtext-*` custom properties, but the following richtext values remained hardcoded after that change: toolbar margin-bottom, button line-height, linkbar margin-bottom and input styling, error font-size, editor width, and Tiptap paragraph/heading/blockquote margins and blockquote padding-left. Embedding pages cannot theme these without deep CSS hacks.

## Goals / Non-Goals

**Goals:**
- Expose the remaining richtext literals as `--wb-richtext-*` custom properties
- Keep current hardcoded values as fallbacks so existing usage is unaffected
- Keep layout-critical properties literal
- Document every new property in `readme.md`

**Non-Goals:**
- Changing the component API, markup, or behavior
- Using `::part()` theming
- Adding focus/outline rules or any new behavior
- Exposing `display`, `flex`, `flex-wrap`, `align-items`, `float`, `outline`, `cursor`, `resize`, or `appearance`

## Decisions

- **Extend the existing `--wb-richtext-*` family**: These selectors already use that prefix, so new vars follow it (e.g. `--wb-richtext-linkbar-input-padding`). This mirrors the palette/inspector and prior `css-vars-form-field` approach.
- **Fallback in each `var()`**: Write `var(--wb-richtext-quote-margin, 0.4em 0)` at the point of use rather than declaring defaults on `:host`. Keeps defaults co-located with each rule.
- **Group the linkbar input properties**: `min-width`, `padding`, `font-size`, `border`, and `border-radius` each get their own var under the `--wb-richtext-linkbar-input-*` namespace, matching the per-property input approach used earlier.
- **Layout properties stay literal**: `display`, `flex`, and similar structural properties are not theming concerns; only visual values are exposed.
- **This is a `MODIFIED` delta**: The capability already exists as `form-field-css-vars`, so the change modifies the existing "native controls, state, hint, and richtext" requirement rather than adding a new capability.

## Risks / Trade-offs

- [Var names become public API] → Follow the established `--wb-richtext-*` naming and document them in `readme.md` for compatibility.
- [Larger property surface] → Grouping and consistent naming keep the list navigable; the build verifies the CSS compiles.
