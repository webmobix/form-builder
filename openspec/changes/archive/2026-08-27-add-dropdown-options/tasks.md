## 1. Field model

- [x] 1.1 Add `options?: { key: string; label: string }[]` to `FieldMeta` in `packages/form-components/src/core/types.ts` and verify `tsc`/type-check passes
- [x] 1.2 Add unit tests asserting `FieldMeta` accepts and carries `options` for `select` fields and omits it otherwise

## 2. Field rendering

- [x] 2.1 Add a `select` render branch in `wb-form-field.tsx` that renders a `<select>` with an `<option>` per `options` entry (setting each option's `value` to its `key` and text to its `label`), and verify `npm test -w @webmobix/form-components` renders a `<select>` (not `<input>`) for `type="select"`
- [x] 2.2 Verify required validation and value submission work for the `<select>` via the existing `sync()`/FormData path (unit test: selecting an option submits its `key`; empty required select reports value-missing)

## 3. Forwarding

- [x] 3.1 Forward `options` in `wb-form-renderer.tsx` when rendering a `select` field and verify the rendered `wb-form-field` receives `options`
- [x] 3.2 Forward `options` in `wb-canvas.tsx` `renderFieldPreview` and verify the preview `wb-form-field` receives `options`
- [x] 3.3 Add `select` option styling to `wb-form-field.css` and verify it does not break existing input/textarea rendering

## 4. Inspector options editor

- [x] 4.1 Add an Options editor to `wb-inspector.tsx` rendered only when the selected field's `type` is `select` (editable label inputs per option, a remove control, and an "Add option" action) and verify unit tests assert it appears for `select` and is hidden otherwise
- [x] 4.2 Wire add/remove/edit handlers to recompute the full ordered `options` array (each option as `{ key, label }` with `key` mirroring the edited label) and emit a `wbFieldUpdated` patch `{ options: [...] }`, and verify unit tests cover add, edit, remove (order preserved) and that the canvas applies the patch
- [x] 4.3 Verify the inspector Options editor does not emit patches for non-`select` fields and that `select` restriction inputs remain hidden

## 5. Integration

- [x] 5.1 Verify end-to-end: add a Dropdown from the palette, set options in the inspector, confirm the canvas preview and the renderer show the options, and submitting a filled form emits the chosen option's key
- [x] 5.2 Run `npm run lint` and `npm test` at the repo root and confirm all checks pass
