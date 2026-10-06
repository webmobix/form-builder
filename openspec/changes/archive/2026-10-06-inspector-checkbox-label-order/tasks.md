# Tasks

## 1. Reorder inspector checkbox toggles

- [x] 1.1 In `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`, reorder both checkbox rows (`field-group--checkbox`) so the `<input type="checkbox" class="checkbox">` element is rendered before the `<span class="field-label">` element: the Required toggle in the data-field panel and the Multiline toggle. Leave the `field-group--checkbox` flex CSS unchanged. Verify the existing `pnpm --filter @webmobix/form-components test` suite still passes.
- [x] 1.2 Visually confirm the checkbox appears on the left with the label on the right for both toggles using the dev harness (`pnpm --filter @webmobix/form-components start`, which uses `--no-open`) and no browser window is opened.

## 2. Integration verification

- [x] 2.1 Run `pnpm test` and `pnpm lint` from the repo root and confirm both pass with no regressions.
