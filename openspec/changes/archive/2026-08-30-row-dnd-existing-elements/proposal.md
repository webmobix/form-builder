## Why

Drag and drop of **existing** canvas elements currently only supports top-level reordering. The palette "new element" flow supports dropping into row-container columns, but moving an already-placed element **into** a row column, **out of** a row column, or **between** columns is impossible: the internal drag path (`startDrag`/`commitDrop` in `wb-canvas.tsx`) is entirely top-level-only, and nested children can't even start a drag. Users build rows via click-to-add or palette drops today and must delete/re-create elements to rearrange them — a major workflow gap for the form editor.

## What Changes

- Existing elements (top-level and nested row children) become draggable.
- Row-container columns become drop targets during **existing-element** drags, mirroring the palette drop behavior: column-aware drop indicator, insert position, and `wbChange` emission.
- Elements can be moved **into** a row container column, **out of** a row container back to the top level, and **between** columns of the same or different row containers.
- Nested children get drag capability (they currently only select on grip press).
- Dragging a container onto its own descendant is prevented (cycle guard).
- Internal reorder path reuses the same column-drop-target computation and drop-line UI already used by palette drags, so behavior and visuals stay consistent.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `design-elements`: Extend the existing column-drop requirements (currently scoped to palette drags) so the same column-aware indicator/insert semantics apply to drags of existing canvas elements, and add move semantics (remove-from-source + insert into target, id preserved).

## Impact

- **Code**: `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` (main work: `onGripPointerDown`, `startDrag.onMove`, `commitDrop`), minor ripple in `wb-canvas.css` only if indicator markup is shared. No palette changes needed.
- **Public API / events**: No event signature changes. `wbChange` payload gains richer `children` shapes as elements move in/out. No new events.
- **Model**: No `FieldMeta` changes; ids remain stable and globally unique across moves.
- **Dependencies**: None added (custom Pointer Events implementation stays; spec `palette-drag` forbids third-party drag deps).
- **Tests**: `wb-canvas.unit.test.tsx` gains coverage for internal column drags, nested drag start, move-out commit, and cycle guard.
- **Specs**: `openspec/specs/design-elements/spec.md` requirements updated via delta in this change.