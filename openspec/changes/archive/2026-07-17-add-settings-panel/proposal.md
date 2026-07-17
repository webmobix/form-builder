## Why

Today the canvas lets users add and reorder fields but provides no way to edit a field after it has been placed. Field properties — label, type, subtype (e.g. "number" vs "text"), and input restrictions (e.g. min/max/step for numbers) — are fixed at the values used when the field was added. Users have to delete and re-add a field to change anything, which is friction the form builder should remove. A settings panel that reflects the currently selected canvas entry gives inline, in-place editing of those properties.

## What Changes

- Add a right-hand **settings panel** (`wb-inspector`) that renders the properties of the field currently selected on the canvas, and is empty when nothing is selected.
- Wire the panel to the canvas's existing `wbFieldSelected` event so selecting a canvas row loads that field's data into the panel.
- Make **label** editable in the panel; changes update the canvas row label live.
- Make **type** editable in the panel (text / select / date / checkbox), updating the canvas row's type.
- Introduce a **subtype** concept for the `text` field (e.g. `text` → free text, `number` → numeric input) selectable in the panel.
- Introduce **restrictions** that apply conditionally based on type/subtype (e.g. when subtype is `number`: min, max, step; when type is `text`: max length). These restrictions are stored on the field and surfaced to the form field component for validation.
- Extend the field data model (`FieldMeta` in `wb-canvas`, `FieldType` and related types in `form-core`) to carry subtype and restrictions.
- Persist edits back to the canvas via a new `wbFieldUpdated` event (or reuse `wbChange`), keeping the existing stable-id discipline.

## Capabilities

### New Capabilities
- `field-properties`: A right-hand inspector panel that reflects the selected canvas field and allows inline editing of its label, type, subtype, and type-specific restrictions, with changes propagated back to the canvas and underlying field model.

### Modified Capabilities
<!-- No existing spec-level capability changes the behavior of palette-drag; canvas selection/editing is newly specified here under field-properties. -->

## Impact

- **New component**: `wb-inspector` in `packages/form-components/src/components/wb-inspector/` (Stencil component rendering the settings form).
- **Modified component**: `wb-canvas` — track a `selectedId`, expose a method to update a field's properties, emit field updates; the existing `wbFieldSelected` event is consumed by the host to drive the inspector.
- **Modified component**: `wb-form-field` — honor subtype and restrictions (e.g. render `<input type="number">` with min/max/step; enforce maxLength) when rendering/validating.
- **Modified core types**: `packages/form-core/src/types.ts` — extend `FieldType`/field meta with `subtype` and a `restrictions` object; align with the JSON Schema surface form-core already reads.
- **Host/integration**: `packages/form-components/src/index.ts` (and any host page) wires `wb-canvas` ↔ `wb-inspector`.
- **Tests**: new unit tests for `wb-inspector`; extend `wb-canvas` tests for selection-driven update flow.