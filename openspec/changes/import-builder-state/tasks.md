## 1. Canvas hydration API

- [x] 1.1 Add `importState(fields: FieldMeta[]): Promise<void>` public method to `wb-canvas.tsx` (`@Method()`). Implement structural validation: reject non-array input and entries with non-numeric `id` / non-string `type` / non-string `label` (no-op return, no emit).
- [x] 1.2 On valid input, set `this.fields = fields`, resync module-level `uid = Math.max(...fields.map(f => f.id), uid)` (handle empty array by leaving `uid` unchanged), and emit `wbChange` with the new `fields`.
- [x] 1.3 Before assigning new fields, if `this.selectedId !== null`, set `this.selectedId = null` and emit `wbFieldDeselected`. Do not emit `wbFieldDeselected` when nothing was selected.

## 2. Dev harness import/export affordances

- [x] 2.1 Add a "Load into canvas" section to `packages/form-components/src/index.html`: a `<textarea>` for pasting JSON, an `<input type="file" accept="application/json">`, and a "Load into canvas" button.
- [x] 2.2 Wire the Load button: read the textarea value (or the selected file's text if a file is chosen), `JSON.parse` it inside try/catch, and on success call `canvas.importState(parsed)`; on parse error display the error message in the `#out` `<pre>` block.
- [x] 2.3 Add an "Export JSON" button that builds a `Blob` from `JSON.stringify(lastBuilderPayload, null, 2)` and triggers a download (e.g. `form-builder-state.json`) via a temporary `<a>` link. Keep the existing "Dump builder payload" button intact.

## 3. Tests

- [x] 3.1 Add a unit/browser test in `packages/form-components/src/components/wb-canvas` (or the existing test file) covering: importing a two-field payload renders both rows and emits `wbChange` with the imported array.
- [x] 3.2 Add a test verifying id-counter continuity: `importState([{ id: 100, ... }])` then `addField('text', 'B')` produces a field with `id > 100`; and importing a low-id payload after a high-id add does not regress the counter (next addField id > previous addField id).
- [x] 3.3 Add a test verifying selection reset: select a field, call `importState`, assert `wbFieldDeselected` emitted and selection cleared; and that no `wbFieldDeselected` is emitted when nothing was selected.
- [x] 3.4 Add a test verifying malformed-input guarding: non-array input, entry missing `id`, and entry with non-numeric `id` are all no-ops (canvas unchanged, no `wbChange` emitted).
- [x] 3.5 Run `npm test -w packages/form-components` and ensure all tests pass.

## 4. Verification

- [x] 4.1 Run `npm run build -w packages/form-components` and confirm a clean build.
- [x] 4.2 Manually verify round-trip in the dev harness (`npm start -w packages/form-components`): build a form → Export JSON → reload page → paste/load JSON → Load into canvas → canvas restores the prior state; add a new field and confirm its id does not collide.
- [x] 4.3 Run `openspec validate import-builder-state --strict` and confirm no validation errors.