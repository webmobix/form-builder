## Context

The `FieldMeta` interface in `form-core` currently has no `required` property. The `wb-form-field` component already accepts a `required` prop and enforces it via `ElementInternals.setValidity` with `valueMissing`. The inspector has no UI to toggle required, the canvas does not store it, and the form renderer does not forward it. This is a small, self-contained change that touches the data model, inspector, and renderer.

## Goals / Non-Goals

**Goals:**
- Add `required?: boolean` to `FieldMeta` so the data model carries the flag
- Add a "Required" checkbox toggle in the inspector for all field types
- Forward `required` from the form renderer to `wb-form-field`
- Update specs to cover the new behavior

**Non-Goals:**
- No changes to `wb-form-field` validation logic (already works)
- No changes to `wb-canvas` (it passes through `FieldMeta` as-is)
- No changes to JSON Schema `required` keyword handling in `FormValidator`
- No conditional required logic (e.g., "required only if another field has value X")

## Decisions

1. **`required` as a direct `FieldMeta` property** — Placing `required?: boolean` directly on `FieldMeta` (rather than inside `restrictions`) is the simplest approach. It applies uniformly to all field types, and the `wb-form-field` component already reads it as a top-level prop. No need for a nested structure.

2. **Checkbox toggle in inspector** — A checkbox is the natural UI for a boolean property. It will appear below the label input and above the type selector, visible for all field types. The inspector emits a patch with `{ required: true/false }` on toggle.

3. **No default value in FieldMeta** — `required` is optional (`required?: boolean`). When undefined/false, the field is not required. This matches the existing `wb-form-field` default (`required = false`).

4. **Form renderer forwards `required`** — The renderer already has a scenario in its spec for forwarding `required`. The implementation is a one-line addition: `required={entry.required}` on the `<wb-form-field>` element.

## Risks / Trade-offs

- **No risk** — This is a backward-compatible additive change. Existing `FieldMeta` objects without `required` continue to work (treated as not required).
- **Trade-off: boolean vs. JSON Schema `required` array** — The `FieldMeta.required` flag is per-field, while JSON Schema uses a `required: string[]` at the schema level. These serve different purposes: the flag drives UI/component behavior, while the schema array drives data validation. They are complementary, not competing.
