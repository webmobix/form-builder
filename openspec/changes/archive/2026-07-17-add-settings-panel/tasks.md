## 1. Field model in form-core

- [x] 1.1 Define `TextSubtype` (`'text' | 'number' | 'email' | 'tel'`), `FieldSubtype`, `NumberRestrictions`, `TextRestrictions`, and `Restrictions` types in `packages/form-core/src/types.ts`
- [x] 1.2 Extend/define `FieldMeta` in `form-core` with `id: number`, `type: FieldType`, `label: string`, `subtype?: FieldSubtype`, `restrictions?: Restrictions`; export from `form-core/src/index.ts`
- [x] 1.3 Add unit tests in `form-core` covering the model shape and JSON Schema keyword mapping (min/max/step ↔ minimum/maximum/multipleOf; maxLength ↔ maxLength)

## 2. Canvas: selection state and update API

- [x] 2.1 Import shared `FieldMeta` from `form-core` into `wb-canvas.tsx`; remove the local duplicate `FieldMeta` interface; keep the keyed-by-`id` render discipline
- [x] 2.2 Add `@State selectedId: number | null` and a `@Method selectField(id | null)`; emit `wbFieldSelected` (existing) on row click and a new `wbFieldDeselected` event when cleared
- [x] 2.3 Add `@Method updateField(id: number, patch: Partial<FieldMeta>)` that merges `patch` into the matching field (by `id`), preserves position and `id`, emits new `wbFieldUpdated` event, and re-emits `wbChange` with the full list; ignore unknown `id` without emitting
- [x] 2.4 Wire clicking empty canvas area (outside any row) to clear selection and emit `wbFieldDeselected` without modifying fields
- [x] 2.5 Add/extend unit tests in `wb-canvas.unit.test.tsx` for: select/deselect signals, `updateField` merge + `wbChange`/`wbFieldUpdated` emission, unknown-id no-op, stable `id` and position after update

## 3. wb-inspector component

- [x] 3.1 Scaffold `packages/form-components/src/components/wb-inspector/` (tsx, css, readme) with a Stencil `@Component` and shadow DOM
- [x] 3.2 Add `@Prop field: FieldMeta | null` and a `@Method setField(field | null)`; render empty/placeholder state when `field` is null
- [x] 3.3 Render editable label input; block empty labels with a validation error and do not emit
- [x] 3.4 Render type selector (text/select/date/checkbox); on change emit update clearing `subtype` and restrictions when leaving `text`
- [x] 3.5 Render subtype selector (text/number/email/tel) shown only when `type === 'text'`; on change emit update clearing previous-subtype restrictions and seeding defaults for the new subtype
- [x] 3.6 Render conditional restriction inputs: number subtype → min/max/step; text subtype → maxLength; blank values treated as unset (omitted in the patch)
- [x] 3.7 Emit `wbFieldUpdated: EventEmitter<{ id: number; patch: Partial<FieldMeta> }>` for every committed property change (label, type, subtype, restrictions)
- [x] 3.8 Add `wb-inspector.unit.test.tsx` covering: empty state, loading a field, label edit (incl. empty rejection), type change clearing subtype/restrictions, subtype change swapping restrictions, restriction edits and blank-as-unset, hidden inputs for non-text types, correct `wbFieldUpdated` payloads

## 4. wb-form-field subtype + restrictions support

- [x] 4.1 Add `subtype?: FieldSubtype` and `restrictions?: Restrictions` props to `wb-form-field.tsx`; import types from `form-core`
- [x] 4.2 For `type === 'text'`: render `<input type={subtype ?? 'text'}>`; apply `maxLength` when `restrictions?.text?.maxLength` is set
- [x] 4.3 For `subtype === 'number'`: render `<input type="number">` with `min`/`max`/`step` attributes from `restrictions?.number`
- [x] 4.4 Extend `sync()` validation via `ElementInternals.setValidity` to report min/max/step and maxLength violations with messages naming the field label
- [x] 4.5 Add unit tests: number subtype attributes applied, number violation messaging, text maxLength enforced, omitted subtype defaults to text (pre-change parity)

## 5. Host integration and dev harness

- [x] 5.1 Update `packages/form-components/src/index.html` layout: add `wb-inspector` to the right of `wb-canvas` (e.g. a three-column `.layout`)
- [x] 5.2 Wire `wbFieldSelected` → `inspector.setField(field)`; wire `wbFieldDeselected` → `inspector.setField(null)`; wire `wbFieldUpdated` → `canvas.updateField(id, patch)`
- [x] 5.3 Track `selectedId` in the host; reflect it in the `wbChange` payload display (pre)
- [x] 5.4 Manually smoke test: select a row → edit label/type/subtype/restrictions → canvas row updates live → number field validates against min/max/step → submit shows FormData

## 6. Verification

- [x] 6.1 Run `npm test --workspaces` (or `pnpm test`) and ensure all unit tests pass
- [x] 6.2 Run typecheck/build (`npm run build --workspaces`) and fix any type errors from the shared `FieldMeta` migration
- [x] 6.3 Verify no new third-party dependencies were introduced (inspector uses native form controls + Stencil only)
- [x] 6.4 Cross-check each spec scenario against the implementation; update specs only if implementation revealed a contract gap