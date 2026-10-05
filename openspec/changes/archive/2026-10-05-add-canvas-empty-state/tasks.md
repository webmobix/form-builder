# Tasks

## 1. Canvas empty-state slot

- [x] 1.1 In `wb-canvas.tsx`, render `{this.fields.length === 0 && <div class="empty-state"><slot /></div>}` as a child of `.wrap` in `render()`, and add `@slot - ...` JSDoc to the component so the generated readme documents the default slot. Verify with `npm run build --workspace @webmobix/form-components` that the build succeeds and `src/components/wb-canvas/readme.md` gains a Slots section.
- [x] 1.2 Extend `wb-canvas.unit.test.tsx`: the shadow root contains a `slot` when `fields` is empty; the slot is absent after `importState([...])` or `addField(...)`; the empty-state wrapper carries no `data-element-id`/`data-container-id`/`data-column` attribute. Verify via `pnpm --filter @webmobix/form-components test`.

## 2. Empty-state styling and documentation

- [x] 2.1 Add `.empty-state` styling in `wb-canvas.css` (`display: flex; flex-direction: column; min-height: var(--wb-canvas-empty-min-height, 0);`) and verify in the dev harness that the default adds no visible box while setting `--wb-canvas-empty-min-height` grows the empty region.
- [x] 2.2 Add an "empty state" usage snippet (plain HTML and React `<WbCanvas>children</WbCanvas>`) plus the `--wb-canvas-empty-min-height` note to `packages/form-components/readme.md` and verify the documented markup matches `wb-canvas.tsx`; run `pnpm format` so the file stays lint-clean.

## 3. Empty-canvas drop target

- [x] 3.1 Extend `wb-canvas.unit.test.tsx` with empty-canvas drop coverage: with `fields === []` and `externalDrag === true`, `setExternalHoverIndex(x, y)` over the `.wrap` rect yields a top-level drop target at index 0; `commitExternalInsert('text', 'Name')` inserts at index 0, emits `wbChange` and `wbFieldSelected`, clears drag state, and after render the slot is gone. Verify via `pnpm --filter @webmobix/form-components test`.
- [x] 3.2 Update the dev harness (`src/index.html`) to pass a presentational empty-state child to `<wb-canvas>`; verify by hand (or a browser `.cmp.test.tsx` if added) that the content appears when the canvas has no fields, a palette drag can be dropped onto it to insert the first field, and the content disappears once a field exists.

## 4. Integration validation

- [x] 4.1 Run `pnpm --filter @webmobix/form-components test` and `pnpm lint`; fix any fallout so both pass.
- [x] 4.2 Run `openspec validate add-canvas-empty-state --strict` and confirm it passes.

## 5. Full-height canvas and centred empty state

- [x] 5.1 In `wb-canvas.css`, make `:host` a full-height flex column, let `.wrap` fill it (drop the `max-height: 60vh` cap), and centre `.empty-state` on both axes. Extend `wb-canvas.cmp.test.tsx` to verify `.wrap` fills the host and the slotted content is vertically centred.
- [x] 5.2 Update the dev harness (`src/index.html`) so `<wb-canvas>` stretches to the available height and the empty content is centred; verify a palette drop still inserts the first field.
- [x] 5.3 Re-run `pnpm --filter @webmobix/form-components test`, `pnpm lint`, and `openspec validate add-canvas-empty-state --strict`.
