## Why

Form authors don't think in HTML input `type` values. Today the palette offers a single "Text input" entry, and to get an email, URL, number, or password field the author must add a text field, open the inspector, find the "Subtype" dropdown, and know that `email`/`tel`/`number` map to the input they want. The inspector also exposes a separate "Type" dropdown with values like `text`/`select`/`date`/`checkbox` that mean nothing to a non-technical author. This makes creating the most common fields (email, password, number) a multi-step, jargon-heavy task.

## What Changes

- Add `email`, `url`, `number`, and `password` entries to the palette next to the existing "Text input". Each creates a field whose `type` is still `text` (so the JSON model, validation, and submission path are unchanged) but whose `subtype` is set to `email`, `url`, `number`, or `password` respectively. "Text input" continues to create a `text` field with `subtype: 'text'`.
- Extend `TextSubtype` with `'url'` and `'password'` (the model already has `text`, `number`, `email`, `tel`).
- Extend the palette's `FieldTypeDef` and the `wbAddField` / `wbPaletteDragEnd` event payloads with an optional `subtype` so the canvas can seed the new field's subtype at creation.
- Extend `wb-canvas`'s `addField` / `addFieldAfter` / `commitExternalInsert` methods to accept and persist the `subtype`.
- Remove the "Type" and "Subtype" selectors from the inspector. Replace them with a read-only "Field" display showing the field's friendly name (e.g. "Email", "URL", "Number", "Password", "Text input", "Dropdown", "Date", "Checkbox"), derived from `type` + `subtype`. The author can no longer change a field's type after creation from the inspector.
- Keep type/restriction-specific inputs (min/max/step for number subtype, maxLength for text-like subtypes including url/password, multiline toggle + initialLines/maxHeight for plain text) conditioned on the field's fixed type/subtype as before.

## Capabilities

### New Capabilities

- `text-input-subtypes`: The palette exposes Email, URL, Number, and Password as first-class entries alongside Text input, each creating a `text` field with the correct `subtype`. The canvas insertion methods accept a `subtype` and persist it on the new field.

### Modified Capabilities

- `field-properties`: `TextSubtype` is extended with `url` and `password`. The inspector no longer renders Type and Subtype selectors; it shows a read-only field display name derived from `type` + `subtype`. Restriction and multiline controls remain, conditioned on the (now creation-fixed) subtype.
- `palette-drag`: The `wbAddField` and `wbPaletteDragEnd` payloads carry an optional `subtype` so palette-dropped text-input subtypes seed the new field's subtype. The drag initiation, ghost, indicator, and insertion-index behavior are unchanged.
- `palette-add-position`: The `wbAddField` payload carries an optional `subtype`; click-to-add forwards it to the canvas insertion method. Position and selection behavior are unchanged.
- `form-renderer`: The renderer forwards `subtype` to `wb-form-field` (already does); the spec is updated to cover the new `url` and `password` subtypes rendering as `<input type="url">` / `<input type="password">`.

## Impact

- `packages/form-components/src/core/types.ts`: add `'url'` and `'password'` to `TextSubtype`.
- `packages/form-components/src/components/wb-palette/wb-palette.tsx`: extend `FieldTypeDef` with `subtype?`, add Email/URL/Number/Password entries to `FIELD_TYPES`, emit `subtype` in `wbAddField` and `wbPaletteDragEnd`.
- `packages/form-components/src/components/wb-canvas/wb-canvas.tsx`: accept `subtype` in `addField`, `addFieldAfter`, `commitExternalInsert` and store it on the created `FieldMeta`.
- `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`: remove the Type and Subtype `<select>` elements and their handlers; add a read-only "Field" display with a `displayName(type, subtype)` helper; remove `onTypeChange`/`onSubtypeChange` (and the patch-clearing they did on type switch, since type can no longer change via the inspector). Restriction/multiline inputs remain, gated on the field's fixed `subtype`.
- `packages/form-components/src/components/wb-form-field/wb-form-field.tsx`: no logic change — `getInputType` already returns the subtype for text fields, so `url`/`password` render as `<input type="url">`/`<input type="password">` automatically. Confirm `sync()` validity path treats url/password like text (no number-specific validation).
- `packages/form-components/src/index.html`: no change required — it already forwards `e.detail` wholesale to the canvas methods.
- No changes to form submission, JSON Schema validation, or the React wrapper — `subtype` is an existing optional `FieldMeta` field, only widened with two new literal values.