## MODIFIED Requirements

### Requirement: Renderer renders a fillable form from a FieldMeta[] config

The `wb-form-renderer` component SHALL accept a `fields: FieldMeta[]` prop and render one child per entry inside a `<form>` element in its shadow DOM. For each entry whose `kind === 'data'` (or whose `kind` is absent, defaulting to `'data'`) it SHALL render a `wb-form-field` child and forward the entry's `type`, `label`, `subtype`, `restrictions`, `multiline`, `initialLines`, `maxHeight`, `placeholder`, and `required` flag to the corresponding `wb-form-field` props. The renderer SHALL derive each rendered data field's submission `name` as `field.<id>` using the entry's stable `id`. For each entry whose `kind === 'design'` the renderer SHALL render the element without a `name` and without contributing to the submit payload: a `designType === 'heading'` element SHALL render an `<h2>` containing the element's `label`; a `designType === 'paragraph'` element SHALL render a `<p>` containing the element's `text` (or `label` when `text` is absent); a `designType === 'row'` element SHALL render a flex container with one child column `<div>` per `columns` entry, each column containing the recursively rendered children for that column.

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

#### Scenario: placeholder is forwarded for every data field type

- **WHEN** `fields` contains a data entry of any type (`text` in any subtype, `select`, `date`, `checkbox`, `richtext`) with `placeholder: "Hint"`
- **THEN** the rendered `wb-form-field` has its `placeholder` prop set to `"Hint"`

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

## ADDED Requirements

### Requirement: Renderer renders placeholders per field type

`wb-form-field` (stamped by the renderer) SHALL render a data field's `placeholder` according to its control type: for `text` fields (single-line or multiline) the placeholder SHALL be set as the native `placeholder` attribute on the `<input>`/`<textarea>`; for `select` fields the placeholder SHALL render as a first disabled hint `<option>` with a sentinel value distinct from every real option key (real options may use an empty key) that is selected while no real option has been chosen and can never be re-selected afterwards; for `date` fields the placeholder SHALL render as muted helper text below the control, referenced from the control via `aria-describedby`; for `checkbox` fields the placeholder SHALL render as muted helper text below the label row, referenced from the checkbox via `aria-describedby`; for `richtext` fields the Tiptap Placeholder extension behavior applies (defined in the `richtext-field` capability). When no `placeholder` is set, none of these renderings SHALL appear. Placeholders are presentation-only: they SHALL NOT alter validation or submit payloads.

#### Scenario: Text input shows a native placeholder

- **WHEN** a rendered form contains a `text` field with `placeholder: "Jane Doe"`
- **THEN** the `<input>` displays "Jane Doe" as its native placeholder while empty

#### Scenario: Textarea shows a native placeholder

- **WHEN** a rendered form contains a multiline `text` field with `placeholder: "Notes…"`
- **THEN** the `<textarea>` displays "Notes…" as its native placeholder while empty

#### Scenario: Select shows a hint option while no value is chosen

- **WHEN** a `select` field has `placeholder: "Choose one"` and options `[{ key: 'us', label: 'US' }]`
- **THEN** the `<select>` renders a first disabled hint `<option>` with a sentinel value (distinct from every real option key, including an empty key) containing "Choose one", and it is the selected option while no real option has been chosen

#### Scenario: Select hint option never reappears after a choice

- **WHEN** the user selects "US" in a select field with `placeholder: "Choose one"`
- **THEN** the hint option is no longer selected and cannot be selected again (it is disabled)

#### Scenario: Select renders no hint option when placeholder is unset

- **WHEN** a `select` field has no `placeholder` set
- **THEN** the `<select>` renders only its configured `options` with no added hint option

#### Scenario: Date field shows placeholder as helper text

- **WHEN** a `date` field has `placeholder: "Your birthday"`
- **THEN** the field displays the text "Your birthday" as muted helper text below the date control

#### Scenario: Checkbox field shows placeholder as helper text

- **WHEN** a `checkbox` field has `placeholder: "Check to accept"`
- **THEN** the field displays the text "Check to accept" as muted helper text below the label row

#### Scenario: No placeholder renders nothing

- **WHEN** any data field has no `placeholder` set
- **THEN** no native placeholder attribute, hint option, or helper text is rendered for that field