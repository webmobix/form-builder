# Proposal: add-placeholder-to-form-elements

## Why

The rich text field is the only
field type supporting a `placeholder` property today (introduced with the
richtext field change). Other fillable data fields (`text` incl. all
subtypes incl. multiline textarea, `select`, `date`, and `checkbox`) have no
equivalent — form authors cannot give fillers the same hint-style guidance
there, which is an inconsistency in the builder and a capability gap in the
rendered form.

## What Changes

- Generalize the existing `FieldMeta.placeholder` property (currently
  documented as richtext-only) to apply to all fillable data field types:
  `text` (all subtypes, including multiline textarea rendering), `select`,
  `date`, and `checkbox`.
- `wb-form-field` renders the new placeholder targets:
  - `text` (single-line + multiline textarea): set as the native
    `placeholder` attribute on the `<input>`/`<textarea>`.
  - `select`: rendered as a disabled first option with a sentinel value
    ("hint option", distinct from every real option key) shown when no real
    option has been chosen.
  - `date`: rendered as muted hint text below the control (native date
    inputs do not support `placeholder`); styling per design.md.
  - `checkbox`: rendered as muted hint text under the checkbox label row.
- `wb-form-renderer` and `wb-canvas` forward `placeholder` for every data
  field (canvas preview matches live rendering; disabled fields show hints
  as in the live form).
- `wb-inspector` renders the "Placeholder" text input for ALL data field
  types (previously richtext-only), emitting the same `wbFieldUpdated` patch
  shape `{ placeholder }`; clearing the input unsets it.
- **BREAKING** (soft, behavioral): the `placeholder` property was scoped to
  richtext only; consumers relying on other field types ignoring `placeholder`
  will now see it rendered. No stored form definitions need migration — the
  property was always optional.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `richtext-field`: The "Field model carries the richtext type and
  placeholder" requirement is narrowed: `placeholder` is no longer
  richtext-exclusive; it's a generic `FieldMeta` presentation property. The
  richtext-specific rendering requirement (Tiptap Placeholder extension) stays.
- `field-properties`: The "Inspector provides a placeholder input for rich
  text fields" requirement is generalized: the Placeholder input renders for
  every data field type (richtext keeps it too); patch semantics unchanged.
- `form-renderer`: Add requirement that `placeholder` is forwarded for all
  data fields and rendered per control type (native attribute, select hint
  option, muted hint text for date/checkbox).
- `canvas-preview`: Data-field preview now forwards `placeholder` to all
  data fields (wording update from a richtext-scoped mention — it already
  forwarded the prop generically; spec text updated to reflect that hints
  render for all types now).

## Impact

- **Code**: `packages/form-components`
  - `src/core/types.ts` (doc comment on `FieldMeta.placeholder`)
  - `src/components/wb-form-field/wb-form-field.tsx` (+ CSS for date/checkbox
    hint text and select hint option styling)
  - `src/components/wb-form-renderer/wb-form-renderer.tsx` (already forwards;
    verify + tests)
  - `src/components/wb-canvas/wb-canvas.tsx` (already forwards; verify + tests)
  - `src/components/wb-inspector/wb-inspector.tsx` (placeholder input now for
    all data types)
  - README + `components.d.ts` regenerated docs
- **Specs**: `richtext-field`, `field-properties`, `form-renderer`,
  `canvas-preview` (delta specs)
- **No dependency changes** (no new libraries).
- **Out of scope**: design-only elements (heading/paragraph/row) getting
  placeholders, i18n of hint text, help-text concept (distinct from
  placeholder), migration tooling.

Risk: already-shipped forms whose data includes `placeholder` keys on
non-richtext fields (hand-edited JSON) would start showing hints — intended.