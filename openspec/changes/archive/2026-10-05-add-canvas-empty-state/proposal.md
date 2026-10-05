## Why

When the canvas has no elements it renders as a blank scroll area with no starting hint. Hosts embedding the builder frequently want to show their own onboarding copy, illustration, or "drag a field here" guidance in that blank space, but `wb-canvas` currently renders no `<slot>`, so any children the host passes into the element are silently ignored. The blank canvas should be a spot hosts can fill without giving up the drop target.

## What Changes

- Add an **unnamed `<slot>`** to `wb-canvas`, rendered inside the existing scrollable drop container only when the top-level field list is empty (`fields.length === 0`). Host-provided children become the canvas's default/empty content.
- When at least one field exists, the slot is **not rendered**, so the passed children are hidden and the normal field list is shown.
- The canvas **remains a palette drop target** while the empty content is shown: a palette drag over the canvas still resolves the top-level insertion index (0) and commits the new element, replacing the empty content with the field list.
- If the host passes **no children**, nothing new is displayed — the existing blank-canvas behavior is preserved (no built-in placeholder is added).
- The empty content sits inside the existing `.wrap` drop container and carries no `data-element-id`, so it never participates in insertion-index computation or row/column hit-testing.
- The canvas **fills the height available from its container**: `:host` becomes a full-height flex column and `.wrap` grows to fill it, so the empty region can occupy the full vertical space. When the container provides no height, the canvas falls back to sizing to its content.
- The default content is **centred vertically** within that region, so hosts can present onboarding copy in the middle of the empty canvas. The field list keeps its existing top-aligned scroll behaviour.

## Capabilities

### New Capabilities
- `canvas-empty-state`: host-provided default content shown through a slot when the canvas has no elements, while the canvas continues to accept palette drops into that empty state.

### Modified Capabilities
<!-- None. The existing `palette-drag` requirement already inserts at the hovered index (0 on an empty canvas); the empty state is additive and does not change any existing requirement. -->

## Impact

- **Code**:
  - `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — render the empty-state `<slot>` inside `.wrap` when `fields.length === 0`.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.css` — empty-state wrapper styling plus an optional `--wb-canvas-empty-min-height` hook (default `0` so a host that passes no children sees no new box); full-height canvas layout (`:host` flex column, `.wrap` fills it) and centred default content.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.unit.test.tsx` — slot presence/absence and empty-canvas drop tests.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.cmp.test.tsx` — browser projection and full-height/centring coverage.
  - `packages/form-components/src/index.html` — demonstrate default content in the dev harness, stretched to the available height.
- **API**: additive — a new default slot only. No props, events, or `@Method()`s change; existing hosts that pass no children are unaffected. `@webmobix/form-components-react` already forwards `children` to the custom element, so no generated-wrapper change is required.
- **Dependencies**: none added.
- **Compatibility**: the slot is additive; passing children is the only opt-in. The canvas surface no longer caps at `60vh` — it fills the height its container provides (falling back to content height when the container gives none). Hosts that relied on the 60vh scroll cap should give the canvas a definite height, which the new layout fills, or set a height on the host.
