## 1. Canvas: external-drag public API

- [x] 1.1 Add an `externalDrag` state flag and a guard so `beginExternalDrag()` defensively clears/ asserts `draggingId === null` before setting the flag
- [x] 1.2 Implement `@Method() beginExternalDrag()` that sets the external-drag flag without modifying `fields`
- [x] 1.3 Implement `@Method() setExternalHoverIndex(y: number)` that: returns early if no external drag is active; computes `hoverIndex` via the existing `getInsertionIndex(y)`; clamps to `null` when `y` is outside the `listEl` bounds; runs `autoScrollCheck(y)`
- [x] 1.4 Implement `@Method() commitExternalInsert(type: FieldType, label: string)` that inserts `{ id: ++uid, type, label }` at `hoverIndex` (or appends if `hoverIndex === null`), emits `wbChange`, then clears `externalDrag` and `hoverIndex`
- [x] 1.5 Implement `@Method() cancelExternalDrag()` that clears `externalDrag`, cancels any active auto-scroll rAF, and resets `hoverIndex` to `null`
- [x] 1.6 Ensure `getInsertionIndex` and `autoScrollCheck` work when called from the external path (they already operate on `listEl`/`[data-row]`); refactor only if needed to avoid double rAF scheduling

## 2. Palette: desktop drag initiation

- [x] 2.1 Add `onPointerDown` handler to the palette item button (alongside the existing `onClick`) that only starts a drag when `e.pointerType === 'mouse'` OR `matchMedia('(pointer: fine)')` matches; otherwise let the event fall through to click
- [x] 2.2 On drag start: call `e.preventDefault()` to suppress the native click, capture the pointer on the button via `setPointerCapture(e.pointerId)`, and store the dragged `FieldTypeDef` in component state
- [x] 2.3 Create the floating ghost element in `document.body` (light DOM) showing the field `label`, positioned with `position: fixed` + `transform: translate(clientX, clientY)`, styled to match the canvas reorder ghost
- [x] 2.4 Add `pointermove` and `pointerup`/`pointercancel` listeners on `window` (fallback alongside pointer capture); on move, update the ghost transform and emit a `wbPaletteDragMove` CustomEvent with `{ clientX, clientY }`; on up/cancel, tear down listeners and remove the ghost
- [x] 2.5 Emit `@Event() wbPaletteDragStart` (`FieldTypeDef`) on drag start, `@Event() wbPaletteDragMove` (`{ clientX: number; clientY: number }`) on move, `@Event() wbPaletteDragEnd` (`{ type, label } | null`) on drop (null on cancel)
- [x] 2.6 Ensure a drag that ends without ever moving (a press-and-release on the item) cancels cleanly without emitting a spurious `wbAddField` (since `preventDefault` suppressed click)

## 3. Palette: CSS affordances

- [x] 3.1 Add `touch-action: none` to palette items only when a fine-pointer drag is possible (or unconditionally set on the item but rely on the initiation gate so mobile scroll still works) — confirm mobile scroll is not broken
- [x] 3.2 Add `cursor: grab` (and `cursor: grabbing` during drag) to palette items on fine-pointer devices
- [x] 3.3 Style the floating ghost (reuse/extract the canvas ghost styles if practical, otherwise duplicate the minimal styles)

## 4. Host wiring (index.html)

- [x] 4.1 On `wbPaletteDragStart`: call `canvas.beginExternalDrag()`
- [x] 4.2 On `wbPaletteDragMove`: call `canvas.setExternalHoverIndex(e.detail.clientY)`
- [x] 4.3 On `wbPaletteDragEnd` with a non-null detail: call `canvas.commitExternalInsert(detail.type, detail.label)`; on null detail call `canvas.cancelExternalDrag()`
- [x] 4.4 Verify the existing `wbAddField` → `canvas.addField(...)` click wiring still works alongside the new drag wiring

## 5. Stable-key & edge-case safety

- [x] 5.1 Confirm new fields inserted via `commitExternalInsert` get keys from the same `uid` source and that rows remain keyed by stable `f.id` (no mid-drag DOM destruction)
- [x] 5.2 Confirm a concurrent `addField` (click) during an external drag recomputes `hoverIndex` correctly on the next `setExternalHoverIndex` rather than going stale
- [x] 5.3 Confirm releasing the pointer outside the canvas calls `cancelExternalDrag` and adds no field
- [x] 5.4 Confirm `pointercancel` (e.g. browser interruption) tears down the ghost and cancels

## 6. Tests (Vitest + Playwright browser)

- [x] 6.1 Add a Playwright browser test (desktop viewport): mouse-down on a palette item, move over the canvas at a specific row boundary, assert the drop indicator (`[data-row]` sibling `.indicator`) is rendered at the expected index
- [x] 6.2 Add a test: complete the drop and assert the new field is inserted at the expected index and `wbChange` payload contains the field at that position
- [x] 6.3 Add a test: release the pointer outside the canvas and assert no field is added and no `wbChange` insert fires
- [x] 6.4 Add a test: touch (coarse pointer) `pointerdown` on a palette item does not start a drag and tap-to-add still appends
- [x] 6.5 Add a test: click (no drag) on a palette item still emits `wbAddField` and appends via `addField`
- [x] 6.6 Run the existing canvas reorder tests and confirm they still pass

## 7. Verification

- [x] 7.1 Run `npm run lint` (or the project's lint command) and fix any issues
- [x] 7.2 Run `npm run typecheck` (or the project's typecheck command) and fix any type errors
- [x] 7.3 Run the test suite and confirm all palette/canvas tests pass
- [x] 7.4 Manually verify in the dev server (`npm start` / the Stencil www dev server) that desktop drag inserts at the right index and mobile tap still appends