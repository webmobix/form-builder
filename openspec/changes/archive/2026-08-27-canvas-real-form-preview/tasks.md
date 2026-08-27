## 1. `wb-form-field` public disable support

- [x] 1.1 Add `@Prop() disabled = false` to `wb-form-field.tsx`; on change (and initial load) run the same path as `formDisabledCallback`: set internal disabled state, `inputEl.disabled`, Tiptap `editor.setEditable(!disabled)`, hide toolbar/link bar
- [x] 1.2 Add CSS overrides in `wb-form-field.css` so disabled controls keep their normal enabled appearance (no browser graying) for input, textarea, checkbox, and richtext surfaces
- [x] 1.3 Extend `wb-form-field.unit.test.tsx` / `wb-form-field.cmp.test.tsx`: prop disables input + editor, toolbar hidden, no visual disabled class; renderer default (no prop) unchanged

## 2. Canvas renders data fields as inert real previews

- [x] 2.1 In `wb-canvas.tsx` replace `renderRowBody` chip output for `kind === 'data'` rows with a stamped `<wb-form-field>` forwarded label/type/subtype/restrictions/multiline/initialLines/maxHeight/placeholder/required, with `disabled`
- [x] 2.2 Keep stable keys and existing `data-row` / selection wrapper attributes so click-select, `wbFieldSelected` emission, and drop-target geometry scans (`[data-row]`, column rects) keep working against the new markup
- [x] 2.3 Make wrappers non-permeable to interaction: inner controls not focusable (disabled inputs), Tab order lands on element wrappers only, pointer events select rather than edit
- [x] 2.4 Match renderer spacing/typography on the canvas stack (12px gaps between elements, renderer label/input sizing)

## 3. Realistic design elements and layout

- [x] 3.1 Render headings as `<h2>`-equivalent styled heading with the element's `label`; paragraphs as `<p>` showing `text ?? label` with renderer typography (remove truncated `.preview` span)
- [x] 3.2 Render row containers as flex row-container with equal-width columns mirroring `wb-form-renderer.css` (gap 12px), recursively rendering children as previews
- [x] 3.3 Remove permanent dashed column borders/backgrounds for filled columns; keep container structure and `data-container-id`/`data-column` attributes for drop targeting

## 4. Affordances: hover border, selection ring, drag handle, badge reveal

- [x] 4.1 Add hover outline styles in `wb-canvas.css`: ~2px solid light-blue (#9db9f5 family) for leaf elements; dashed variant for layout containers/columns; none when idle-unselected
- [x] 4.2 Restyle selected state as persistent solid `#2f6fed` ring + faint shadow, distinct from hover, applied at element level (including nested children)
- [x] 4.3 Replace inline `⠿` handle with an always-visible floating grip badge overlapping each element's top-left corner (grip glyph or inline SVG), tooltip "Drag to move"; wire its `pointerdown` to select the element then start the existing `startDrag` flow
- [x] 4.4 Verify dragging from the element body does NOT start a drag and palette→canvas cross-shadow drag still works end-to-end in the dev harness
- [x] 4.5 Hide type badges by default; render a floating neutral type tag at the element's top-right corner only while hovered or selected

## 5. Empty-column slot placeholder

- [x] 5.1 Render a slim dashed empty-slot strip (~44px min-height) inside columns whose children array is empty; hide it once children exist
- [x] 5.2 Confirm palette drops into an empty column via the strip still insert correctly (column-aware drop indicator unchanged)

## 6. Richtext canvas rendering

- [x] 6.1 Ensure richtext rows instantiate read-only Tiptap via the new disabled prop: editable(false), toolbar/link bar hidden, placeholder visible when empty
- [x] 6.2 Remove/replace the "Rich text" summary-chip behavior in `rowTypeLabel()` usage so no chip remains for richtext

## 7. Integration, wrappers, verification

- [x] 7.1 Regenerate React wrappers (`form-components-react`) so `WbFormField` exposes `disabled`
- [x] 7.2 Update `wb-canvas.unit.test.tsx` for realistic rendering: data fields stamp `wb-form-field` disabled; paragraph shows text body; row containers render real columns; empty column strip appears/hides; handle-only drag preserved
- [x] 7.3 Run `npm test` in `packages/form-components` (and repo-level checks/lint) and fix regressions
- [x] 7.4 Manual pass in dev harness `src/index.html`: build a form with all field types incl. nested rows — verify visual parity with the rendered form below, hover/selection/handle behavior, inertness, and that reorder + palette drag + inspector editing all still work
