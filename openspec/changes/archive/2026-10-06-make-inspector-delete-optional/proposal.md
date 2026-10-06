# Proposal

## Why

The inspector always renders a Delete button for the selected element, but the canvas already offers a per-element remove "×" overlay. Hosts that want a single, canvas-only deletion affordance cannot remove the inspector button, so it duplicates the action and competes for space in the panel. Making it optional lets each host choose whether the inspector offers deletion.

## What Changes

- Add a boolean prop `showDeleteFieldButton` to `wb-inspector` (default `true`) that controls whether the Delete button is rendered.
- When `showDeleteFieldButton` is `false`, the inspector SHALL NOT render the Delete button in either the data-field panel or the design-element panel. Existing behavior is unchanged when the prop is unset or `true`.
- The inspector's existing `wbInspectDelete` event and the host wiring to `canvas.removeField(id)` remain unchanged; hiding the button only removes the entry point, it does not change deletion semantics.
- Optionally demonstrate the toggle in the `form-components` dev harness (`index.html`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `element-deletion`: The "Inspector offers a delete action for the selected element" requirement becomes conditional on the new `showDeleteFieldButton` prop (default `true`), instead of always rendering the Delete button.

## Impact

- **Code**: `packages/form-components/src/components/wb-inspector/wb-inspector.tsx` (add `@Prop() showDeleteFieldButton` and guard both Delete button render sites). Optionally `packages/form-components/src/index.html` (dev-harness demonstration).
- **Generated/docs**: `wb-inspector/readme.md`, `components.d.ts`, and the `form-components-react` wrapper types/listings regenerate from the new prop; no manual API change beyond regeneration.
- **Tests**: `wb-inspector.unit.test.tsx` gains coverage for the prop's default and hidden states.
- **APIs / Events**: `wbInspectDelete` and `canvas.removeField(id)` are unchanged; no new events or methods.
- **Dependencies**: none.
- **Compatibility**: additive and backward compatible — the default keeps the Delete button visible.
