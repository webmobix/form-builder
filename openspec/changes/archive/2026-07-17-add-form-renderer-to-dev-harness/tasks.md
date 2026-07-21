## 1. Scaffold the wb-form-renderer component

- [x] 1.1 Create `packages/form-components/src/components/wb-form-renderer/` with `wb-form-renderer.tsx` and `wb-form-renderer.css`
- [x] 1.2 Add the `@Component({ tag: 'wb-form-renderer', styleUrl, shadow: true })` class skeleton with `fields: FieldMeta[] = []` mutable `@Prop()` and a `@State()` shadow used for re-render if needed
- [x] 1.3 Import `FieldMeta` from `../../../../form-core/src/types` (matching the import path used by `wb-canvas`/`wb-form-field`)
- [x] 1.4 Add a public `@Method() setFields(fields: FieldMeta[])` that sets `this.fields = fields` and triggers a re-render
- [x] 1.5 Add a `@Event() wbSubmit: EventEmitter<Record<string, string>>` event

## 2. Implement rendering of fields

- [x] 2.1 In `render()`, render a `<form>` element in shadow DOM containing a `<div class="fields">` wrapper
- [x] 2.2 For each entry in `fields`, render one `<wb-form-field>` keyed by `entry.id` with `name={"field." + entry.id}`, `label={entry.label}`, `type={entry.type}`, `subtype={entry.subtype}`, `restrictions={entry.restrictions}`, and `required={!!entry.required}`
- [x] 2.3 Render a submit button and a reset button inside the form
- [x] 2.4 Add minimal CSS in `wb-form-renderer.css` to stack fields with vertical spacing (e.g. `.fields { display: grid; gap: 12px; }`)
- [x] 2.5 Verify the empty-config case renders the form shell with no field children

## 3. Implement submit behavior

- [x] 3.1 Add a form `submit` event handler that calls `e.preventDefault()` and builds a `FormData` from the renderer's `<form>` element (use a `@Ref` to the form)
- [x] 3.2 Convert the `FormData` to a plain `Record<string, string>` of `{ name: value }` using `Object.fromEntries(fd.entries())`
- [x] 3.3 Emit `wbSubmit` with the collected object as `detail`
- [x] 3.4 Confirm unchecked checkboxes are omitted (or empty) consistent with `wb-form-field`'s `setFormValue` behavior

## 4. Wire the dev harness

- [x] 4.1 In `packages/form-components/src/index.html`, replace the standalone `<wb-form-field name="standalone.note">` block with `<wb-form-renderer id="renderer"></wb-form-renderer>`
- [x] 4.2 Add `const renderer = document.getElementById('renderer');` and, in the existing `wbChange` listener on `canvas`, call `renderer.setFields(e.detail)`
- [x] 4.3 Add a `renderer.addEventListener('wbSubmit', ...)` handler that sets `out.textContent = JSON.stringify(e.detail, null, 2)`
- [x] 4.4 Keep the existing canvas submit button for the builder payload separate from the renderer's submit; update labels in the harness to distinguish "builder payload" vs "rendered form submit"
- [x] 4.5 Remove the now-unused form-submit handler that serialized the standalone field, if redundant

## 5. Tests

- [x] 5.1 Add `wb-form-renderer.unit.test.tsx` next to the component
- [x] 5.2 Test: rendering `[{ id: 1, type: 'text', label: 'Name' }]` produces one `wb-form-field` with `name="field.1"`, `label="Name"`, `type="text"`
- [x] 5.3 Test: rendering multiple fields produces one `wb-form-field` each with unique `name` derived from id
- [x] 5.4 Test: `subtype` and `restrictions` are forwarded to the rendered `wb-form-field`
- [x] 5.5 Test: calling `setFields` with a reordered list reuses existing field nodes (assert via stable element reference or key behavior)
- [x] 5.6 Test: submitting the rendered form emits `wbSubmit` with `{ "field.<id>": "<value>" }` for filled text fields
- [x] 5.7 Test: a checked checkbox field serializes to `'on'`; an unchecked one is omitted/empty in the `wbSubmit` payload
- [x] 5.8 Run `pnpm --filter @webmobix/form-components test` (or the package's vitest command) and ensure all tests pass

## 6. Lint, types, build

- [x] 6.1 Run the package's typecheck (tsc / `pnpm --filter @webmobix/form-components build` if it builds types) and fix any errors
- [x] 6.2 Run the package's lint command if one exists; fix any issues
- [x] 6.3 Verify the dev harness loads by running the Stencil dev server and confirming the renderer renders fields as the canvas changes (manual smoke check)