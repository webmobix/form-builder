## Context

The builder is a Stencil web-components monorepo (`packages/form-components`). Today every canvas entry is a flat `FieldMeta` with `id`, `type` (`text` | `select` | `date` | `checkbox`), `label`, and optional data properties (`subtype`, `required`, `restrictions`, `multiline`, …). The canvas (`wb-canvas.tsx`) renders a flat reorderable list of rows keyed by `f.id`; the renderer (`wb-form-renderer.tsx`) maps each entry to a `wb-form-field`; the inspector (`wb-inspector.tsx`) edits data-field properties. Palette drag inserts at a vertical `hoverIndex` over the canvas row list. There is no notion of containers or non-data elements.

We need design-only elements (Title/Headline, Paragraph, Row container) that render in both the canvas and the live form but do not submit data. The row container must hold children arranged in flex columns, with a column-aware drop affordance.

## Goals / Non-Goals

**Goals:**
- Introduce design-only elements as first-class canvas entries with minimal disruption to the existing flat-list model.
- Support a row container with N (default 2) flex columns, each a vertical stack of children.
- Show a clear drop indicator that identifies the target column during a palette drag over a row container.
- Keep the renderer's submit payload free of design-only elements.
- Keep the inspector's property set element-type-specific (reduced for design-only elements).
- Preserve backward compatibility for previously serialized `FieldMeta[]` (import path).

**Non-Goals:**
- Arbitrary-depth nesting beyond what the canvas naturally renders. (Row containers can hold children including other row containers, but we will not build a generic recursive tree UI — the renderer renders one level of columns, and nested rows render their own columns.)
- Drag-to-reorder children *within* a row container column in this change (only palette→container drop is in scope; intra-container reorder is a follow-up).
- Styling/theming controls for design-only elements beyond text and column count.
- Resizable columns or per-column width controls.

## Decisions

### Decision 1: Discriminated `kind` on `FieldMeta` rather than a separate element type
Extend `FieldMeta` with:
- `kind: 'data' | 'design'` (defaults to `'data'` for backward compatibility)
- `designType: 'heading' | 'paragraph' | 'row'` (present when `kind === 'design'`)
- `text?: string` — body for paragraphs (and reused as the heading text alternative to `label` if we want a longer heading; see Decision 2)
- `columns?: number` — column count for row containers (default 2)
- `children?: FieldMeta[][]` — for row containers; an array of length `columns`, each element a vertical stack of child `FieldMeta`. Absent/empty for non-row elements.

**Why not a separate `ElementMeta` type?** A single discriminated union keeps the canvas's flat-array operations (reorder, `key={f.id}`, `importState`, `wbChange` payload) working unchanged at the top level. Containers introduce nesting only via `children`, which is opt-in and absent for data fields. This minimizes churn in `wb-canvas.tsx` and keeps serialization a single array.

**Alternatives considered:**
- *Separate `ElementMeta[]` parallel array* — rejected: doubles the canvas's array bookkeeping and breaks the single `wbChange`/`importState` contract.
- *Generic tree where every element has `children`* — rejected: data fields never have children; adding `children?` only on row containers keeps the common case flat and serializes cleanly.

