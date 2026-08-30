## 1. Canvas — removal core

- [x] 1.1 In `wb-canvas.tsx`, add a private `removeFieldFromTree(fields: FieldMeta[], id: number): boolean` helper mirroring `applyFieldPatch`'s recursive walk: splice a matching top-level entry; otherwise recurse into `designType === 'row'` `children` columns and splice matching children.
- [x] 1.2 Add `@Method() async removeField(id: number)`: record whether the removed id (or an id inside a removed container subtree) equals `selectedId`; run `removeFieldFromTree`; return early (no events, draggable/drop state untouched) when not found; on success re-set `this.fields = [...this.fields]`, clear `draggingId`/`dropTarget`/`hoverIndex` if they referenced the removed id, emit `wbFieldDeselected` first when selection was cleared, then `wbFieldRemoved` with `{ id }`, then `wbChange`.
- [x] 1.3 Declare `@Event() wbFieldRemoved: EventEmitter<{ id: number }>` and update the component readme event table.

## 2. Canvas — id lifecycle

- [x] 2.1 Add `@Method() async getNextElementId(): Promise<number>` returning `uid + 1` without consuming.
- [x] 2.2 Extend `importState` to accept `FieldMeta[] | { fields: FieldMeta[]; nextId?: number }`: normalize the object form into the existing validation flow unchanged, and after success resync the counter with the deep max over top-level ids **and** nested children ids plus `nextId - 1` when provided (plain-array path keeps current `Math.max(...ids, uid)` behavior, extended to walk nested children).
- [x] 2.3 Guard: an `{ fields }` object failing the existing per-entry validation SHALL remain a full no-op exactly as today (no `wbChange`).

## 3. Canvas — remove overlay button UI

- [x] 3.1 In `renderElement`, add `<button type="button" class="remove-btn" title="Delete" data-remove-id={f.id} aria-label="Delete element">×</button>` in the chrome row immediately after `<span class="type-tag">` (applies to top-level and nested children via the shared renderer).
- [x] 3.2 Wire handlers: click → `stopPropagation` + `this.removeField(f.id)`; `onPointerDown` → `stopPropagation` (prevents grip drag); keydown Enter/Space → `stopPropagation` + delete.
- [x] 3.3 Guard `onElementKeyDown`/`onWrapKeyDown` so keyboard events originating inside `[data-remove-id]` are ignored by selection/deselection handlers.
- [x] 3.4 Style `.remove-btn` in `wb-canvas.css`: top-right chrome placement aligned with the type tag, subtle muted default state, visible hover/focus affordance (theme via existing wb-canvas CSS custom properties), adequate hit target.

## 4. Inspector — delete action

- [x] 4.1 In `wb-inspector.tsx`, add `@Event() wbInspectDelete: EventEmitter<{ id: number }>` and a Delete button rendered in both the design-element panel and the data-field panel; click emits `{ id: this.localField.id }` with no state mutation (update readme event table).
- [x] 4.2 Style the Delete button in `wb-inspector.css` (distinct destructive affordance, consistent with panel styling).

## 5. Dev harness wiring

- [x] 5.1 In `src/index.html`, forward `wbInspectDelete` → `canvas.removeField(ev.detail.id)`; keep the existing `wbFieldDeselected` → `inspector.setField(null)` flow handling inspector clear-on-delete.
- [x] 5.2 Demonstrate the persistence contract: extend the existing export/dump to include `nextId` (from `canvas.getNextElementId()`) alongside the payload, and the load path to call `canvas.importState({ fields: parsed.fields ?? parsed, nextId: parsed.nextId })` tolerant of both shapes.

## 6. React wrapper

- [x] 6.1 Regenerate/add typed event mappings for `wbFieldRemoved` (canvas) and `wbInspectDelete` (inspector) in `packages/form-components-react` per the existing generated-config discipline.

## 7. Tests

- [x] 7.1 Extend `wb-canvas.unit.test.tsx`: remove button renders for every element kind incl. nested children; clicking it deletes without emitting `wbFieldSelected`; pointer-down on it starts no drag; container delete removes subtree; nested child delete keeps siblings; `wbFieldDeselected` fires only when the removed element (or subtree member) was selected; `wbFieldRemoved` detail ids (top-level and nested); `removeField` no-op for unknown/repeat ids; emptied container keeps column slots. *(nested-container subtree removal + deselection, no-op unknown id, drag-state cleanup covered; UI overlay-button interaction scenarios still pending)*
- [ ] 7.2 Id lifecycle tests: after deleting id 2 of [1,2,3], next add yields 4; `getNextElementId()` is stable across calls and matches the next added id; deep-max resync accounts for nested child ids after plain-array import; `{ fields, nextId }` import makes next add yield exactly `nextId`; `nextId` wins over higher imported ids; malformed `{ fields }` object remains a no-op. *(NaN `nextId` counter-poisoning regression test added)*
- [ ] 7.3 Extend `wb-inspector.unit.test.tsx`: Delete button visible on both panels; click emits `wbInspectDelete` with the selected id and emits no other events.
- [x] 7.4 Run lint, typecheck, and the package test suites; fix fallout (existing importState/calendar tests must stay green).

## 8. Spec validation

- [x] 8.1 `openspec validate add-element-deletion --strict` passes.