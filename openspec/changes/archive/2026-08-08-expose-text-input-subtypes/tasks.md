## 1. Core type model

- [x] 1.1 Extend `TextSubtype` in `packages/form-components/src/core/types.ts` to add `'url'` and `'password'` (resulting in `'text' | 'number' | 'email' | 'tel' | 'url' | 'password'`). `FieldSubtype` continues to alias `TextSubtype`.
- [x] 1.2 Add/adjust unit tests in `packages/form-components/src/core/index.test.ts` to assert `FieldMeta` accepts `subtype: 'url'` and `subtype: 'password'` and still compiles when `subtype` is omitted.
- [x] 1.3 Run typecheck across the workspace to confirm the widened union doesn't break existing consumers (`pnpm build` / `tsc --noEmit`).

## 2. Palette (`wb-palette`)

- [x] 2.1 In `packages/form-components/src/components/wb-palette/wb-palette.tsx`, extend the `FieldTypeDef` interface with an optional `subtype?: FieldSubtype`.
- [x] 2.2 Add entries to `FIELD_TYPES` for Email (`{ type: 'text', subtype: 'email', label: 'Email' }`), URL (`{ type: 'text', subtype: 'url', label: 'URL' }`), Number (`{ type: 'text', subtype: 'number', label: 'Number' }`), and Password (`{ type: 'text', subtype: 'password', label: 'Password' }`), placed immediately after the existing "Text input" entry.
- [x] 2.3 Update the existing "Text input" entry to `{ type: 'text', subtype: 'text', label: 'Text input' }` so the default text field carries an explicit `subtype: 'text'`.
- [x] 2.4 Confirm `wbAddField` and `wbPaletteDragStart`/`wbPaletteDragEnd` emit the full `FieldTypeDef` (including the new `subtype`) — the existing `emit(f)` / `emit({ ...this.draggedDef })` paths already forward the whole object, so this should require no code change beyond the type. Verify by reading the emit sites.
- [x] 2.5 Add/adjust `wb-palette.unit.test.tsx` assertions: clicking each new entry emits `wbAddField` with the expected `{ type, subtype, label }`; the existing Dropdown/Date/Checkbox entries emit no `subtype`.
- [x] 2.6 Add a `wb-palette.unit.test.tsx` assertion that dragging the "Email" entry and releasing over the canvas emits `wbPaletteDragEnd` with `{ type: 'text', subtype: 'email', label: 'Email' }`.

## 3. Canvas (`wb-canvas`)

- [x] 3.1 In `packages/form-components/src/components/wb-canvas/wb-canvas.tsx`, add an optional `subtype?: FieldSubtype` parameter to `addField(type, label, subtype?)`, `addFieldAfter(type, label, subtype?)`, and `commitExternalInsert(type, label, subtype?)`.
- [x] 3.2 In each of those methods, include `subtype` in the constructed `FieldMeta` only when it is provided (so non-text fields still have no `subtype` property); e.g. `const field: FieldMeta = { id: ++uid, type, label, ...(subtype ? { subtype } : {}) }`.
- [x] 3.3 Confirm `updateField` and `importState` are unaffected (they already merge arbitrary `FieldMeta` patches and accept the widened `subtype` union).
- [x] 3.4 Update `wb-canvas.unit.test.tsx`: `addFieldAfter('text', 'Email', 'email')` creates a field with `subtype: 'email'`; `addField('text', 'Name')` (no third arg) creates a field with no `subtype`; `commitExternalInsert('text', 'Password', 'password')` inserts with `subtype: 'password'`.

## 4. Inspector (`wb-inspector`)

