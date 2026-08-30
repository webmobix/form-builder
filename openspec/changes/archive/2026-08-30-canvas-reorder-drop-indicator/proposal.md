## Why

Dragging an existing element to reorder it inside the canvas gives no visual feedback about where it will land. The same 3px insertion line works when dragging a new element from the palette, so users see the drop position in one flow and get zero feedback in the other — the more common flow feels broken. The rendering machinery already exists; the internal reorder drag simply never activates it.

## What Changes

- Show the existing top-level drop indicator (3px insertion line) while reordering an existing element via its grip handle, at the insertion index the pointer is currently over.
- Reuse the same indicator component/state (`dropTarget`) the palette drag flow uses, so both flows behave identically.
- Hide the insertion indicator when the pointer is outside the canvas row list during a reorder drag (consistent with palette-drag behavior).
- No changes to palette behavior, ordering math, keyboard flows, or events (`wbChange`, `wbFieldSelected` unchanged). Reorder drop/commit logic changes in one way: releasing the pointer outside the canvas row list now cancels the reorder instead of committing to the last in-list hover index (matching palette-drag behavior).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `canvas-preview`: The handle-only reorder requirement currently promises "the existing ghost/insertion-indicator drag flow" but the canvas never renders the insertion indicator during internal reorder drags. Add a requirement that the top-level insertion indicator SHALL be displayed live during grip-handle reorder drags (same indicator, same behavior as palette drags), plus scenarios for indicator position tracking and hiding off-canvas.

## Impact

- `packages/form-components/src/components/wb-canvas/wb-canvas.tsx`: `startDrag.onMove` (lines ~368-376) must update `dropTarget` alongside `hoverIndex` and clear both when the pointer is off the row list; `commitDrop` (lines ~522-538) must clear it; `onGripPointerDown`/`startDrag` must clear stale targets on drag start. Off-list release cancels the reorder (`hoverIndex` is null → no commit).
- `packages/form-components/src/components/wb-canvas/wb-canvas.unit.test.tsx`: new tests for indicator visibility during reorder drag (pointer over row → indicator at index; pointer off-canvas → no indicator; drop indicator state cleared after drop).
- No API, dependency, or spec-visible contract changes beyond the `canvas-preview` spec delta.