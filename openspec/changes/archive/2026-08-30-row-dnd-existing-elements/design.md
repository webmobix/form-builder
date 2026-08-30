## Context

The canvas has a custom Pointer-Events DnD (no third-party library, per `palette-drag` spec). Two drag flows exist and they have diverged:

- **Palette flow** (new elements): `wb-palette.tsx` emits drag events → demo page wires them to `canvas.beginExternalDrag` / `setExternalHoverIndex` / `commitExternalInsert`. `setExternalHoverIndex` calls `computeColumnDropTarget()` first, so palette drags can target row columns (`dropTarget = { kind: 'column', containerId, colIndex, index }`), and `commitExternalInsert` splices into `children[colIndex]`.
- **Internal flow** (existing elements): `onGripPointerDown` → `startDrag` → `commitDrop`. `startDrag.onMove` only computes a top-level insertion index via `getInsertionIndex(y)`; it never calls `computeColumnDropTarget()`. `onGripPointerDown` explicitly refuses to start drags for nested children, and `commitDrop` only splices within the top-level `fields` array.

The indicator UI for column targets (`.drop-line`, `.empty-slot` highlight, `.column.drop-active`) already renders from `dropTarget` state regardless of drag source — the internal flow simply never sets a column target. The `DropTarget` union type already models both kinds.

State owner is `<wb-canvas>` (`@State fields`); mutations end in `this.fields = ...; this.wbChange.emit(this.fields)`. Existing tree helpers: `removeFieldFromTree`, `subtreeContains`, `elementContains`.

## Goals / Non-Goals

**Goals:**
- Move existing elements **into** a row column, **out of** a row column back to top level, and **between** columns (same or different container).
- Column-aware drop indicator during internal drags, visually identical to palette drags (same `dropTarget` state, same CSS).
- Nested children become draggable (source id preserved; no re-minting).
- Prevent dropping a row container into its own descendant.

**Non-Goals:**
- Multi-select drag (one element per drag).
- Touch/keyboard drag alternatives; new drag libraries.
- `FieldMeta` model changes or new events.
- Cross-canvas or cross-shadow drag of existing elements.

## Decisions

### 1. Reuse the existing `DropTarget` model and `computeColumnDropTarget()` — no new state
`startDrag.onMove` gains a first-class column check mirroring `setExternalHoverIndex` (lines 283–305): call `computeColumnDropTarget(x, y)` first; if it returns a target, set `dropTarget` to it (which also suppresses the top-level indicator since the top indicator renders only for `dropTarget.kind === 'top'`); otherwise fall through to the existing top-level `getInsertionIndex` path.

Rationale: the palette flow proves this targeting reliable; duplicating or generalizing hit-testing logic a second way would risk divergent behavior. Alternative considered — a shared "resolveDropTarget" wrapper used by both flows — was rejected as it changes the external API (`setExternalHoverIndex`) during a behavior-only change; the two call sites are 3 lines each and cheap to keep parallel.

Cycle guard is applied here too: if the dragged element is a row container and the candidate container lies inside its subtree (`subtreeContains`), the column target is rejected and top-level logic proceeds (dropping to top level over that area stays possible).

### 2. `commitDrop` gains a column branch: remove-then-insert, id preserved
When `dropTarget.kind === 'column'`: remove the dragged element from wherever it lives via `removeFieldFromTree` (top level or nested), then **re-resolve** the target container from the freshly-updated tree by `containerId`, then splice into `children[colIndex]` at the recorded index. Do *not* increment the uid counter — the element keeps its id (stable-key discipline, `wbFieldSelected` consumers rely on id stability).

Rationale: remove-first avoids duplicate ids/dirty trees from a half-updated insert, and re-resolving the container after removal guards against the removal having mutated (or emptied) the container. Alternative considered — pre-computing one combined immutable update — rejected: harder to reason about same-column index shifts.

**Same-column index adjustment:** if the source column equals the target column of the same container and the original index is `< targetIndex`, decrement `targetIndex` by 1 after removal (compensates for the removal shift). After adjustment, clamp to `0..children[col].length`. A resulting no-op move (index unchanged) still emits `wbChange` for consistency (consumers treat it as a normal update), matching current reorder behavior.

Source state cleanup is shared with the existing path: clear `draggingId`, `dropTarget`, ghost.

### 3. Allow nested children to start drags (drag-out)
Remove the `fields.some(x => x.id === f.id)` gate in `onGripPointerDown` — any rendered element (`data-element-id`, top-level or nested) may call `startDrag`. The ghost/pointer-capture code in `startDrag` is field-agnostic and works for children unchanged. `getInsertionIndex` stays scoped to top-level (`:scope > [data-element-id]`) so top-level indicators are unaffected when a nested drag is over the main list — the element returns to the top level via the standard `commitDrop` top path.

Rationale: minimal change; the render already gives children a grip and `data-element-id`, so drag sources exist. Selecting on grip press stays as-is.

### 4. One drag lifecycle, no API changes
No new events, methods, or CSS. `.drop-line`/`.drop-active`/`.empty-slot` already bind to `dropTarget` and render inside columns regardless of drag source. `wbChange` is the only emitted event on commit; selection of the moved element is unaffected (it remains selected through the move since drag start from its grip implies selection).

## Risks / Trade-offs

- [Same-column index-shift bugs when moving within one column stack] → explicit index adjustment + unit tests covering forward/backward moves within a column.
- [`dropTarget` stale if the container was mutated mid-drag (e.g., removed via inspector)] → commit re-resolves the container by id; if it no longer exists, abort the drop (no mutation) and clear drag state, mirroring the `removeField` guard pattern.
- [Nested drag ghost positioned oddly due to layout offsets] → ghost is already positioned from pointer coordinates, not source rect, in `startDrag`; verify in tests for a nested source.
- [User confusion when a container drag over its own subtree shows a top-level indicator instead of a column one] → acceptable: the top-level drop is a valid escape hatch; the column indicator simply doesn't offer an invalid action.
- [Regressions in palette-drop behavior from shared state] → no shared *code* with the palette flow is changed; internal flow only reads `computeColumnDropTarget`. Existing palette tests must stay green.

## Migration Plan

Pure behavior addition; no data migration (`children` shape unchanged, ids preserved). Rollback = revert the commit. Ship behind existing test suite: all current `wb-canvas` unit tests must pass unchanged (palette-drop path untouched).

## Open Questions

None blocking. (Out-of-scope follow-up if ever needed: dragging multiple children at once, auto-scroll while hovering a container edge during internal drags — auto-scroll already runs for internal drags.)