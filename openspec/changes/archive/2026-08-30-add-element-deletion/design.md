## Context

`wb-canvas` owns the builder state (`FieldMeta[]`, nested `children: FieldMeta[][]` inside row containers) and mints every element id from a module-level `let uid = 0` counter (`wb-canvas.tsx:5`). There is currently no way to remove an element: the palette only adds, the inspector only patches, and the canvas has no remove path. Ids are the persistence key once a host stores a form ("field id" is stable across sessions), so any delete feature must guarantee ids of deleted elements are never handed out again — otherwise a saved submission or stored binding keyed to the old element silently re-binds to a newly added one.

Existing machinery this builds on:

- Row elements are keyed `key={f.id}` and top-level + nested rows resolve via `data-element-id` attributes.
- `applyFieldPatch(fields, id, patch)` already walks the tree (top-level + container columns) recursively — a template for a recursive `removeFieldFromTree`.
- `importState` already resyncs the counter with `uid = Math.max(...ids, uid)` (never decreasing), but callers cannot restore a counter that is *above* the max id (the case after deletions).
- The canvas already emits `wbFieldDeselected`; the inspector emits `wbFieldUpdated` which the dev-harness page forwards to `canvas.updateField`.

## Goals / Non-Goals

**Goals:**

- Every element (data or design, top-level or nested in a container column) can be deleted from the canvas via an "×" overlay button placed top-right, in the same chrome row as the type tag.
- The inspector gets a Delete button for the selected element; deletion clears selection everywhere.
- Removing a row container removes its whole `children` subtree.
- Ids of removed elements are never reused: the counter is monotonic and can be restored from a persisted "next id".
- Hosts get explicit primitives to persist/restore the id lifecycle: `getNextElementId()` and an optional `nextId` argument on `importState`.

**Non-Goals:**

- Actual persistence/storage of forms (host responsibility).
- Undo/redo, trash bin, or multi-select delete.
- Deleting individual columns of a row container (column count editing already exists).
- Adding id history/garbage tracking beyond the monotonic counter.

## Decisions

**D1 — Deletion lives on the canvas as `removeField(id)`; the inspector only signals intent.**
The inspector emits `wbInspectDelete: CustomEvent<{ id: number }>`; the host page (orchestrator, per the harness's established producer/consumer pattern) forwards it to `canvas.removeField(id)`.
*Why:* the canvas is the single state owner; the inspector never mutates canvas state today. This keeps the existing wiring discipline and works identically for host apps (React wrapper included).
*Alternative considered:* canvas listens to inspector events directly — rejected: breaks the explicit-orchestration pattern the components follow and couples siblings.

**D2 — One recursive tree removal helper mirroring `applyFieldPatch`.**
`removeField(id)` delegates to a private `removeFieldFromTree(fields, id): boolean` that removes a top-level row or recurses into container `children` columns; it returns false when not found. After removal the canvas re-sets `this.fields = [...this.fields]` and emits `wbChange`. Deleting a container removes the subtree naturally (it's one array entry); deleting a nested child splices just that child from its column stack, and a container left with all-empty columns still renders with empty slots (existing empty-slot rendering handles it).
*Alternative considered:* separate top-level and nested APIs (`removeField` / `removeChild`) — rejected: callers shouldn't need to know where the element lives; ids are globally unique already.

**D3 — "×" as an overlay button in the element chrome, not a full-row click sweep.**
Each rendered element gets a `<button class="remove-btn" title="Delete" data-remove-id={f.id}>×</button>` placed in the chrome row next to `<span class="type-tag">`; it `stopPropagation()`s on click so it never triggers select, and its `onPointerDown` stops propagation so it can't start a grip drag. Works for top-level and nested children because `renderElement` is shared.
*Why not a hover-revealed absolutely-positioned secondary row:* the chosen button is hover-revealed but stays inline in the existing chrome row (absolutely positioned at the top-right corner over the slot, next to the type tag), so no extra layout row is added; it keeps the hit target stable (no hover flicker), and stays visible while `dragging` for honest affordance.
*Alternative considered:* right-click context menu — rejected: poor discoverability and no mobile story.

**D4 — Selection clearing on delete, in one place.**
If the removed id (or an id inside a removed subtree) equals `selectedId`, the canvas sets `selectedId = null` and emits `wbFieldDeselected` before emitting `wbFieldRemoved`/`wbChange`. The harness forwards `wbFieldDeselected` → `inspector.setField(null)` (existing wiring), so the panel empties.
*Alternative considered:* inspector clearing itself on its own Delete click — rejected: the canvas must stay authoritative for selection state regardless of delete entry point (overlay vs inspector vs future API callers).

**D5 — Id non-reuse via monotonic counter + persisted `nextId` restore.**
Keep the single `uid` counter; deletion never touches it. `getNextElementId()` returns `uid + 1` (the next id `++uid` will produce) without consuming it. `importState` accepts `FieldMeta[] | { fields: FieldMeta[]; nextId?: number }` and resyncs the counter to `uid = Math.max(uid, maxFieldIdDeep(payload.fields), (nextId ?? 1) - 1)`, so a form saved after deletions restores a counter above every previously minted id. The deep max walk includes nested children since those consume ids too.
*Why a counter instead of tombstones/reuse:* tombstone sets grow unbounded on long editing sessions and requiring hosts to persist them is hostile; a monotonic counter is one integer, and `getNextElementId()`/`nextId` map 1:1 to "the next usable id" the user asked to persist with the schema.
*Alternative considered:* derived max(id)+1 on every insert without persisted counter — rejected: cannot see deleted ids after reload; that's precisely the reuse bug.

**D6 — New event `wbFieldRemoved: CustomEvent<{ id: number }>` emitted after removal.**
Gives hosts (and the React wrapper types) a first-class signal to update persisted drafts. Emitted whenever any element is removed through either entry point. Also clears `hoverIndex`/`dropTarget`/`draggingId` if they referenced the removed element, to avoid dangling indicators.

## Risks / Trade-offs

- [Deleting the selected element leaves the inspector showing a stale field] → D4 clears selection in the canvas; harness wiring already routes `wbFieldDeselected` to the inspector.
- [Id counter drift if a host imports forms and never persists `nextId`] → documented in proposal; legacy plain-array imports still resync above max imported id (current behavior). Recommendation: hosts store `nextId: canvas.getNextElementId()` next to their payload.
- [Overlay button inside a focusable `role="button"` element] → the remove `<button>` is a real button with `stopPropagation` on click/keydown/pointerdown; canvas keyboard handlers target the element only when the event target is not inside the remove button (guard via `closest('[data-remove-id]')`).
- [Nested child delete during an active canvas drag] → deletion stops propagation and is a click, so it cannot interleave with pointer-captured drag; `removeField` also clears stale drag state referencing the removed id.
- [React wrapper event types out of date] → regenerate wrapper event mappings for `wbFieldRemoved`/`wbInspectDelete` as part of tasks (existing generated-config discipline in `form-components-react`).

## Migration Plan

Purely additive: new event, new methods, new optional import shape. No existing API changes; rollback is a revert. Hosts adopt `nextId` persistence at their own pace.

## Open Questions

- None blocking. (Whether the React wrapper should scalpel out per-event types or regenerate wholesale is an implementation detail settled in tasks.)