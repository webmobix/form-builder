## Why

The editor canvas currently shows each element as a simplified text chip (label + type badge), so what builders see while assembling a form looks nothing like the form end users will fill in. This forces constant mental translation and hides surprises (field styling, labels, layout proportions) until render time.

## What Changes

- The canvas center area renders every element as its **real form appearance**: data fields via the actual `wb-form-field` component, design elements mirroring `wb-form-renderer` markup (headings, paragraphs, flex row/column layout), replacing the current text-chip rows.
- Fields on the canvas are rendered **disabled/inert**: they look completely normal but cannot be filled, toggled, focused, or open native pickers. Clicking anywhere on an element selects it (inspector wiring unchanged); clicking empty canvas deselects.
- New affordances layered on top of the preview: **hover borders** (solid light-blue on leaf fields, dashed variant on layout containers), a distinct persistent **selection ring**, and an **always-visible drag handle** (floating grip badge at the element's top-left corner). Dragging remains handle-only; existing ghost/insertion-indicator mechanics are kept.
- Editor chrome is hidden by default for realism: type badges appear only as a floating tag on hover/selection, and empty layout columns show a slim dashed "empty slot" strip that disappears once the column has children.
- `wb-form-field` gains a public `disabled` prop (default false) that runs the same disable path as `formDisabledCallback`; CSS overrides the browser's grayed-out disabled styling so disabled fields look normal on the canvas. The real-form renderer's behavior is unchanged.
- Known limitation accepted: "Dropdown" fields continue to render as plain text inputs everywhere (mirroring today's renderer fallback); real `<select>` support is out of scope.

## Capabilities

### New Capabilities
- `canvas-preview`: The editor canvas renders all elements (data fields, design elements, layout rows) as true-to-life previews of the real form — inert controls, hover borders, selection ring, always-visible drag handle, hidden editor chrome with contextual reveal, and realistic column layout including empty-slot placeholders.

### Modified Capabilities
- `design-elements`: The "Canvas renders design-only rows" requirement changes from chip-style rows to realistic previews — headings render as styled headings, paragraphs render their actual `text` body (not the label title), and row containers render real flex columns; selection/emission behavior is preserved. The "Paragraph label is the canvas row title" scenario is superseded by realistic paragraph rendering.
- `richtext-field`: The "Canvas represents rich text fields as summary chips" requirement is replaced: the canvas renders a live read-only Tiptap instance (placeholder visible, toolbar hidden) instead of a non-editable chip.

## Impact

- **Code**:
  - `packages/form-components/src/components/wb-canvas/` — major rework of row rendering (`renderRowBody`, row/column CSS), new hover/selection/handle styles, empty-column slot handling.
  - `packages/form-components/src/components/wb-form-field/` — new public `disabled` prop + disabled-state styling overrides.
  - `wb-form-renderer`, `wb-palette`, `wb-inspector`, dev harness wiring — unchanged.
- **APIs**: `wb-form-field` gains a `disabled` attribute/prop; generated React wrappers (`form-components-react`) must be regenerated. Canvas custom events (`wbFieldSelected`, etc.) unchanged.
- **Dependencies**: none added (no DnD/icon libraries introduced).
- **Performance**: one read-only Tiptap instance per richtext field on the canvas — accepted for fidelity.
