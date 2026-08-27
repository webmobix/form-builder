## Why

The `select` (Dropdown) field currently renders as a plain text input in both the canvas preview and the fillable renderer, and there is no way for a builder to define the choices respondents can pick from. A dropdown without configurable options is useless, so builders need to manage its options in the settings sidebar and respondents need to see a real `<select>`.

## What Changes

- `wb-form-field` renders a native `<select>` element (with `<option>` children) when `type === 'select'`, instead of falling through to a text input.
- `FieldMeta` gains an optional `options?: { key: string; label: string }[]` property (the ordered list of selectable choices). In the editor UI each option uses the same value for `key` and `label`, so the shape is forward-compatible for later extension.
- `wb-inspector` gains an "Options" editor for `select` fields where the builder can add, remove, reorder, and edit the option labels, emitting the updated `options` patch to the canvas.
- `wb-form-renderer` and `wb-canvas` forward `options` to the field so the rendered preview and the fillable form both render a real dropdown.
- `wb-form-field` submits the chosen option value via the existing `ElementInternals`/FormData flow, unchanged.

## Capabilities

### New Capabilities
- `select-options`: Configurable options for the `select` (Dropdown) field — the `FieldMeta.options` property, the inspector option-management UI, and the native `<select>` rendering with value submission in `wb-form-field`.

### Modified Capabilities
- `field-properties`: The `FieldMeta` model gains `options`; the inspector renders an Options editor for `select` fields and continues to hide restriction inputs for `select`.
- `form-renderer`: `wb-form-field` renders a `<select>` for `select` fields and forwards `options`; renderer passes `options` through.

## Impact

- **Code**: `packages/form-components` — `src/core/types.ts` (`FieldMeta.options`, `FieldType` unchanged), `wb-form-field.tsx` (render `<select>` + value submission), `wb-inspector.tsx` (Options editor), `wb-form-renderer.tsx` (forward `options`), `wb-canvas.tsx` (forward `options`), `wb-form-field.css` (select styling).
- **APIs**: No breaking changes — `options` is a new optional property; submission contract stays a flat `Record<string, string>` with the selected option's key.
- **Tests**: Unit tests for `wb-form-field` select rendering/submission, `wb-inspector` option management, and `wb-form-renderer` forwarding.
