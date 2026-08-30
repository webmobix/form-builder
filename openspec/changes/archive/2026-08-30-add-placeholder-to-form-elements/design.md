# Design: add-placeholder-to-form-elements

## Context

`FieldMeta.placeholder` exists today and is wired end-to-end for exactly one
field type: `richtext`, via the Tiptap Placeholder extension. The plumbing
that already exists and stays unchanged:

- `FieldMeta.placeholder?: string` in `src/core/types.ts` (doc comment says
  "richtext-only"; needs rewording).
- `wb-form-field` has a `placeholder` @Prop with a `@Watch` (used by the
  Tiptap extension's provider closure).
- `wb-form-renderer` line ~72 and `wb-canvas` line ~597 already forward
  `placeholder={entry.placeholder}` unconditionally to their stamped
  `wb-form-field`s.
- `wb-inspector` already has `onPlaceholderInput` + the
  `{ placeholder: value | undefined }` patch semantics; the input is just
  gated on `isRichtext`.
- Specs: `richtext-field` scopes the property to richtext;
  `field-properties` renders the inspector input only for richtext;
  `form-renderer` does not mention `placeholder` in its forwarding list;
  `canvas-preview` mentions `placeholder` in the forwarded-props list (it
  forwards generically already).

Constraints: Stencil shadow-DOM components, no new runtime deps allowed
(none needed), native controls must stay behaviorally unchanged; the canvas
renders fields in disabled state and must look identical to the live form.

## Goals / Non-Goals

**Goals:**

- One `placeholder` property on `FieldMeta`, valid for all fillable data
  field types (`text` all subtypes, `select`, `date`, `checkbox`, `richtext`).
- Consistent rendering per control type that respects native platform
  behavior.
- Inspector editing for every data field type with unchanged patch
  semantics.
- Canvas previews and live renderer stay visually identical.

**Non-Goals:**

- Placeholders on design-only elements (heading/paragraph/row).
- A separate "help text" / always-visible description concept.
- i18n or translations of hint text.
- Any change to validation or submission payloads (placeholder stays purely
  presentational).
- Migrating stored form definitions (property was always optional).

## Decisions

1. **Keep one property; generalize rather than add per-type props.**
   `placeholder` is already the established name in the model, the
   renderer/canvas forwarding, and the inspector patch path. Alternative
   (a generic `hint` or per-type props like `selectPlaceholder`) would create
   naming churn across every consumer for zero user-visible benefit.
   Rejected.

2. **Rendering per control type uses the platform-appropriate mechanism:**
   - `text` single-line & multiline: native `placeholder` attribute on the
     `<input>`/`<textarea>`. Native styling, empty-value semantics. This is
     what users expect.
   - `select`: a first disabled option with a sentinel value
     (`__wb-form-field-hint__`, "hint option"), **not** an empty-string
     value — a real option may legitimately use an empty key (the inspector
     permits it), which would collide with an empty-value hint and make the
     two indistinguishable. Rationale: once the user has picked a real
     option, the hint can never reappear, matching required-dropdown UX.
     While no real option has been chosen (tracked separately from the
     value, since an empty-key option also reads as `value === ''`), the
     hint is selected so the hint shows. When the field's value is later
     reset shows the hint again via form reset (choice flag → false; value → '').
     Alternative: always-visible muted text above the select — rejected
     (duplicates the label's job). Alternative: empty-string value —
     rejected (collides with empty-key options).
   - `date`: native `<input type="date">` ignores `placeholder`; render the
     hint as muted helper text below the control
     (`.wb-field__placeholder-hint`), shown always when set (like the
     directional hint it is — date pickers don't have an "empty" content
     state we can key off). Alternative: omit date support — rejected, the
     field type is fillable and hints have value.
   - `checkbox`: render hint as muted helper text below the label row
     (`.wb-field__placeholder-hint`). The checkbox itself has no empty state.
   - `richtext`: unchanged — Tiptap Placeholder extension, empty-doc keyed.

3. **Hint styling shares one CSS class.**
   `.wb-field__placeholder-hint` (muted color reusing the existing
   `--wb-richtext-placeholder-color` pattern → rename to a generic
   `--wb-placeholder-color` while keeping the old var as fallback for
   backwards compat). Shadow-scoped, small font, no layout impact on rows.

4. **Canvas keeps stamping fields with `placeholder` forwarded (already
   true).** Because canvas fields render disabled, native placeholders still
   show (disabled inputs display placeholders), and hint text nodes render
   identically. No special-casing.

5. **Inspector shows the input for every data field type.** The
   `isRichtext` gate becomes "always for data fields". Patch semantics stay
   exactly as today (`'' → { placeholder: undefined }`, otherwise
   `{ placeholder: value }`), so the existing `wb-richtext-builder.unit`
   inspector tests keep passing and only their fixture types need widening.

## Risks / Trade-offs

- [Select hint option is part of the DOM, so "no options" no longer means
  "zero `<option>` children"] → The hint option only renders when
  `placeholder` is set; existing spec scenario "no options renders an empty
  `<select>`" continues to hold because an unset placeholder changes nothing.
  Update `select-options` spec wording if its delta requires it
  (it doesn't — behavior unchanged for existing setups).
- [Native placeholder shows for disabled canvas fields — acceptable since
  canvas fields were never editable; preview matches live form which shows
  placeholder in enabled state too] → no action.
- [Users conflate placeholder with always-visible help text] →
  documentation in README clarifies placeholder is an empty-state hint; a
  help-text concept remains a possible future change.
- [Date/checkbox hints are always visible even when the field has a value] →
  accepted trade-off documented in decision 2; keyed-off-empty-state hints
  are impossible for these native controls without heavy DOM surgery.

## Migration Plan

1. Land code changes (types doc, `wb-form-field` rendering branches + CSS,
   inspector gate widening, README/docs regen).
2. Update delta specs (richtext-field, field-properties, form-renderer,
   canvas-preview).
3. Tests pass (`pnpm -r test` in `packages/form-components`); add new unit
   tests for: text input placeholder attr, textarea placeholder attr, select
   hint option presence/selection, date hint text, checkbox hint text,
   inspector input presence per type.
4. Rollback: revert commit — no persisted data, no API surface removal.

## Open Questions

None blocking — placeholder semantics per control type resolved as above
(select = empty-state hint option; date/checkbox = always-visible muted
hint).