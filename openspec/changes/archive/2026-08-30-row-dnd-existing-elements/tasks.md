## 1. Enable nested-element drags

- [x] 1.1 In `wb-canvas.tsx` `onGripPointerDown`, remove the top-level-only gate (`this.fields.some(x => x.id === f.id)`) so nested children can call `startDrag`
- [x] 1.2 Verify nested drag start: unit test asserting `draggingId` is set and a ghost is created when a child element's grip receives pointerdown

## 2. Column targeting during internal drags

- [x] 2.1 In `startDrag.onMove`, call `computeColumnDropTarget(x, y)` first; when it returns a target, set `dropTarget` to it and skip top-level indicator computation; otherwise fall through to the existing `getInsertionIndex` path
- [x] 2.2 Add cycle guard in the onMove column branch: when the dragged element is a row container and the candidate container lies within its subtree (`subtreeContains`), reject the column target and proceed with top-level logic
- [x] 2.3 Unit tests: column indicator state (`dropTarget.kind === 'column'`) is set while dragging a top-level element over a column; top-level target is set when not over a container; no column target over the dragged container's own nested container

## 3. Commit moves

- [x] 3.1 In `commitDrop`, add a `dropTarget.kind === 'column'` branch: remove the dragged element via `removeFieldFromTree`, re-resolve the container by `containerId` from the updated tree (abort cleanly with state cleared if it no longer exists), adjust `targetIndex` for same-column moves (decrement when source index < target index, clamp to bounds), splice into `children[colIndex]`, emit `wbChange`
- [x] 3.2 Preserve element identity: no uid increment in the column branch; assert in tests that `id` is unchanged after a move
- [x] 3.3 Unit tests: top-level element into a column; child out of a column to top level; between columns of the same container; within the same column (forward and backward); drop onto the dragged container's own descendant is a no-op with `wbChange` not emitted; drop with no target leaves state unchanged

## 4. Regression & validation

- [x] 4.1 Run the full `packages/form-components` unit test suite; all existing palette-drop, reorder-drag, and row-render tests pass unchanged
- [x] 4.2 Run lint/typecheck for `packages/form-components` and fix any issues
- [x] 4.3 Manual smoke check in demo page (`src/index.html`): drag existing element into/out of/between row columns; verify indicator visuals match palette drags and selection/events behave