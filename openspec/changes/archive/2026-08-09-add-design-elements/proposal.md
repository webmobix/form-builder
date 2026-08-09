## Why

The form builder today only supports data-collecting fields (text, select, date, checkbox). Real-world forms need design-only elements — headings, explanatory paragraphs, and multi-column row layouts — to structure and guide the user. Without them, authors must break out of the builder to add this presentation markup by hand, which defeats the visual authoring workflow. Adding these as first-class palette entries keeps authoring inside the builder and lets a row container group other fields horizontally with a clear drop affordance.

## What Changes

- Add a **Title/Headline** design-only element: renders as an `<h2>`-style heading in both the canvas row and the rendered form. Carries only a `label` (the heading text). It SHALL NOT contribute to the `wbSubmit` payload and SHALL NOT have a `name`.
- Add a **Paragraph** design-only element: renders as a `<p>`-style text block in both the canvas row and the rendered form. Carries a `text` body (multi-line). It SHALL NOT contribute to the `wbSubmit` payload and SHALL NOT have a `name`.
- Add a **Row container** design-only element: a flex row that holds up to `columns` (default 2) child elements arranged horizontally. Each column is a vertical stack that can hold multiple child fields (the canvas's existing field types plus the new design-only types, including nested row containers).
- On palette drag over a row container, the canvas SHALL show a drop indicator identifying **which column** of the container the dragged element will land in (left/right for a 2-column row, extending to N columns). Dropping inserts the element into that column's vertical stack at the position indicated.
- The renderer SHALL skip design-only elements from the submit payload and SHALL render the heading, paragraph, and row container (with its children laid out in flex columns) in the live form.
- The inspector SHALL show a reduced property set for design-only elements: heading text / paragraph text / column count, and SHALL hide data-field-only controls (required, restrictions, multiline).

## Capabilities

### New Capabilities
- `design-elements`: New design-only palette entries (Title/Headline, Paragraph, Row container) that render in the canvas and the live form but do not submit data, including a row container that arranges children in flex columns with a column-aware drop indicator.

### Modified Capabilities
- `form-renderer`: Renderer SHALL render design-only elements (heading, paragraph, row container with its children) and SHALL omit them from the `wbSubmit` payload.
- `field-properties`: Inspector SHALL render a reduced, element-type-specific property set for design-only elements and SHALL hide data-field-only controls for them.

## Impact

- **Code**:
  - `packages/form-components/src/core/types.ts` — extend `FieldMeta` with a `kind: 'data' | 'design'` discriminator, a `designType: 'heading' | 'paragraph' | 'row'` discriminator, a `text` body for paragraphs, a `columns` number for row containers, and a `children: FieldMeta[][]` (array of columns, each a list of child fields) for row containers.
  - `packages/form-components/src/components/wb-palette/wb-palette.tsx` — add Title/Headline, Paragraph, and Row container palette entries.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — render design-only rows (heading/paragraph/row), support nested children inside row containers, compute the column-aware drop target during palette drag, and insert dropped elements into the targeted column.
  - `packages/form-components/src/components/wb-canvas/wb-canvas.css` — flex row layout for row containers, column stack styling, column drop indicators.
  - `packages/form-components/src/components/wb-form-renderer/wb-form-renderer.tsx` — render heading, paragraph, and row container (with its children); skip design-only elements from the submit payload.
  - `packages/form-components/src/components/wb-inspector/wb-inspector.tsx` — render a reduced property set for design-only elements; hide data-field-only controls.
  - `packages/form-components/src/index.html` — no wiring changes required (palette/canvas/renderer/inspector stay wired as today); verify the dev harness renders nested rows.
- **Stable-key discipline**: nested children inside row containers SHALL keep the existing `key={f.id}` discipline so pointer-captured drag DOM is not destroyed mid-drag.
- **Dependencies**: none added. Reuses native Pointer Events + the existing canvas drag machinery.
- **Compatibility**: existing data fields keep their current shape and behavior; `kind` defaults to `'data'` so previously serialized `FieldMeta[]` imports remain valid.