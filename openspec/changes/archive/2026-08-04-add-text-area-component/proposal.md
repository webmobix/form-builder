## Why

Form authors currently have no way to capture multi-line free-text input. The only text option is a single-line `<input>`, so any form needing comments, descriptions, or long answers cannot be built with the form-builder today.

## What Changes

- Add a `multiline` flag to text fields. When enabled, the field renders a `<textarea>` instead of an `<input>` while still being the same `text` field type (same palette entry, same data model, same submission semantics).
- Add `initialLines` (number of visible rows shown before content grows) and `maxHeight` (pixel cap before the textarea scrolls instead of growing) properties that are only configurable when `multiline` is on.
- Use the CSS `field-sizing: content` property (with `rows` as the floor) to let the textarea auto-grow to fit its content, capped by `max-height`.
- Expose `multiline`, `initialLines`, and `maxHeight` controls in the inspector, shown only when the field is a `text` field with the plain `text` subtype. Switching `multiline` on/off toggles the rendered control in the form renderer.

## Capabilities

### New Capabilities

- `text-area-field`: Multi-line text input rendered as a `<textarea>` with auto-growing height (via CSS `field-sizing: content`), configurable initial rows and max height, exposed as an inspector-toggle on the existing text field (no new palette entry).

### Modified Capabilities

- `field-properties`: Add `multiline`, `initialLines`, and `maxHeight` to text field metadata and inspector controls.
- `form-renderer`: Render `<textarea>` (with auto-grow CSS) instead of `<input>` when a text field has `multiline` enabled.

## Impact

- `packages/form-core/src/types.ts`: extend `FieldMeta` (and a new `TextAreaOptions` shape) with `multiline`, `initialLines`, `maxHeight`.
- `packages/form-components/src/components/wb-form-field/wb-form-field.tsx` + `.css`: conditional `<textarea>` render path and `field-sizing: content` styles.
- `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`: new multiline toggle + conditional initial-lines / max-height inputs.
- No changes to palette, schema validation, or submission behavior — `multiline` is purely a rendering/UX concern on top of the existing `text` field.