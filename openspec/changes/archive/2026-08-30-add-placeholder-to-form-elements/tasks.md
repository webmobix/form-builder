## 1. Field model & docs

- [x] 1.1 Reword the `FieldMeta.placeholder` doc comment in `packages/form-components/src/core/types.ts` to describe it as a presentation property for all fillable data field types (remove "richtext-only" phrasing)
- [x] 1.2 Update `packages/form-components` README: `FieldMeta` comment, the property table row for `placeholder` (now "all data field types: native attribute on text/textarea, disabled hint option on select, muted helper text on date/checkbox, Tiptap hint on richtext"), and the roadmap/feature list mention of "rich text placeholder"

## 2. Placeholder rendering in wb-form-field

- [x] 2.1 Forward `placeholder` as the native attribute: add `placeholder={this.placeholder}` to the `<input>` and `<textarea>` render branches in `wb-form-field.tsx`
- [x] 2.2 Select hint option: when `this.type === 'select'` and `this.placeholder` is set, render a first disabled sentinel-value `<option>SelectPlaceholder...</option>` (label = the placeholder text) ahead of `this.options`; keep the plain `options.map` output unchanged when placeholder is unset
- [x] 2.3 Date & checkbox helper text: render `this.placeholder` as `<div class="wb-field__placeholder-hint">` below the control for `type === 'date'` and below the label row for `type === 'checkbox'` (wrap the checkbox row so label + hint share one column)
- [x] 2.4 CSS: add `.wb-field__placeholder-hint` (muted, small) to `wb-form-field.css`; introduce a generic `--wb-placeholder-color` variable with `--wb-richtext-placeholder-color` kept as a fallback declaration order so both date/checkbox hints and the existing richtext hint use it
- [x] 2.5 Confirm no effect on validation/submit: placeholder renders only as attribute/option/text — no change to `sync()` logic (sanity check, no code change expected)

## 3. Inspector

- [x] 3.1 In `wb-inspector.tsx`, change the Placeholder input gate from `isRichtext` to render for every data field (keep it excluded for `kind === 'design'` elements, which already takes the early design branch); keep `onPlaceholderInput` patch semantics unchanged (`'' → { placeholder: undefined }`)

## 4. Renderer & canvas forwarding

- [x] 4.1 Verify `wb-form-renderer.tsx` forwards `placeholder` for all entries (already does at ~line 72); confirm nothing else gates it — no change expected
- [x] 4.2 Verify `wb-canvas.tsx` forwards `placeholder` in `buildField` (already does at ~line 597); no change expected

## 5. Tests

- [x] 5.1 `wb-form-field` unit tests: text input and textarea render `placeholder` as native attribute; date and checkbox render `.wb-field__placeholder-hint` text; no hint markup when placeholder unset
- [x] 5.2 Select unit tests: with placeholder set the first `<option>` is `disabled` with a sentinel value carrying the hint text and is selected by default; after choosing a real option the hint is not selected and one cannot re-select it; a real empty-key option stays selectable and visually distinct from the hint; with placeholder unset no extra `<option>` exists
- [x] 5.3 Inspector unit tests: extend `wb-richtext-builder.unit.test.tsx` fixtures so the Placeholder-input presence assertions also cover `text`, `select`, `date`, and `checkbox` fields, and confirm design elements show no Placeholder input
- [x] 5.4 Renderer/canvas passthrough tests: a `placeholder` on a non-richtext data entry reaches the stamped `wb-form-field` for renderer and canvas
- [x] 5.5 Run `pnpm -r test` (or package-level equivalent) and resolve all failures, including Stencil re-generated typings (`components.d.ts`) and readme tasks if the test suite checks them