## Why

Adding a field to the form today requires a click on a palette button, which always appends the field to the end of the canvas. Desktop users expect to drag a field type from the palette and drop it at a specific position in the canvas — the natural, direct-manipulation authoring affordance for a form builder. The codebase already has a proven pointer-based drag for reordering rows within the canvas, but the palette→canvas path is click-only, so desktop authoring feels limited and positions can only be fixed by a second reorder step.

## What Changes

- Add pointer-down initiated drag on `wb-palette` items so a desktop user can press on a palette item and drag it onto the canvas.
- Render a `position:fixed` ghost preview that follows the pointer during the drag (reusing the existing ghost pattern from `wb-canvas`).
- Drive the canvas's existing drop indicator (`hoverIndex`) while a palette drag is in progress, so users see where the field will land before releasing.
- Insert the new field at the hovered index instead of always appending; the click-to-add path remains append-only for backward compatibility.
- Gate the drag initiation on desktop pointer input (fine pointer / mouse) so the existing tap-to-add mobile behavior is preserved unchanged.
- No new third-party drag-and-drop dependency; reuse the custom Pointer Events approach already in the codebase.

## Capabilities

### New Capabilities
- `palette-drag`: Drag a field type from the palette onto the canvas and drop it at a chosen position on desktop, including a live drop indicator and floating ghost preview.

### Modified Capabilities
<!-- No existing specs in openspec/specs/ yet, so no delta specs are required. -->

## Impact

- **Code**:
  - `packages/form-components/src/components/wb-palette/wb-palette.tsx` — add pointer-down drag initiation, ghost element, drag-start/end events.
  - `packages/form-components/src/components/wb-palette/wb-palette.css` — `touch-action`/cursor affordances for draggable items.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — add an index-aware insertion path (e.g. a public `@Method` such as `insertField(type, label, index)`) and a way to drive `hoverIndex` from an external (palette) drag; keep `addField` append-only.
  - `packages/form-components/src/index.html` — wire the new palette drag events to the canvas's insertion/drop-indicator methods.
- **Cross-shadow-boundary hit-testing**: drag starts in `wb-palette`'s shadow DOM and must locate `wb-canvas` rows via `elementFromPoint`/shadow-piercing lookup to compute the insertion index.
- **Dependencies**: none added. Continues to use native Pointer Events + `setPointerCapture`.
- **Stable-key discipline**: any new insertion path must preserve the existing `key={f.id}` discipline documented in `wb-canvas.tsx` to avoid destroying pointer-captured DOM mid-drag.
- **Compatibility**: tap-to-add on mobile remains the only palette→canvas path on coarse pointers; desktop drag is additive and does not change the `wbAddField` event contract.