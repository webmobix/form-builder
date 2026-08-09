## Context

The `wb-canvas` component manages a list of form fields and a selection state (`selectedId`). Two code paths add fields:

- Click-to-add (`addFieldAfter`, `wb-canvas.tsx:53`) inserts a field, sets `this.selectedId = field.id`, and emits `wbFieldSelected(field)`.
- Palette drag-and-drop (`commitExternalInsert`, `wb-canvas.tsx:125`) inserts a field via `splice`, emits `wbChange`, but does NOT set `selectedId` nor emit `wbFieldSelected`.

Because the drop path leaves selection untouched, the inspector (which reacts to `wbFieldSelected`) stays in its empty state until the user clicks the new row. The change makes the drop path select the new field exactly like the click path.

## Goals / Non-Goals

**Goals:**
- After a successful palette drop, the inserted field is selected.
- Selection of a dropped field emits `wbFieldSelected` so the inspector reveals its properties.
- Behavior matches the existing click-to-add path.

**Non-Goals:**
- No changes to the `wbAddField` / `wbChange` contracts.
- No changes to reorder drag (`startDrag`/`commitDrop`), which intentionally keeps the moved field's selection unchanged.
- No changes to how drop position/hover index is computed.

## Decisions

### Select after drop in `commitExternalInsert`
After splicing the new field into `this.fields`, set `this.selectedId = field.id` and emit `this.wbFieldSelected.emit(field)`, mirroring `addFieldAfter`. The field object is already constructed inline before the `splice`; capture it in a local so it can be emitted.

- **Rationale:** Reuses the identical selection mechanism and event the click path relies on, so the inspector behavior is identical with zero changes to the host/inspector.
- **Alternatives considered:**
  - Emitting `wbAddField` and letting the host call `selectField` — rejected: adds host-side wiring and splits selection logic across boundaries for no benefit.
  - Selecting but not emitting the event — rejected: the inspector only updates in response to `wbFieldSelected`, so omitting the event would leave the inspector stale.

### Only select on successful insert
`commitExternalInsert` is only reached with a valid insertion point, so selection always applies there. No branching is needed for "drop outside canvas" since that path never calls `commitExternalInsert` (the drag is cancelled instead).

## Risks / Trade-offs

- [Emitted `wbFieldSelected` triggers inspector re-render immediately after `wbChange`] → The host already handles back-to-back updates in the click path; identical ordering is used here, so no new risk.
- [No `wbFieldDeselected` emitted on drop] → Intended: if nothing was selected, the inspector simply loads the new field; if a different field was selected, `addFieldAfter`/click behavior is the same (a new selection supersedes without a deselect event), so behavior is consistent.