### Decision 2: Heading uses `label`; paragraph uses `text`
A heading is short and single-line, so it reuses the existing `label` field (and the inspector's existing label input). A paragraph is multi-line prose, so it adds a `text` field rendered in a `<textarea>` in the inspector and a `<p>` in the renderer. This avoids a second overlapping "title" field and keeps the inspector's label validation (non-empty) reusable for headings.

**Alternatives considered:**
- *Use `text` for both* — rejected: would orphan the existing label-based inspector UI and the canvas row title which currently reads `f.label`.

### Decision 3: Row container stores children as `FieldMeta[][]` (columns of stacks)
`children` is an array of `columns` arrays. Column index is the first dimension; each column is a vertical stack of children. This matches the visual model (flex row of vertical columns) and makes the column-aware drop target a simple `(colIndex, rowInColumn)` pair.

**Default columns = 2**, configurable from the inspector (number input, min 1, max e.g. 4). Changing `columns` truncates or pads `children` with empty arrays rather than redistributing children (keeps the operation predictable and non-destructive; users who want a different layout re-drag).

**Alternatives considered:**
- *Flat `children: FieldMeta[]` with a `column` field on each child* — rejected: harder to keep column counts consistent on `columns` change; column boundaries implicit.
- *CSS `flex-wrap` from a flat list* — rejected: no control over which column a child lands in, breaks the explicit drop indicator.

### Decision 4: Column-aware drop indicator reuses the existing palette-drag machinery
The canvas already exposes `beginExternalDrag`, `setExternalHoverIndex(y)`, and `commitExternalInsert(type, label, subtype)` for palette→canvas drops. We extend the hit-testing in `setExternalHoverIndex` (and a new `commitExternalInsert` overload) to:
1. First determine whether the pointer is over a row container's column area (vs. the top-level row list).
2. If over a column, compute `(colIndex, rowInColumn)` from the pointer's `(x, y)` within that container.
3. Render a per-column drop indicator (a highlighted insertion line inside the targeted column) instead of the top-level `hoverIndex` indicator.

To keep the code clean and avoid a second coordinate pipeline, `setExternalHoverIndex` will be extended to accept `(x, y)` (the palette already emits both `clientX` and `clientY` via `wbPaletteDragMove`). The existing top-level path remains the fallback when the pointer is not over a row container.

**Drop target representation:** we add a `dropTarget` state on the canvas: `{ kind: 'top', index } | { kind: 'column', containerId, colIndex, index }`. The render function reads `dropTarget` to place the indicator. This keeps the indicator logic in one place rather than splitting `hoverIndex` semantics.

**Alternatives considered:**
- *Native HTML5 DnD with `dropzone` per column* — rejected: the codebase standardized on Pointer Events for cross-shadow-boundary hit-testing and to avoid breaking the existing ghost/drag UX.
- *A separate `wb-row-container` component that owns its own drop logic* — rejected for now: would require a second pointer-event pipeline and event bubbling across shadow boundaries; we keep the canvas as the single drag orchestrator (matches the existing pattern).

### Decision 5: Renderer skips design-only elements in the submit payload
`wb-form-renderer` already builds the payload from `FormData`. Design-only elements will simply not render any named form control. Heading renders `<h2>{label}</h2>`; paragraph renders `<p>{text}</p>`; row container renders a flex `<div>` with one child `<div class="column">` per column, each containing the rendered children. Because none of these have a `name`, `FormData` naturally omits them. The renderer's `wbSubmit` contract is unchanged.

### Decision 6: Inspector renders a reduced, element-type-specific panel
For design-only elements the inspector shows:
- **Heading**: Label input only (reuses existing label input + validation).
- **Paragraph**: a Label input (used as a short summary/title in the canvas row) plus a multi-line `text` textarea.
- **Row container**: a Label input (canvas row title) plus a `columns` number input (min 1, max 4).
- All data-field-only controls (Required, restrictions, multiline, initial lines, max height) are hidden when `kind === 'design'`.

This is implemented with an early branch on `f.kind` in `render()`, keeping the existing data-field block untouched.

### Decision 7: Backward-compatible import
`importState` already validates each entry has `id: number`, `type: string`, `label: string`. We relax this to accept `kind === 'design'` entries (which may omit `type` or use a `designType` instead). Specifically: an entry is valid if it has `id: number` and either (`type: string` and `label: string`) or (`kind === 'design'` and `designType` and `label`). `kind` defaults to `'data'` when absent. This keeps previously serialized data-field arrays importable unchanged.

## Risks / Trade-offs

- **[Risk] Nested children complicate the canvas's flat `hoverIndex` model** → Mitigation: introduce an explicit `dropTarget` discriminated state and route both top-level and column drops through it; the top-level path remains the fallback. Keep the canvas as the single drag orchestrator.
- **[Risk] Changing `columns` on a populated row container could lose children** → Mitigation: truncate/pad `children` to the new column count without redistributing; document this in the inspector help text. Children in truncated columns are moved to the last remaining column (non-destructive).
- **[Risk] `children` deep-nesting makes serialization larger** → Mitigation: acceptable for a form builder; the JSON is still a single `FieldMeta[]` tree. We do not optimize for depth in this change.
- **[Trade-off] Heading reuses `label` rather than a dedicated `text`** → keeps the inspector/canvas label UI reusable but means a heading's "label" is its visible text. Acceptable since headings are not data.
- **[Trade-off] No intra-container child reorder in this change** → keeps scope tight; reorder inside a column can reuse the existing grip-handle drag in a follow-up.
- **[Risk] Renderer must render nested rows (a row inside a column)** → Mitigation: the renderer recursively renders `children` columns; a nested row container renders its own flex row. This is a small recursive render function, no new state.