## 1. Core type model

- [x] 1.1 Add `multiline?: boolean`, `initialLines?: number`, `maxHeight?: number` fields to `FieldMeta` in `packages/form-core/src/types.ts`
- [x] 1.2 Verify the new fields are exported via `packages/form-core/src/index.ts` (re-exported through `FieldMeta`)
- [x] 1.3 Add/adjust unit tests in `packages/form-core/src/index.test.ts` to assert `FieldMeta` accepts the new optional fields and that omitting them still compiles

## 2. Form field rendering (`wb-form-field`)

- [x] 2.1 Add `multiline`, `initialLines`, `maxHeight` props to `wb-form-field.tsx`
- [x] 2.2 Widen the `inputEl` ref type to `HTMLInputElement | HTMLTextAreaElement` so `setValidity` anchoring works for both
- [x] 2.3 In `render()`, branch: when `type==='text'` && `subtype!=='number'` && `multiline` is truthy, render a `<textarea>` instead of `<input>`; otherwise keep the existing `<input>` path unchanged
- [x] 2.4 Wire the `<textarea>` with: `name`, `required`, `maxLength` (from `restrictions.text.maxLength`), `rows={initialLines ?? 3}`, `onInput` → `value` (same `onInput` handler), and `ref` → `inputEl`
- [x] 2.5 Confirm the existing `sync()` validity path works for the textarea (value-missing + maxLength anchored to the textarea element)
- [x] 2.6 Add CSS rules in `wb-form-field.css`: the textarea SHALL use `field-sizing: content`, `width: 100%`, `min-height: fit-content`, and `max-height: <maxHeight>px` when `maxHeight` is set (apply via inline style or a CSS var bound from the prop)
- [x] 2.7 Verify form submission still collects the textarea value under `field.<id>` (no change to `handleSubmit` expected, just confirm)

## 3. Inspector controls (`wb-inspector`)

- [x] 3.1 Add a "Multiline" checkbox toggle rendered only when `f.type === 'text'` and `subtype === 'text'` (or unset → default `text`)
- [x] 3.2 Implement `onMultilineChange` handler: emit a patch `{ multiline: bool }`; when turning off, also clear `initialLines` and `maxHeight` in the same patch (`{ multiline: false, initialLines: undefined, maxHeight: undefined }`)
- [x] 3.3 Add `initialLines` and `maxHeight` numeric inputs rendered only when the field is plain-text and `multiline` is true
- [x] 3.4 Implement `onInitialLinesInput` handler: blank/invalid → default `3`; otherwise emit `{ initialLines: n }`
- [x] 3.5 Implement `onMaxHeightInput` handler: blank → `{ maxHeight: undefined }` (unbounded); otherwise emit `{ maxHeight: n }`
- [x] 3.6 Keep `localField` in sync with each emitted patch so the inspector UI reflects the new state immediately
- [x] 3.7 Ensure switching subtype away from `text` (or type away from `text`) hides the multiline block and does not leave stale presentation values rendered

## 4. Renderer forwarding (`wb-form-renderer`)

- [x] 4.1 Forward `multiline`, `initialLines`, and `maxHeight` from each `FieldMeta` entry to the corresponding `<wb-form-field>` props in the render loop
- [x] 4.2 Verify entries without the new props still render as single-line inputs (no regression)

## 5. Tests & verification

- [x] 5.1 Add a `wb-form-field` unit test asserting a `<textarea>` is rendered when `multiline=true` and an `<input>` otherwise
- [x] 5.2 Add a test asserting `rows` attribute equals `initialLines` (default 3 when unset) and `max-height` style is applied when `maxHeight` is set
- [x] 5.3 Add a `wb-inspector` unit test asserting the Multiline toggle appears for plain-text fields and is hidden for non-text / non-plain-text subtypes
- [x] 5.4 Add a test asserting `initialLines`/`maxHeight` inputs appear only when `multiline` is true and that toggling multiline off emits a patch clearing them
- [x] 5.5 Add a `wb-form-renderer` test asserting the new props are forwarded to the rendered `<wb-form-field>`
- [x] 5.6 Run `pnpm test` (and `pnpm build`/typecheck) across `form-core` and `form-components` to confirm no regressions
- [x] 5.7 Manually verify in the dev harness (`packages/form-components/src/index.html`): add a text field, toggle multiline, set initialLines/maxHeight, type content, and confirm auto-grow + scroll at cap + correct value in the submit payload