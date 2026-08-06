## ADDED Requirements

### Requirement: Inspector provides a multiline toggle for plain-text fields
The inspector SHALL render a "Multiline" checkbox toggle for fields whose `type` is `text` and whose `subtype` is `text` (or unset, defaulting to `text`). The toggle SHALL NOT be shown for non-text types or for `text` subtypes other than `text` (number, email, tel). Toggling it SHALL emit a `wbFieldUpdated` event with `{ multiline: true }` or `{ multiline: false }` in the patch.

#### Scenario: Multiline toggle appears for plain-text fields
- **WHEN** the selected field's `type` is `text` and `subtype` is `text` (or unset)
- **THEN** the inspector renders a "Multiline" checkbox showing the field's current `multiline` state (unchecked when unset)

#### Scenario: Multiline toggle hidden for non-text fields
- **WHEN** the selected field's `type` is not `text`
- **THEN** the inspector does not render a "Multiline" toggle

#### Scenario: Multiline toggle hidden for non-plain-text subtypes
- **WHEN** the selected field's `type` is `text` and `subtype` is `number`, `email`, or `tel`
- **THEN** the inspector does not render a "Multiline" toggle

#### Scenario: Toggling multiline emits an update
- **WHEN** the user checks or unchecks the "Multiline" toggle
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ multiline: true }` or `{ multiline: false }`

### Requirement: Inspector provides initialLines and maxHeight for multiline fields
When the selected field has `multiline` enabled, the inspector SHALL render an `initialLines` numeric input and a `maxHeight` numeric input. Both SHALL be hidden when `multiline` is false. Editing `initialLines` SHALL emit a patch with `{ initialLines: <n> }`; editing `maxHeight` SHALL emit a patch with `{ maxHeight: <n> }`. Blank `maxHeight` SHALL be treated as unset (unbounded growth). Blank or invalid `initialLines` SHALL fall back to the default of `3`.

#### Scenario: initialLines and maxHeight inputs appear for multiline fields
- **WHEN** the selected field is a plain-text field with `multiline` set to true
- **THEN** the inspector renders `initialLines` and `maxHeight` numeric inputs showing the field's current values (empty when unset, `initialLines` defaulting to 3)

#### Scenario: initialLines and maxHeight inputs hidden when multiline is off
- **WHEN** the selected field is a plain-text field with `multiline` false or unset
- **THEN** the inspector does not render `initialLines` or `maxHeight` inputs

#### Scenario: Editing initialLines emits an update
- **WHEN** the user changes the `initialLines` input to 5
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ initialLines: 5 }`

