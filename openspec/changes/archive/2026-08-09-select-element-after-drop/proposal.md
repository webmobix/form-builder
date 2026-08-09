## Why

The palette drag-and-drop path inserts a new field into the canvas but leaves it unselected, so the inspector shows its empty state until the user clicks the new row. The click-to-add path already selects the newly added field and reveals its properties in the inspector. This inconsistency means the two ways of adding a field behave differently, forcing an extra click after a drop.

## What Changes

- After a palette drag is dropped on the canvas, the newly inserted field SHALL be made the selected field.
- Selecting the dropped field SHALL emit the same `wbFieldSelected` event used by the click-to-add path, so the inspector reveals the new field's properties immediately.
- This aligns drag-and-drop behavior with the existing click-to-add behavior (which already selects and reveals the new element).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `palette-drag`: The existing "Insert at hovered index on drop" requirement SHALL be extended so that a successful palette drop selects the newly inserted field and emits `wbFieldSelected`.

## Impact

- `packages/form-components/src/components/wb-canvas/wb-canvas.tsx`: `commitExternalInsert` sets `selectedId` to the new field's id and emits `wbFieldSelected` (mirroring `addFieldAfter`).
- `packages/form-components/src/components/wb-canvas/wb-canvas.unit.test.tsx`: existing palette drop tests SHALL be updated/added to assert the new field is selected and `wbFieldSelected` is emitted.
- No changes to the `wbAddField`/`wbChange` event contracts.
