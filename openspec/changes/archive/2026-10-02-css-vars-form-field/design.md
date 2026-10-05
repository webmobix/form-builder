## Context

`wb-form-field` is a Stencil web component with shadow DOM. Its CSS hardcodes the container font-size, label font-size/color/margin-bottom, required mark color, and native input control styling (plus textarea, select, checkbox, disabled states, hint, and richtext chrome). `wb-palette` and `wb-inspector` already expose a `--wb-*` CSS custom property API (see `openspec/specs/palette-css-vars/spec.md` and `wb-inspector-css-vars/spec.md`). This change extends the same pattern to `wb-form-field`, including the already-partly-themed richtext family.

## Goals / Non-Goals

**Goals:**
- Expose documented CSS custom properties for the container, label, required mark, and native input control
- Keep the current hardcoded values as fallbacks so existing usage is unaffected
- Keep `box-sizing: border-box` unconditional on native inputs

**Non-Goals:**
- Changing the component API, markup, or behavior
- Using `::part()` theming
- Exposing layout-critical properties (`box-sizing`, `display`, `flex`, `resize`, `field-sizing`, `appearance`) as theming knobs

## Decisions

- **Prefix `--wb-field-`**: Matches the component's primary class (`.wb-field`) and the existing `--wb-*` family, keeping names discoverable and collision-free. Richtext styles keep the pre-existing `--wb-richtext-*` prefix.
- **Fallback in each `var()`**: Write `var(--wb-field-label-color, #55554f)` at the point of use rather than declaring defaults on `:host`. This mirrors the palette/inspector approach and keeps defaults co-located with each rule.
- **Separate vars per input property**: `width`, `padding`, `font-size`, `border`, `border-radius` each get their own var. Composite values (padding, border) are exposed as single vars to match how consumers reason about them.
- **Shared `--wb-field-input-*` across native controls**: The textarea and select rules reuse the same input vars rather than introducing per-control vars, so all native controls stay one knob. Only their genuinely distinct values (`textarea` min-height, `select` background) get their own vars.
- **One `--wb-field-disabled-background`**: The disabled background is identical across inputs, textarea, select, and the disabled richtext editor, so a single var covers all of them.
- **`box-sizing` stays literal**: It is layout-critical and not a theming concern.
- **Richtext family completed**: Fill the remaining literals in the existing `--wb-richtext-*` family (editor, toolbar button, linkbar, error, blockquote) for consistency with the already-exposed richtext vars.

## Risks / Trade-offs

- [Var names become public API] → Follow the established `--wb-field-*`/`--wb-richtext-*` naming and document them in `readme.md` for compatibility.
- [Wider conversion increases the chance of a dropped declaration] → The build verifies CSS compiles; keep each rule's property set unchanged and only wrap values in `var()`.
- [Layout properties intentionally stay literal] → `resize`, `field-sizing`, `appearance`, `display`, and `flex` remain non-themable by design.
