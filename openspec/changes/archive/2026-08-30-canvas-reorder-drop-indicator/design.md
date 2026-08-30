## Context

The canvas (`wb-canvas`) implements two pointer-event drag flows with no DnD library:

- **Palette drag** (new element in): the host page calls `setExternalHoverIndex(x, y)` on each palette drag-move. That method sets **both** `dropTarget` and `hoverIndex`, and the render keys the top-level 3px `.indicator` line off `dropTarget` (`this.dropTarget?.kind === 'top' && this.dropTarget.index === idx` at wb-canvas.tsx:513/517). Column drops use `dropTarget.kind === 'column'`.
- **Internal reorder drag** (existing element via grip handle): `startDrag`'s `onMove` (wb-canvas.tsx:368-375) only updates `hoverIndex`; it never sets `dropTarget`. Therefore `render()` never shows the indicator during reorder — this is the bug. The dragged row still gets `.dragging` (opacity) styling and a floating ghost follows the pointer, but there is no visible insertion point.

`getInsertionIndex(y)` computes an index over `:scope > [data-element-id]` rows (including the dragged row itself). `commitDrop` converts that index to a final position with `adj = hoverIndex > from ? hoverIndex - 1 : hoverIndex` (wb-canvas.tsx:529). This math already produces the correct final order; the palette flow's top-level branch uses the same computation via `setExternalHoverIndex`.

## Goals / Non-Goals

**Goals:**
- Show the existing top-level insertion indicator during grip-handle reorder drags, live-tracking the pointer.
- Reuse the existing `.indicator` rendering and `dropTarget` state; no new UI primitives.
- Keep palette-drag behavior, column drop targets, and commit/update math unchanged.

**Non-Goals:**
- Redesigning the indicator visuals or adding animations.
- Supporting reorder of nested children inside row containers (still select-only).
- Column reorder targets during internal reorder (top-level rows only, as today).
- Touch/coarse-pointer drag initiation (unchanged; existing behavior only).

## Decisions

1. **Set `dropTarget` in the reorder `onMove` alongside `hoverIndex`** — when the pointer is over the row list, set `dropTarget = { kind: 'top', index: hoverIndex }`; when off the row list, set it to `null` (and `hoverIndex = null`), matching palette behavior where no target commits and no indicator shows.
   - *Why:* `render()` already keys the `.indicator` off `dropTarget`; this makes both flows share one source of truth instead of adding a parallel indicator flag for reorder.
   - *Alternative considered:* render the indicator from `hoverIndex` directly. Rejected: `dropTarget` also encodes "pointer is over a valid target at all", which palette flow relies on; a second flag would risk divergent states (indicator shown with no committable target and vice versa).

2. **Clear stale drop state on drag start** — `startDrag` resets `dropTarget = null` and `hoverIndex = null` before listeners attach, so a previous drag's indicator cannot flash at drag start.
   - *Alternative considered:* rely on `commitDrop` cleanup only. Rejected: a drag that starts before the previous cleanup (or after an external drag left state) could show a stale indicator.

3. **Keep insertion-index math as-is** — `getInsertionIndex` counts the dragged row (rows are not removed from the DOM during drag), and `commitDrop`'s `adj` adjustment handles the off-by-one. The indicator index `i` therefore visually means "the line sits between rows i-1 and i", and dropping there produces exactly that order.
   - *Alternative considered:* compute indexes excluding the dragged row. Rejected: it would change commit math shared with the palette flow for no user-visible benefit.

4. **Cleanup symmetric with commit** — `commitDrop` clears `dropTarget` together with `hoverIndex`/`draggingId`. No separate cleanup path is added.

## Risks / Trade-offs

- [Off-by-one/regression in reorder commit] → The indicator and commit share `getInsertionIndex`/`adj` math, so tests assert exact final order after drag-drop (existing grip drag tests at wb-canvas.unit.test.tsx:528+ extended with indicator assertions).
- [Stale indicator if a reorder is interrupted (pointercancel not handled today)] → Out of scope; note that `cancelExternalDrag` exists for external drags but internal drags rely on `pointerup`. Behavior is no worse than the current drag flow; existing pre-render cleanup (`dropTarget = null` in the pre-render/teardown path at wb-canvas.tsx:295) covers disconnection.
- [Indicator flicker when moving across nested children inside row containers] → `getInsertionIndex` only considers top-level rows via `:scope > [data-element-id]`; moving within a row container still yields an index over top-level rows, as today's commit behavior already implies.

## Migration Plan

Internal-only change in `wb-canvas`; no API, event, template, or persisted-state changes. Ship with unit tests; rollback is a single-file revert.

## Open Questions

(none)