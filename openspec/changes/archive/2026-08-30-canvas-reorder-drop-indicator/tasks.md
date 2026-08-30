## 1. Reorder drag shows insertion indicator

- [x] 1.1 In `packages/form-components/src/components/wb-canvas/wb-canvas.tsx`, in `startDrag`, reset `dropTarget = null` and `hoverIndex = null` before attaching pointer listeners (clear stale state from previous/external drags)
- [x] 1.2 In `startDrag.onMove`, alongside the existing `hoverIndex` update, set `dropTarget` to `{ kind: 'top', index }` derived from `getInsertionIndex(ev.clientY)`
- [x] 1.3 When the pointer is off the canvas row list during a reorder drag (insertion lookup misses), set both `dropTarget` and `hoverIndex` to `null` so no indicator renders and no drop commits
- [x] 1.4 In `commitDrop`, clear `dropTarget` (set to `null`) together with the existing `hoverIndex`/`draggingId` cleanup

## 2. Tests

- [x] 2.1 Extend `packages/form-components/src/components/wb-canvas/wb-canvas.unit.test.tsx` grip-drag tests: during a reorder drag with the pointer between rows, the `.indicator` element renders at the expected index position
- [x] 2.2 Add test: moving the pointer off the canvas row list during a reorder drag removes the `.indicator` element
- [x] 2.3 Add test: dropping between rows during a reorder drag commits the element at the position the indicator showed (exact final order via `wbChange` payload / `fields`)

## 3. Verification & cleanup

- [x] 3.1 Run the form-components unit test suite and lint (`npm test`, `npm run lint` per package scripts) and fix any failures
- [x] 3.2 Manually verify in the dev playground (`packages/form-components/src/index.html`): reorder via grip shows the moving indicator line; palette drag behavior unchanged; indicator hides off-canvas; no indicator persists after drop