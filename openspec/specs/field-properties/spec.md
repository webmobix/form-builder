## Requirements

### Requirement: Inspector panel reflects the selected canvas field
The system SHALL provide a right-hand inspector panel (`wb-inspector`) that renders the editable properties of the field currently selected on the canvas. When no canvas field is selected, the inspector SHALL render an empty/placeholder state and SHALL NOT edit any field.

#### Scenario: Selecting a canvas row loads its data into the inspector
- **WHEN** a canvas row is clicked and the canvas emits `wbFieldSelected` with that field
- **THEN** the host passes the field to `wb-inspector` and the inspector renders that field's current label, type, subtype, and restrictions

#### Scenario: No selection shows empty state
- **WHEN** no canvas field is selected
- **THEN** the inspector renders a placeholder (e.g. "Select a field to edit its settings") and exposes no editable inputs that could mutate a field

#### Scenario: Selecting a different row switches the inspector
- **WHEN** the user selects a different canvas row while one is already loaded
- **THEN** the inspector replaces its contents with the newly selected field's properties without merging stale values from the previous field

### Requirement: Editable label propagated to the canvas
The inspector SHALL provide an editable label input bound to the selected field's label. Changes SHALL be propagated to the canvas so the canvas row label updates live, preserving the field's stable `id`.

#### Scenario: Editing the label updates the canvas row
- **WHEN** the user edits the label input in the inspector
- **THEN** the inspector emits an update carrying the field `id` and the new label, and the canvas updates that row's label without changing its `id` or other properties

#### Scenario: Empty label is rejected
- **WHEN** the user clears the label input
- **THEN** the inspector SHALL NOT emit an update with an empty label and SHALL show a validation error on the label input

### Requirement: Editable type propagated to the canvas
The inspector SHALL provide a type selector offering the four base field types (`text`, `select`, `date`, `checkbox`). Changing the type SHALL update the canvas row's type, preserving the field's stable `id`.

#### Scenario: Changing type updates the canvas row
- **WHEN** the user selects a different base type in the inspector
- **THEN** the inspector emits an update with the field `id` and the new type, and the canvas updates that row's type

#### Scenario: Switching away from text clears subtype and text/number restrictions
- **WHEN** the user changes the type from `text` to a non-text type
- **THEN** the emitted update clears `subtype` and any `text`/`number` restrictions so the field no longer carries inapplicable properties

### Requirement: Editable subtype for text fields
For a field whose type is `text`, the inspector SHALL provide a subtype selector offering at least `text`, `number`, `email`, and `tel`. Changing the subtype SHALL update the field's `subtype` property, preserving the field's stable `id`. The subtype selector SHALL NOT be shown for non-text types.

#### Scenario: Subtype selector appears for text fields
- **WHEN** the selected field's type is `text`
- **THEN** the inspector renders a subtype selector and shows the field's current subtype (defaulting to `text` when unset)

#### Scenario: Subtype selector hidden for non-text fields
- **WHEN** the selected field's type is not `text`
- **THEN** the inspector does not render a subtype selector

#### Scenario: Changing subtype updates the field
- **WHEN** the user selects a different subtype
- **THEN** the inspector emits an update with the field `id` and the new subtype, and the canvas stores it on the field

#### Scenario: Switching subtype clears inapplicable restrictions
- **WHEN** the user changes the subtype from `text` to `number` (or vice versa)
- **THEN** the emitted update clears the restrictions for the previous subtype and seeds empty defaults for the new subtype

### Requirement: Type and subtype-specific restrictions
The inspector SHALL render restriction inputs conditionally based on the field's type and subtype. For subtype `number`, the inspector SHALL provide `min`, `max`, and `step` numeric inputs. For subtype `text`, the inspector SHALL provide a `maxLength` numeric input. Restrictions SHALL be stored on the field and propagated to the canvas.

#### Scenario: Number restriction inputs appear for number subtype
- **WHEN** the selected field's type is `text` and subtype is `number`
- **THEN** the inspector renders `min`, `max`, and `step` numeric inputs showing the field's current number restrictions (empty when unset)

#### Scenario: Text restriction input appears for text subtype
- **WHEN** the selected field's type is `text` and subtype is `text`
- **THEN** the inspector renders a `maxLength` numeric input showing the field's current text restriction (empty when unset)

#### Scenario: Restriction inputs hidden for non-applicable types
- **WHEN** the selected field's type is `select`, `date`, or `checkbox`
- **THEN** the inspector does not render number or text restriction inputs

#### Scenario: Editing a restriction updates the field
- **WHEN** the user edits a restriction input
- **THEN** the inspector emits an update with the field `id` and the changed restriction, and the canvas stores it under the matching restriction key

#### Scenario: Blank restriction values are treated as unset
- **WHEN** the user clears a restriction input
- **THEN** the emitted update omits (or sets to undefined) that restriction, and the field treats it as not constrained

### Requirement: Inspector updates flow back through the canvas
The inspector SHALL emit a `wbFieldUpdated` event carrying `{ id: number; patch: Partial<FieldMeta> }` for every committed property change. The host SHALL wire this event to a canvas method that applies the patch to the matching field (found by `id`) and emits `wbChange` with the full updated field list. The canvas SHALL NOT reassign or shuffle the field's `id` as a result of an update.

#### Scenario: Inspector emits a field update
- **WHEN** the inspector commits a property change
- **THEN** it emits `wbFieldUpdated` with the field's `id` and a patch containing only the changed properties

#### Scenario: Canvas applies the patch and emits wbChange
- **WHEN** the host calls the canvas update method with an `id` and patch
- **THEN** the canvas merges the patch into the field with that `id`, preserves the field's position and `id`, and emits `wbChange` with the full updated field list

#### Scenario: Update to a non-existent id is ignored
- **WHEN** the host calls the canvas update method with an `id` not present in the canvas
- **THEN** the canvas makes no change and does not emit `wbChange`

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

### Requirement: Selection can be cleared
The canvas SHALL provide a way to clear the current selection (e.g. clicking the empty canvas area outside any row) so the inspector returns to its empty state. The canvas SHALL NOT lose field data when selection is cleared.

#### Scenario: Clicking empty canvas area clears selection
- **WHEN** the user clicks the canvas area outside any row while a field is selected
- **THEN** the canvas emits a deselection signal and the inspector returns to its empty state without modifying any field

#### Scenario: Clearing selection preserves fields
- **WHEN** selection is cleared
- **THEN** the canvas's field list and each field's properties remain unchanged

### Requirement: Inspector provides a required toggle
The inspector SHALL render a "Required" checkbox toggle for all field types. Toggling it SHALL emit a `wbFieldUpdated` event with `{ required: true }` or `{ required: false }` in the patch.

#### Scenario: Required checkbox appears for all field types
- **WHEN** any field type is selected in the inspector
- **THEN** the inspector renders a "Required" checkbox showing the field's current `required` state (unchecked when unset)

#### Scenario: Toggling required emits an update
- **WHEN** the user checks or unchecks the "Required" checkbox
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ required: true }` or `{ required: false }`