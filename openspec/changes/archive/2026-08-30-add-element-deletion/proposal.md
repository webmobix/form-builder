## Why

The builder can only add elements, never remove them. A mis-placed field or design element permanently clutters the canvas, forcing users to reset the whole form and re-enter everything. Deletion is table stakes for a visual form builder, and a correct id lifecycle is critical because ids are persisted: if a removed element's id were reused, saved forms that referenced the old element (e.g. stored submissions keyed by field id, migration diffs) would silently be re-associated with the new element.

## What Changes

- Add an **"×" overlay button** on each canvas element (top-right, next to the type tag) for every element kind (data fields, headings, paragraphs, row containers, and nested children inside row containers).
- Add a **Delete button in the inspector** for the currently selected element; deleting via the inspector SHALL clear the selection and coordinate the canvas removal.
- Removing a row container SHALL remove its entire `children` subtree.
- The canvas SHALL emit a `wbFieldRemoved: CustomEvent<{ id: number }>` event with the removed element's id so hosts can track removals; selection SHALL be cleared (`wbFieldDeselected`) when the removed element was selected.
- **Id lifecycle (non-reuse):** removed element ids SHALL never be reused. The canvas SHALL track a monotonically increasing id counter that only ever grows (deletion does not decrement it), and importState SHALL resync the counter to `max(max id in payload, persisted nextId) + 1`.
- **Serialized next-id tracking:** the canvas SHALL expose `getNextElementId()` returning the next id that would be assigned, so hosts can persist the "next usable id" with the saved form. `importState` SHALL accept an optional `nextId` (marker interface `ImportedState { fields, nextId? }`, plain array still accepted) to restore the persisted counter.
- Storing/persisting forms is out of scope for this library; the change only guarantees the id-lifecycle primitives (`getNextElementId`, `nextId` import, monotonic counter) hosts need to persist forms safely.

## Capabilities

### New Capabilities
- `element-deletion`: Canvas element removal via overlay "×" button and inspector Delete button, `wbFieldRemoved` event, selection clearing, row container subtree removal, and the id non-reuse lifecycle (monotonic counter, `getNextElementId()`, `nextId` on import).

### Modified Capabilities
- `builder-state-import`: `importState` SHALL accept an optional persisted `nextId` and resync the id counter to at least `max(max imported id, provided nextId)` so ids of previously deleted elements are never reused after re-import.

## Impact

- **Code**:
  - `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — overlay "×" button per element (top-level and nested), `removeField(id)` internal mutation handling top-level, nested-column, and row-container-subtree cases, `wbFieldRemoved` event, `getNextElementId()` method, `nextId`-aware counter resync in `importState`.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.css` — overlay button styling (top-right placement next to the type tag, hover affordance).
  - `packages/form-components/src/components/wb-inspector/wb-inspector.tsx` + `wb-inspector.css` — Delete button (both design-element and data-field panels) emitting `wbInspectDelete`.
  - `packages/form-components/src/index.html` — dev-harness wiring: `wbInspectDelete` → `canvas.removeField(id)`; also demonstrate persisting/restoring `nextId` alongside the payload.
  - `packages/form-components/src/core` — no `FieldMeta` shape change needed (ids already exist); counter logic stays canvas-internal.
- **Events (new)**: canvas `wbFieldRemoved: CustomEvent<{ id: number }>`; inspector `wbInspectDelete: CustomEvent<{ id: number }>` — both additive, no breaking change to existing events.
- **API (new methods)**: `canvas.removeField(id)`, `canvas.getNextElementId()`; `canvas.importState(fields | { fields, nextId? })` — backwards compatible (plain `FieldMeta[]` still valid).
- **Dependencies**: none added.
- **Compatibility**: existing saved payloads remain importable; when a host does not persist `nextId`, the counter still resyncs above the max imported id (id reuse across save/load cycles of *different* forms with high-watermark-chasing ids remains possible in that legacy mode — hence the `nextId` recommendation for hosts that store forms).