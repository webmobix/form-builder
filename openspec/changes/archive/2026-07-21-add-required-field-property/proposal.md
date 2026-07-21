## Why

The `FieldMeta` data model lacks a `required` property, so form builders cannot mark fields as mandatory. The `wb-form-field` component already supports a `required` prop and enforces it via `ElementInternals` validation, but the inspector has no UI to toggle it, the canvas does not store it, and the form renderer does not forward it. This gap prevents users from building forms with required fields.

## What Changes

- Add `required?: boolean` to the `FieldMeta` interface in `form-core`
- Add a "Required" toggle (checkbox) to the inspector panel for all field types
- Wire the inspector's required toggle through the canvas update flow
- Forward `required` from the form renderer to `wb-form-field`
- Update the field-properties spec to cover the required toggle
- Update the form-renderer spec to cover required forwarding (already partially specified)

## Capabilities

### New Capabilities
- `required-field-property`: Add a `required` boolean property to the field data model, a toggle UI in the inspector, and wire it through canvas and form renderer so required fields are enforced at render time.

### Modified Capabilities
- `field-properties`: Add requirement for a required-field toggle in the inspector panel
- `form-renderer`: Add requirement that the renderer forwards `required` from `FieldMeta` to `wb-form-field` (already specified in scenario, needs implementation)

## Impact

- `packages/form-core/src/types.ts` — add `required?: boolean` to `FieldMeta`
- `packages/form-components/src/components/wb-inspector/wb-inspector.tsx` — add required checkbox UI
- `packages/form-components/src/components/wb-form-renderer/wb-form-renderer.tsx` — forward `required` prop
- `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — no changes needed (already passes through `FieldMeta`)
- `packages/form-components/src/components/wb-form-field/wb-form-field.tsx` — no changes needed (already has `required` prop)
- `openspec/specs/field-properties/spec.md` — add required toggle requirement
- `openspec/specs/form-renderer/spec.md` — add required forwarding requirement
