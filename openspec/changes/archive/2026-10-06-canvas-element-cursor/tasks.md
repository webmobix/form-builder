# Tasks

## 1. Make inert element bodies pointer-transparent

- [x] 1.1 In `wb-canvas.tsx`, tag the `.element-body` of non-row elements with an `element-body--inert` modifier (driven by the existing `isRow` flag) and verify with a unit test that a data field's body carries the class while a row container's body does not.
- [x] 1.2 Add `.element-body--inert { pointer-events: none; }` to `wb-canvas.css` and verify in the browser test that a data field's inner preview computes to `pointer-events: none` while a row container's body computes to `auto`.
- [x] 1.3 Confirm the grip and delete button remain outside `.element-body` so they keep their own cursors and handlers, and verify with a unit test that both are direct children of `.canvas-element` (not descendants of `.element-body`).

## 2. Browser coverage for cursor and click routing

- [x] 2.1 Add a browser test in `wb-canvas.cmp.test.tsx` asserting the cursor over a rendered data field's label and over its disabled control is `pointer` (same as the `.canvas-element` border), and that hovering still shows the element hover outline.
- [x] 2.2 Add a browser test asserting the grip computes to `grab` and the delete button to `pointer`, and that these are preserved after the body becomes pointer-transparent.
- [x] 2.3 Add a browser test that a real click on a rendered data field's label and on its disabled control emits `wbFieldSelected` for that element, applies the selected ring, and leaves the control's value unchanged.
- [x] 2.4 Add a browser test for a field nested in a row container's column: hovering its label/body shows the `pointer` cursor, clicking it selects the nested element (not the row), and the row container's own body was not made pointer-transparent.

## 3. Regression and docs check

- [x] 3.1 Run `pnpm --filter @webmobix/form-components test` and verify the full unit and browser canvas suites (existing hover, selection, drag, and inert-control tests included) pass.
- [x] 3.2 Run `pnpm lint` and verify Biome reports no issues on the changed `wb-canvas.tsx`, `wb-canvas.css`, and test files.
- [x] 3.3 Verify no documentation update is required: the auto-generated `wb-canvas/readme.md` is unaffected (no public API, prop, event, or method change) and no CSS custom property was introduced; record the check in the change notes.

## Notes

- **3.1** `pnpm --filter @webmobix/form-components test`: 263 tests passed (unit + browser), 11 files.
- **3.2** `pnpm lint` (Biome): checked 43 files, no issues.
- **3.3** Documentation check: no docs update required. A `stencil build` regenerates `wb-canvas/readme.md`; git reports it unchanged because the change touches no public API, `@Prop`, `@Event`, or `@Method` surface. The CSS diff adds only `.element-body--inert { pointer-events: none; }` — no `--wb-*` custom property was introduced.
