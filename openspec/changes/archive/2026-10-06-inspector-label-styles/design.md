# Design

## Context

See `proposal.md` — Why. The relevant current state:

- `wb-inspector` renders every label as `<span class="field-label">`. Stacked labels live inside `.field-group` (column flex), while checkbox labels live inside `.field-group.field-group--checkbox` (row flex). Because both use the same `.field-label` rule, they are currently indistinguishable.
- Label styling is inside the shadow root, so hosts cannot target it with light-DOM selectors. The established project convention for cross-boundary theming is CSS custom properties on `:host` with fallbacks (see `wb-inspector-css-vars` and `palette-css-vars`), not `::part`.
- The data-field panel renders a read-only block: `<div class="field-group"><span class="field-label">Field</span><span class="field-display">{displayName(...)}</span></div>`. The `displayName()` helper and the `FieldType`/`FieldSubtype` imports exist only for that block.
- Note: `.field-label` currently declares `color: oklch(#0a0a0a, 0.7)`, which is not valid CSS (a hex cannot be an `oklch()` lightness/chroma argument), so the browser drops it. Effective label color is inherited. The fallback chosen below uses `#0a0a0a` to keep the same near-black appearance; the user can refine it while tuning defaults.

## Goals / Non-Goals

**Goals:**

- Add a distinct class hook for checkbox labels while keeping `.field-label` as the stacked (above-input) hook, so stacked and inline labels are separately targetable.
- Route both label kinds through separate, documented CSS custom property groups with distinct fallbacks.
- Remove the data-field "Field" display entry and its now-dead helper/imports.

**Non-Goals:**

- Restyling inputs, selects, buttons, section titles, or the design-element "Element" display.
- Introducing `::part` or exposing shadow DOM structure.
- Finalizing the default look of the label kinds — the user will tune the fallback values after this change.
- Changing `FieldMeta`, events, methods, or component props.

## Decisions

- **Keep `.field-label` as the stacked hook; add `.field-label--checkbox` for inline checkbox labels.** This is the smallest change that creates two targetable kinds: base class unchanged for the majority of labels, modifier only on the checkbox spans (Required, Multiline, extension checkboxes). Alternative considered: rename both to fully symmetric classes (`.field-label--stacked` / `.field-label--checkbox`). Rejected because it touches far more JSX for no behavioral gain; the modifier approach still yields two distinct hooks.
- **Separate CSS custom property groups per label kind, with checkbox fallbacks chaining to the field-label vars on shared axes**: `--wb-inspector-field-label-*` and `--wb-inspector-checkbox-label-*`, each covering color, font-size, font-weight, and letter-spacing. The checkbox color and font-size fallbacks reference the matching field-label vars, so a field-label override cascades to checkbox labels; the checkbox weight and letter-spacing keep independent fallbacks. Alternative considered: one shared `--wb-inspector-label-*` set with per-kind modifier overrides. Rejected: distinct groups make the two kinds independently themeable while still letting the checkbox group inherit the shared axes by fallback.
- **Checkbox label defaults stay visibly distinct on weight and letter-spacing, but are provisional.** Stacked label fallback: weight `600`, letter-spacing `0.5px` (preserves current look). Checkbox label fallback: weight `400`, letter-spacing `normal`, with color and font-size inherited from the field-label fallbacks. This satisfies both the field-label cascade and the spec's "visually distinguishable" requirement while leaving the exact defaults for the user to tune; the spec marks the fallbacks provisional.
- **Remove the whole `Field` block, its `displayName()` helper, and the `FieldType`/`FieldSubtype` imports.** Keep `designDisplayName()` and the design "Element" line untouched, since the request names only the data-field `Field` entry.
- **Update the unit test suite** by deleting the "shows the read-only Field display name for each subtype" test; the design "Element" display tests stay.

## Risks / Trade-offs

- [Provisional fallbacks may not match the final design] → Mitigation: fallbacks are isolated to CSS var defaults and the readme table; changing them is a one-line-per-property edit with no logic impact.
- [Existing `.field-label` color was invalid and silently inherited; setting `#0a0a0a` could theoretically differ from a host that styled inherited color] → Mitigation: near-black matches default text; hosts that relied on it can set `--wb-inspector-field-label-color`.
- [Removing the "Field" display is user-visible and existing tests assert it] → Mitigation: update tests in the same change; the removal is covered by a REMOVED spec requirement.
- [A future checkbox added to the inspector might forget the modifier class] → Mitigation: the spec requires every checkbox label to use the inline style, so review/tests catch omissions.
