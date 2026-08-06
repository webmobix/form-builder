## Why

Clicking a palette item currently always appends the new field to the end of the canvas. When a builder has a specific component selected, they expect the newly clicked item to be inserted immediately after that selected component, matching the behavior of drag-and-drop but with a single click.

## What Changes

- Add a new canvas method `addFieldAfterSelected` (or extend `addField`) that inserts a field at a position based on the current selection.
- When a component is selected in the canvas, a palette click inserts the new field **directly after** the selected component.
- When nothing is selected, a palette click continues to **append** the field to the end (current behavior).
- The newly added field becomes the newly selected component.
- The `wbAddField` event payload and the drag-and-drop flow remain unchanged.

## Capabilities

### New Capabilities
- `palette-add-position`: clicking a palette item inserts the new component after the currently selected canvas component when one is selected, or appends to the end when nothing is selected.

### Modified Capabilities
- `palette-drag`: the existing "click-to-add remains append-only" requirement changes so that click-to-add appends only when no component is selected, and inserts after the selected component when one is selected. The `wbAddField` contract stays the same.

## Impact

- `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — `addField` insertion logic and selection handling.
- `packages/form-components/src/index.html` — dev harness wiring for the palette → canvas add path.
- `packages/form-components/src/components/wb-palette/wb-palette.unit.test.tsx` and `wb-canvas.unit.test.tsx` — tests.
- Public canvas `@Method()` API surface (`components.d.ts` regenerated).
