## MODIFIED Requirements

### Requirement: Renderer renders a fillable form from a FieldMeta[] config
The `wb-form-renderer` component SHALL accept a `fields: FieldMeta[]` prop and render one child per entry inside a `<form>` element in its shadow DOM. For each entry whose `kind === 'data'` (or whose `kind` is absent, defaulting to `'data'`) it SHALL render a `wb-form-field` child and forward the entry's `type`, `label`, `subtype`, `restrictions`, `multiline`, `initialLines`, `maxHeight`, and `required` flag to the corresponding `wb-form-field` props. The renderer SHALL derive each rendered data field's submission `name` as `field.<id>` using the entry's stable `id`. For each entry whose `kind === 'design'` the renderer SHALL render the element without a `name` and without contributing to the submit payload: a `designType === 'heading'` element SHALL render an `<h2>` containing the element's `label`; a `designType === 'paragraph'` element SHALL render a `<p>` containing the element's `text` (or `label` when `text` is absent); a `designType === 'row'` element SHALL render a flex container with one child column `<div>` per `columns` entry, each column containing the recursively rendered children for that column.

#### Scenario: Empty config renders no fields
- **WHEN** `fields` is `[]` (or unset)
- **THEN** the renderer renders the surrounding `<form>` with no children

#### Scenario: One data field renders one labeled input
- **WHEN** `fields` is `[{ id: 1, kind: 'data', type: 'text', label: 'Name' }]`
- **THEN** the renderer renders exactly one `wb-form-field` with `label="Name"`, `type="text"`, and `name="field.1"`

#### Scenario: Multiple data fields each get a unique name from their id
- **WHEN** `fields` is `[{ id: 1, kind: 'data', type: 'text', label: 'A' }, { id: 2, kind: 'data', type: 'checkbox', label: 'B' }]`
- **THEN** the renderer renders two `wb-form-field` elements with `name="field.1"` and `name="field.2"` respectively, each forwarding its own `label` and `type`

#### Scenario: subtype and restrictions are forwarded to the field
- **WHEN** `fields` contains a data entry `{ id: 3, kind: 'data', type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 120 } } }`
- **THEN** the rendered `wb-form-field` has `subtype="number"` and `restrictions` equal to `{ number: { min: 0, max: 120 } }`

#### Scenario: url subtype is forwarded
- **WHEN** `fields` contains a data entry `{ id: 4, kind: 'data', type: 'text', label: 'Website', subtype: 'url' }`
- **THEN** the rendered `wb-form-field` has `subtype="url"` and renders an `<input type="url">`

#### Scenario: password subtype is forwarded
- **WHEN** `fields` contains a data entry `{ id: 5, kind: 'data', type: 'text', label: 'Secret', subtype: 'password' }`
- **THEN** the rendered `wb-form-field` has `subtype="password"` and renders an `<input type="password">`

#### Scenario: required flag is forwarded when set
- **WHEN** a data field entry carries a truthy `required` flag
- **THEN** the rendered `wb-form-field` has its `required` prop set to `true`

#### Scenario: multiline presentation options are forwarded to the field
- **WHEN** `fields` contains a data entry `{ id: 7, kind: 'data', type: 'text', subtype: 'text', label: 'Notes', multiline: true, initialLines: 4, maxHeight: 200 }`
- **THEN** the rendered `wb-form-field` has `multiline={true}`, `initialLines={4}`, and `maxHeight={200}` forwarded as props

#### Scenario: omitted multiline options do not force textarea rendering
- **WHEN** `fields` contains a data text field entry with no `multiline` property
- **THEN** the rendered `wb-form-field` has no `multiline` prop set (or it is falsy) and renders a single-line input

#### Scenario: Heading element renders an h2 and no form control
- **WHEN** `fields` contains `{ id: 10, kind: 'design', designType: 'heading', label: 'Personal details' }`
- **THEN** the renderer renders an `<h2>` containing "Personal details" and no `wb-form-field` and no `name` attribute is produced for this entry

#### Scenario: Paragraph element renders a p and no form control
- **WHEN** `fields` contains `{ id: 11, kind: 'design', designType: 'paragraph', label: 'Intro', text: 'Please fill this in.' }`
- **THEN** the renderer renders a `<p>` containing "Please fill this in." and no `wb-form-field` and no `name` attribute is produced for this entry

#### Scenario: Row container renders flex columns with their children
- **WHEN** `fields` contains `{ id: 12, kind: 'design', designType: 'row', label: 'Row', columns: 2, children: [[{ id: 13, kind: 'data', type: 'text', label: 'A' }], [{ id: 14, kind: 'data', type: 'text', label: 'B' }]] }`
- **THEN** the renderer renders a flex container with two column `<div>`s, the first containing a `wb-form-field` with `name="field.13"` and the second containing a `wb-form-field` with `name="field.14"`

#### Scenario: Nested row container renders recursively
- **WHEN** a row container's column contains a child `{ id: 15, kind: 'design', designType: 'row', columns: 2, children: [[...], [...]] }`
- **THEN** the renderer renders the nested row container as a flex container with its own columns inside the parent column

## MODIFIED Requirements

### Requirement: Renderer emits a wbSubmit event keyed by field name
The renderer SHALL include a submit button in its rendered form. On form submit, the renderer SHALL emit a `wbSubmit` event whose `detail` is a plain object mapping each rendered data field's `name` (`field.<id>`) to its submitted value, derived from the form's `FormData`. Design-only elements (`kind === 'design'`) SHALL NOT appear in the `wbSubmit` payload because they render no named form control. Checkbox fields SHALL serialize to `'on'` when checked and be omitted (or empty) when unchecked, consistent with `wb-form-field`'s `setFormValue` behavior.

#### Scenario: Submit collects values keyed by field name
- **WHEN** the rendered form has data fields with names `field.1` and `field.2`, the user enters "Alice" into field.1 and "admin" into field.2, and submits
- **THEN** the `wbSubmit` event `detail` equals `{ "field.1": "Alice", "field.2": "admin" }`

#### Scenario: Unchecked checkbox is omitted from the payload
- **WHEN** the rendered form has a checkbox field with name `field.5` left unchecked and the form is submitted
- **THEN** the `wbSubmit` event `detail` does not contain a `field.5` key (or its value is empty string)

#### Scenario: Checked checkbox serializes to on
- **WHEN** the rendered form has a checked checkbox field with name `field.5` and the form is submitted
- **THEN** the `wbSubmit` event `detail["field.5"]` equals `'on'`

#### Scenario: Design-only elements are omitted from the payload
- **WHEN** the rendered form contains a heading, a paragraph, and a row container with data-field children, and the form is submitted
- **THEN** the `wbSubmit` event `detail` contains only the data fields' names (including the row container's data-field children) and no key for the heading, paragraph, or row container themselves