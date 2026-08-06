## 1. Canvas method

- [x] 1.1 Add `addFieldAfter(type, label)` `@Method()` to `wb-canvas.tsx` that computes the insertion index from `selectedId` (insert at `index + 1` when a selected field is found, else append) and splices a new field with a unique id into `fields`
- [x] 1.2 In `addFieldAfter`, after updating `fields`, emit `wbChange` with the updated list, set `selectedId` to the new field's id, and emit `wbFieldSelected` with the new field

## 2. Host wiring

- [x] 2.1 Update the `wbAddField` listener in `index.html` to call `canvas.addFieldAfter(e.detail.type, e.detail.label)` instead of `canvas.addField(...)`
- [x] 2.2 Update the dev-harness smoke-test description in `index.html` to mention that clicking a palette item inserts after the selected component (or appends when none is selected)

## 3. Public API regeneration

- [x] 3.1 Run the project's Stencil build (or `components.d.ts` generation) so the new `addFieldAfter` method is reflected in the generated public API surface

## 4. Tests

- [x] 4.1 Add unit test(s) in `wb-canvas.unit.test.tsx` verifying a field is inserted immediately after the selected component and `wbChange`/`wbFieldSelected` are emitted
- [x] 4.2 Add unit test(s) verifying a field is appended to the end when no component is selected
- [x] 4.3 Add unit test(s) verifying the newly added field becomes the selected component
- [x] 4.4 Update `wb-palette.unit.test.tsx` (if it asserts append-only click behavior) to reflect selection-aware insertion while keeping the `wbAddField` payload contract unchanged
- [x] 4.5 Run the component test suite and confirm all tests pass

## 5. Verification

- [x] 5.1 Run lint/typecheck for the affected package(s)
- [x] 5.2 Manually smoke-test in the dev harness: click with a selected row (inserts after), click with no selection (appends), and confirm the inspector shows the newly added field
