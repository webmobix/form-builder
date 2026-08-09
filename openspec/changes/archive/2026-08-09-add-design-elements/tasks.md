## 1. Data model

- [x] 1.1 Extend `FieldMeta` in `packages/form-components/src/core/types.ts` with `kind: 'data' | 'design'` (default `'data'`), `designType?: 'heading' | 'paragraph' | 'row'`, `text?: string`, `columns?: number`, and `children?: FieldMeta[][]`. Export the new types from `core/index.ts`.
- [x] 1.2 Add a discriminated helper (e.g. `isDesignElement(f)`) and a `defaultColumns = 2` constant in `core`.
- [x] 1.3 Update `core/index.test.ts` to cover the new discriminators and defaults.

## 2. Palette

- [x] 2.1 Add "Title/Headline", "Paragraph", and "Row container" entries to `FIELD_TYPES` in `wb-palette.tsx` with `{ kind: 'design', designType, label }` payloads (no `type`/`subtype`).
- [x] 2.2 Verify the existing click → `wbAddField` and pointer-drag → `wbPaletteDragStart/Move/End` paths carry the design-only payload unchanged.
- [x] 2.3 Update `wb-palette.unit.test.tsx` to assert the three new entries emit the correct `wbAddField` payload on click.

## 3. Canvas — rendering design-only rows

- [x] 3.1 In `wb-canvas.tsx`, branch the row render on `kind`: render heading rows with a heading-styled body, paragraph rows with the `label` (and a truncated `text` preview), and row container rows with a flex column layout showing `children` per column.
- [x] 3.2 Add CSS in `wb-canvas.css` for heading rows, paragraph rows, the row container flex layout, and column stacks.
- [x] 3.3 Keep the existing `key={f.id}` discipline; for row container children, key nested child rows by their `id` so re-renders reuse DOM.

## 4. Canvas — column-aware drop target

- [x] 4.1 Replace `hoverIndex: number | null` with a `dropTarget` state: `{ kind: 'top'; index: number } | { kind: 'column'; containerId: number; colIndex: number; index: number } | null`.
- [x] 4.2 Extend `setExternalHoverIndex` to accept `(x, y)` (update the dev-harness wiring and `wbPaletteDragMove` consumer) and compute the drop target: first test whether the pointer is inside a row container's column area; if so compute `(colIndex, index)` within that column; otherwise fall back to the top-level insertion index.
- [x] 4.3 Render the drop indicator from `dropTarget`: top-level indicator for `kind: 'top'`, per-column insertion line for `kind: 'column'`.
- [x] 4.4 Update `commitExternalInsert` to accept the design-only payload (`kind`, `designType`, `label`) and insert into the targeted column when `dropTarget.kind === 'column'`, or the top-level list when `kind: 'top'`. Emit `wbChange` with the full updated field list and `wbFieldSelected` for the new element.
- [x] 4.5 Update `cancelExternalDrag` to clear `dropTarget`.

## 5. Canvas — add/insert paths for design-only elements

- [x] 5.1 Generalize `addField` and `addFieldAfter` to accept the design-only payload (extend the signature or add an overload) so click-to-add works for heading/paragraph/row entries.
- [x] 5.2 When the currently selected element is a row container, click-to-add SHALL append the new element to the container's first column; otherwise keep the existing append/insert-after-selected semantics.
- [x] 5.3 Relax `importState` validation to accept `kind === 'design'` entries (require `id: number` and either (`type`+`label`) or (`kind === 'design'` + `designType` + `label`)). Default `kind` to `'data'` when absent. Initialize `children` to an array of `columns` empty arrays for row containers when missing.
- [x] 5.4 Update `updateField` so a `columns` patch on a row container truncates/pads `children` (moving truncated-column children to the last remaining column) before emitting `wbChange`.

## 6. Renderer

- [x] 6.1 In `wb-form-renderer.tsx`, branch the render on `kind`: data entries render `wb-form-field` as today; heading renders `<h2>{label}</h2>`; paragraph renders `<p>{text ?? label}</p>`; row container renders a flex `<div>` with one column `<div>` per `columns`, each containing the recursively rendered children for that column.
- [x] 6.2 Add CSS in `wb-form-renderer.css` for the row container flex layout and columns.
- [x] 6.3 Confirm design-only elements contribute no `name` and are absent from the `wbSubmit` payload (FormData naturally omits them).
- [x] 6.4 Update `wb-form-renderer.unit.test.tsx` to cover heading, paragraph, row container (with children), nested row container, and submit payload exclusion.

## 7. Inspector

- [x] 7.1 In `wb-inspector.tsx`, branch `render()` on `f.kind`: for `kind === 'design'` render the reduced panel (Label input + element-type-specific controls + read-only "Element" display) and hide all data-field-only controls.
- [x] 7.2 Add a paragraph `text` textarea bound to `f.text` emitting `{ text }` patches.
- [x] 7.3 Add a row container `columns` numeric input (min 1, max 4) bound to `f.columns` emitting `{ columns }` patches.
- [x] 7.4 Add the read-only "Element" display mapping (`heading` → "Title/Headline", `paragraph` → "Paragraph", `row` → "Row container").
- [x] 7.5 Hide the "Required" toggle for `kind === 'design'` (update the existing required-toggle requirement).
- [x] 7.6 Update `wb-inspector.unit.test.tsx` to cover the reduced panels for each designType and the hidden data-field controls.

## 8. Dev harness and integration

- [x] 8.1 Update `packages/form-components/src/index.html` wiring: pass both `clientX` and `clientY` to the canvas's extended `setExternalHoverIndex` from `wbPaletteDragMove`.
- [x] 8.2 Smoke-test in the dev harness: add a heading, paragraph, and row container; drag a field into each column; verify the rendered form shows the layout and submit excludes design-only elements.
- [x] 8.3 Verify export/import round-trips a canvas containing row containers with children (JSON includes `kind`, `designType`, `columns`, `children`).

## 9. Verification

- [x] 9.1 Run `pnpm test` (or the repo's test command) and ensure all existing + new unit tests pass.
- [x] 9.2 Run `pnpm lint` / `pnpm format:check` (biome) and fix any issues.
- [x] 9.3 Run `pnpm build` to ensure the Stencil output builds cleanly.