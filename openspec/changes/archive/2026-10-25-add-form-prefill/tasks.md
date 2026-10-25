# Tasks

## 1. Field-level prefill (`wb-form-field`)

- [x] 1.1 Add `@Prop() initialValue?: string` to `wb-form-field` and seed `value` / `checked` in `componentWillLoad`, skipping when the prop is `undefined`; verify with unit tests asserting a prefilled text field renders the value and submits it via `FormData`
- [x] 1.2 Apply a changed `initialValue` through a `@Watch('initialValue')` handler covering text, textarea, number, and date controls; verify unit tests show a new value replacing the current one and an unchanged value leaving user-entered text intact
- [x] 1.3 Apply prefill to `select` fields (matching option key → `selectHasChoice = true`; no match → hint/empty state with an empty submitted value) and to `checkbox` fields (`'on'` → checked, every other value → unchecked); verify unit tests cover selection, fallback, `'on'`, and non-`'on'` values
- [x] 1.4 Prefill rich text: pass the parsed document as `content` when constructing the Tiptap editor and apply later changes with `editor.commands.setContent(doc, { emitUpdate: false })` followed by `sync()`; verify browser tests (`.cmp.test.tsx`) show prefilled formatted content and a JSON submit value, and that unchanged prefill does not reset typed content
- [x] 1.5 Ignore a malformed rich text prefill (`parseStoredValue` returns `null`) with a `console.warn`, keeping the editor's current content; verify a browser test with `initialValue="not-json"` shows an empty editor, submits `''`, and logs a warning
- [x] 1.6 Run `npm test -w packages/form-components` and verify the new field tests plus the existing field browser suite pass

## 2. Renderer prefill input (`wb-form-renderer`)

- [x] 2.1 Add `@Prop({ mutable: true }) values?: Record<string, string>`, the `setValues(values)` public method, and forwarding of `initialValue={values?.[`field.${id}`]}` to every rendered data field including row-container children; verify renderer unit tests assert prefilled text, textarea, date, select, and nested row fields
- [x] 2.2 Normalize prefill entries (primitive non-strings via `String()`, `null`/`undefined` treated as absent) in one helper used for both rendering and warning analysis; verify unit tests cover the numeric `42 → "42"` and `null → empty` cases
- [x] 2.3 Implement unknown-key detection and `console.warn` reporting, deduplicated per prefill application (`componentDidLoad` + `@Watch('values')`), skipped while `fields` is empty; verify unit tests spy on `console.warn` for an unknown id, a design-element id, and confirm no repeat warning on a `setFields` re-render
- [x] 2.4 Preserve user edits across re-renders: verify unit tests edit a prefilled field, call `setFields` with an additional field, and assert the edit survives; a changed `values` entry replaces the current value and an omitted key leaves it untouched
- [x] 2.5 Add `setValues` round-trip test: submit a filled form, capture `wbSubmit` detail, feed it back through `setValues`, and assert every control shows the submitted values
- [x] 2.6 Document the `values` prop, `setValues` method, prefill contract (round trip, unknown-key warnings, no-clobber, checkbox `'on'`-only, unmatched select fallback) in the `README.md` renderer API tables and example; verify the documented markup/`setValues` call matches the shipped API
- [x] 2.7 Run `npm test -w packages/form-components` and verify the renderer unit suite and the existing `wbSubmit`/setFields tests pass

## 3. Dev harness round trip

- [x] 3.1 Add a "Prefill from JSON" textarea + apply button to `packages/form-components/src/index.html`, calling `renderer.setValues(parsed)` on success and writing a parse error into the existing `#out` block on failure
- [x] 3.2 Manually verify the harness with `npm start -w packages/form-components`: submit the rendered form, paste the emitted payload into the prefill input, apply it, and confirm the controls show the submitted values; then enter malformed JSON and confirm the error appears with the form unchanged

## 4. Integration and release metadata

- [x] 4.1 Run `npm run build -w packages/form-components` and verify `src/components.d.ts` exposes `values`, `setValues`, and `initialValue` with no manual edits
- [x] 4.2 Run `npm run build -w packages/form-components-react` and verify the generated `WbFormRenderer` wrapper accepts `values` and exposes `setValues`
- [x] 4.3 Add a changeset (minor bump for both packages) and verify `.changeset/*.md` names `@webmobix/form-components` and `@webmobix/form-components-react`
- [x] 4.4 Run the full test suite for both packages (`npm test -w packages/form-components`, plus the React wrapper build check) and verify all suites pass

## Workflow follow-up

- Archive the change after review, which merges the two delta specs into `openspec/specs/form-renderer/spec.md` and `openspec/specs/richtext-field/spec.md`.
- Verify the archived change with `openspec validate` / `openspec status`.
