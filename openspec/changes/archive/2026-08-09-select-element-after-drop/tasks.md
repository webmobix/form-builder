## 1. Implementation

- [x] 1.1 In `wb-canvas.tsx`, modify `commitExternalInsert` so it captures the constructed field in a local variable before `splice`, sets `this.selectedId = field.id`, and emits `this.wbFieldSelected.emit(field)` after emitting `wbChange` (mirroring `addFieldAfter`).
- [x] 1.2 Confirm no other callers rely on the drop path leaving selection untouched; leave `addFieldAfter` behavior unchanged.

## 2. Tests

- [x] 2.1 Add a test asserting that `commitExternalInsert` sets `selectedId` to the newly inserted field's id.
- [x] 2.2 Add a test asserting that `commitExternalInsert` emits `wbFieldSelected` with the newly inserted field.
- [x] 2.3 Update any existing palette-drop tests that assumed the inserted field is not selected.

## 3. Verification

- [x] 3.1 Run the wb-canvas unit tests for `packages/form-components` and ensure they pass.