#### Scenario: Editing maxHeight emits an update
- **WHEN** the user changes the `maxHeight` input to 200
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ maxHeight: 200 }`

#### Scenario: Blank maxHeight is treated as unset
- **WHEN** the user clears the `maxHeight` input
- **THEN** the emitted patch sets `maxHeight` to `undefined` and the renderer treats growth as unbounded

#### Scenario: Turning multiline off clears presentation options
- **WHEN** the user unchecks the "Multiline" toggle on a field that had `initialLines` and `maxHeight` set
- **THEN** the emitted patch sets `multiline: false`, `initialLines: undefined`, and `maxHeight: undefined` so the renderer ignores them

## MODIFIED Requirements

### Requirement: Field model carries subtype and restrictions
`form-core` SHALL define an extended `FieldMeta` that includes optional `subtype`, `restrictions`, `multiline`, `initialLines`, and `maxHeight`. `subtype` SHALL apply only to fields whose type is `text`. `restrictions` SHALL be keyed by subtype (`number` → `{ min?, max?, step? }`, `text` → `{ maxLength? }`). `multiline`, `initialLines`, and `maxHeight` SHALL apply only to fields whose `type` is `text` and `subtype` is `text`; they are presentation-only and SHALL NOT participate in value validation. `wb-canvas` and `wb-inspector` SHALL import this `FieldMeta` as the single source of truth for field shape.

#### Scenario: FieldMeta includes subtype and restrictions
- **WHEN** the field model is defined
- **THEN** `FieldMeta` exposes `subtype?: FieldSubtype` and `restrictions?: Restrictions` alongside `id`, `type`, and `label`

#### Scenario: FieldMeta includes multiline presentation fields
- **WHEN** the field model is defined
- **THEN** `FieldMeta` also exposes `multiline?: boolean`, `initialLines?: number`, and `maxHeight?: number` as optional presentation properties

#### Scenario: Restrictions map to JSON Schema keywords
- **WHEN** a field carries number restrictions `{ min, max, step }` or text restrictions `{ maxLength }`
- **THEN** the model is shaped so those values map to JSON Schema `minimum`/`maximum`/`multipleOf` and `maxLength` respectively

#### Scenario: Multiline presentation fields do not affect validation
- **WHEN** a field has `multiline: true`, `initialLines: 5`, and `maxHeight: 200`
- **THEN** those values are used only for rendering and SHALL NOT be passed to `ElementInternals.setValidity` or alter the field's submitted value

### Requirement: Form field honors subtype and restrictions
`wb-form-field` SHALL accept optional `subtype`, `restrictions`, `multiline`, `initialLines`, and `maxHeight` props. For `type === 'text'` with `subtype !== 'number'` and `multiline` falsy, it SHALL render `<input type={subtype ?? 'text'}>`, apply `maxLength` when set, and render `<input type="number">` with `min`/`max`/`step` attributes when `subtype === 'number'`. For `type === 'text'`, `subtype === 'text'` (or unset), and `multiline` truthy, it SHALL render a `<textarea>` with `rows={initialLines ?? 3}`, `maxLength` applied when set, and a `max-height` CSS of `maxHeight ? maxHeight + 'px' : undefined`; the textarea SHALL use `field-sizing: content` to auto-grow. It SHALL validate against those restrictions via `ElementInternals.setValidity`, surfacing violation messages anchored to the rendered control (input or textarea).

#### Scenario: Number subtype renders a number input with attributes
- **WHEN** a `wb-form-field` has `type="text"`, `subtype="number"`, and restrictions `{ min: 0, max: 100, step: 1 }`
- **THEN** it renders an `<input type="number">` with `min="0"`, `max="100"`, and `step="1"`

#### Scenario: Number restriction violation is reported
- **WHEN** the user enters a value below `min` (or above `max`) on a number-subtype field and submits/validates
- **THEN** the field reports a validity error via `ElementInternals` with a message naming the field label and the violated bound

#### Scenario: Text maxLength is enforced
- **WHEN** a text-subtype field has `restrictions.text.maxLength` set
- **THEN** the rendered control (input or textarea) carries the `maxLength` attribute and typing beyond it is prevented by the browser

#### Scenario: Omitted subtype defaults to text
- **WHEN** a `wb-form-field` has `type="text"` and no `subtype`
- **THEN** it renders an `<input type="text">` with no extra restrictions, matching the pre-change behavior

#### Scenario: Multiline textarea renders with rows and max-height
- **WHEN** a `wb-form-field` has `type="text"`, `subtype="text"`, `multiline=true`, `initialLines=4`, `maxHeight=160`
- **THEN** it renders a `<textarea>` with `rows="4"`, a `max-height` of `160px`, and the `field-sizing: content` CSS so it auto-grows up to the cap

#### Scenario: Multiline textarea applies maxLength
- **WHEN** a multiline field has `restrictions.text.maxLength` set to 500
- **THEN** the rendered `<textarea>` carries the `maxLength` attribute set to 500

#### Scenario: Validity anchoring works for textarea
- **WHEN** a required multiline field is left empty and the form is submitted
- **THEN** `ElementInternals.setValidity` is called with the textarea element as the anchor and the missing-value message names the field label