- [x] 4.1 In `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`, remove the "Type" `<select>` and its `onTypeChange` handler (and the patch-clearing it did on type switch).
- [x] 4.2 Remove the "Subtype" `<select>` and its `onSubtypeChange` handler (and the patch-clearing it did on subtype switch).
- [x] 4.3 Add a `displayName(type, subtype)` helper that maps `(type, subtype)` to the friendly labels: `text`+`text`/unset → "Text input", `email` → "Email", `url` → "URL", `number` → "Number", `password` → "Password", `tel` → "Telephone", `select` → "Dropdown", `date` → "Date", `checkbox` → "Checkbox".
- [x] 4.4 Render a read-only "Field" group (e.g. `<label class="field-group"><span class="field-label">Field</span><span class="field-display">{displayName(f.type, f.subtype)}</span></label>`) in place of the removed Type selector.
- [x] 4.5 Update the restriction-input conditionals: `maxLength` SHALL render for any text-like subtype (`text`/unset, `email`, `url`, `password`, `tel`), not just `subtype === 'text'`. Currently it's gated on `subtype === 'text'`; widen to `subtype !== 'number'` (or an explicit allow-list).
- [x] 4.6 Keep the number-subtype min/max/step block gated on `subtype === 'number'` (unchanged).
- [x] 4.7 Keep the multiline toggle + initialLines/maxHeight block gated on `isText && (subtype === 'text' || !subtype)` (unchanged; email/url/password/number/tel do NOT get multiline).
- [x] 4.8 Remove the now-unused `FieldType` / `FieldSubtype` imports if they're no longer referenced after removing the selectors (keep if `displayName` uses them).
- [x] 4.9 Update `wb-inspector.unit.test.tsx`: assert no `<select>` for Type or Subtype is rendered; assert the read-only "Field" display shows the correct name for each subtype (Email → "Email", Password → "Password", URL → "URL", text → "Text input", number → "Number", select → "Dropdown"); assert `maxLength` input appears for email/url/password/text subtypes and is hidden for number; assert multiline toggle still appears for plain text only.

## 5. Form field (`wb-form-field`) — verify, no logic change expected

- [x] 5.1 Read `packages/form-components/src/components/wb-form-field/wb-form-field.tsx` and confirm `getInputType()` returns `'url'` for `subtype === 'url'` and `'password'` for `subtype === 'password'` (it already returns `subtype` verbatim for non-`number` text fields, so this should already work).
- [x] 5.2 Confirm `sync()` validity path treats `url`/`password` like plain text (no number-specific validation; `valueMissing` and `maxLength` apply via the existing branches). No code change expected.
- [x] 5.3 Add a `wb-form-field.unit.test.tsx` assertion: `subtype="url"` renders `<input type="url">`; `subtype="password"` renders `<input type="password">`; both enforce `maxLength` when set.

## 6. Renderer (`wb-form-renderer`) — verify

- [x] 6.1 Confirm `wb-form-renderer` already forwards `subtype` to `wb-form-field` (it does per the existing spec) so `url`/`password` flow through unchanged. Read the render loop to verify.
- [x] 6.2 Add/adjust a `wb-form-renderer` unit test: a field with `subtype: 'url'` yields a `wb-form-field` with `subtype="url"`; a field with `subtype: 'password'` yields `subtype="password"`.

## 7. Dev harness & manual verification

- [x] 7.1 Confirm `packages/form-components/src/index.html` needs no change — it forwards `e.detail` (now including `subtype`) wholesale to `canvas.addFieldAfter(...)` and `canvas.commitExternalInsert(...)`. If those call sites pass positional args, update them to forward `e.detail.subtype` as the third argument.
- [x] 7.2 Run `pnpm test` (and `pnpm build`/typecheck) across `form-components` to confirm no regressions.
- [x] 7.3 Manually verify in the dev harness (`packages/form-components/src/index.html`): click each new palette entry (Email, URL, Number, Password) and confirm the canvas row appears, the inspector shows the correct read-only "Field" name and the right restriction inputs (maxLength for email/url/password/text; min/max/step for number; multiline toggle for text only), and the rendered form shows the correct `<input type>` (email, url, number, password, text).
- [x] 7.4 Drag the "Password" entry from the palette onto the canvas and confirm a password field is inserted at the drop position with the correct subtype.