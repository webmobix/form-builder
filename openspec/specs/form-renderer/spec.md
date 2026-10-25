# form-renderer Specification

## Purpose

Renders a fillable, submitting form from a `FieldMeta[]` configuration, including data fields and design-only elements, so hosts can display and capture a built form.

## Requirements

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

### Requirement: Renderer re-renders when the config changes
The renderer SHALL keep its rendered fields in sync with the `fields` prop. When `setFields(fields)` is called or the `fields` prop changes, the renderer SHALL re-render so the rendered form reflects the latest config, adding, removing, and reordering `wb-form-field` children as needed. Reorders SHALL reuse existing `wb-form-field` nodes (keyed by `field.id`) rather than recreating them.

#### Scenario: Adding a field updates the rendered form
- **WHEN** the renderer is showing one field and `setFields` is called with two fields
- **THEN** a second `wb-form-field` appears in the rendered form with the second field's props

#### Scenario: Reordering fields moves existing nodes without recreating them
- **WHEN** the renderer is showing fields `[A, B]` and `setFields` is called with `[B, A]`
- **THEN** the `wb-form-field` nodes for A and B are reused (same DOM nodes) and their order in the form is swapped

#### Scenario: Removing a field drops its rendered input
- **WHEN** the renderer is showing fields `[A, B]` and `setFields` is called with `[A]`
- **THEN** the rendered form contains only the `wb-form-field` for A

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

### Requirement: Renderer exposes a setFields public method
The `wb-form-renderer` component SHALL expose a public `setFields(fields: FieldMeta[]): Promise<void>` method that updates the rendered form's fields, equivalent to setting the `fields` prop. This enables imperative wiring from a host page's event listeners.

#### Scenario: Host page updates the rendered form via setFields
- **WHEN** a host page calls `renderer.setFields([{ id: 1, type: 'text', label: 'Name' }])`
- **THEN** the renderer renders one `wb-form-field` with `label="Name"` and `name="field.1"`

### Requirement: Dev harness wires the canvas to the renderer
The dev harness at `packages/form-components/src/index.html` SHALL include a `wb-form-renderer` element and, on every `wbChange` event from `wb-canvas`, call `renderer.setFields(e.detail)` so the rendered form mirrors the canvas in real time. The harness SHALL replace the existing standalone hardcoded `wb-form-field` block with the renderer. The harness SHALL surface the renderer's `wbSubmit` payload in the existing `#out` output block (or a dedicated preview-output block).

#### Scenario: Canvas changes update the rendered form
- **WHEN** the user adds a field on the canvas and the canvas emits `wbChange` with the new `FieldMeta[]`
- **THEN** the harness calls `renderer.setFields(...)` and the rendered form shows the new field

#### Scenario: Submitting the rendered form dumps the payload
- **WHEN** the user fills the rendered form and submits
- **THEN** the harness displays the `wbSubmit` payload (an object keyed by `field.<id>`) in the `#out` `<pre>` block

#### Scenario: Standalone hardcoded field is removed
- **WHEN** the harness is loaded
- **THEN** the standalone `<wb-form-field name="standalone.note">` element is no longer present; only the renderer-driven form renders inputs

### Requirement: Renderer forwards dropdown options to the field
When rendering a data field whose `type` is `select`, the `wb-form-renderer` SHALL forward the entry's `options` to the rendered `wb-form-field` so the fillable form renders a real dropdown with the configured choices.

#### Scenario: Select entry options are forwarded
- **WHEN** `fields` contains a data entry `{ id: 6, kind: 'data', type: 'select', label: 'Country', options: [{ key: 'us', label: 'US' }, { key: 'ca', label: 'CA' }, { key: 'mx', label: 'MX' }] }`
- **THEN** the rendered `wb-form-field` receives `options` `[{ key: 'us', label: 'US' }, { key: 'ca', label: 'CA' }, { key: 'mx', label: 'MX' }]`

#### Scenario: Select entry without options renders an empty dropdown
- **WHEN** a `select` data entry has no `options`
- **THEN** the rendered `wb-form-field` receives no `options` and renders an empty `<select>`

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

### Requirement: Renderer accepts prefill values keyed by submission name

`wb-form-renderer` SHALL accept an optional `values` prefill object of type `Record<string, string>` keyed by each rendered data field's submission name (`field.<id>`) — the same shape `wbSubmit` emits. The renderer SHALL pass each matching value to the corresponding `wb-form-field`, including data fields nested inside row containers, so the control displays that value. Prefill SHALL NOT change the rendered field set, validation configuration, or the `wbSubmit` payload shape.

#### Scenario: A saved submission prefills the form

- **WHEN** the renderer is given `values` `{ "field.1": "Alice", "field.2": "admin" }` and fields with ids 1 and 2
- **THEN** the rendered controls for `field.1` and `field.2` display "Alice" and "admin" respectively

#### Scenario: Partial prefill leaves the rest of the form empty

- **WHEN** the renderer has three data fields but `values` only contains a key for the second field
- **THEN** only the second field is filled and the other two render empty

#### Scenario: Nested row-container fields are prefilled

- **WHEN** a data field inside a row container has id 13 and `values` contains `"field.13": "A"`
- **THEN** the rendered field inside that row column displays "A"

#### Scenario: No values leaves the form empty

- **WHEN** the renderer renders fields without a `values` object (or with an empty object)
- **THEN** every rendered control is empty

### Requirement: Renderer ignores and reports unknown prefill keys

Prefill keys that match no rendered data field — an unknown id, a design-only element, or a field no longer present in the config — SHALL be ignored: they SHALL NOT create controls, alter other fields, or appear in the submit payload. The renderer SHALL report each ignored key with a `console.warn` naming that key, once per prefill application, and SHALL NOT throw.

#### Scenario: Unknown field id is ignored with a warning

- **WHEN** `values` contains `"field.99": "x"` but no data field has id 99
- **THEN** no control is affected, the submit payload never contains `field.99`, and a warning naming `field.99` is logged

#### Scenario: Design-element id is ignored with a warning

- **WHEN** `values` contains a key for an id belonging to a `kind === 'design'` element
- **THEN** the design element renders unchanged and a warning naming that key is logged

#### Scenario: Warning is not repeated on every re-render

- **WHEN** the renderer re-renders (for example after `setFields`) without a new prefill application
- **THEN** the unknown-key warning is not emitted again

### Requirement: Prefill does not overwrite user edits on re-render

The renderer SHALL apply prefill when it first renders fields and whenever the prefill input changes. Re-rendering with unchanged prefill values SHALL NOT overwrite values the user has typed. A changed prefill value for a field SHALL replace that field's current value, and a prefill object that omits a previously prefilled key SHALL leave that field's current value untouched.

#### Scenario: User edits survive a re-render

- **WHEN** a prefilled field is edited by the user and the renderer is then re-rendered with the same `values` object (for example after adding another field)
- **THEN** the user's edited value remains in the control

#### Scenario: Changed prefill value replaces the current value

- **WHEN** `values` changes a field's entry from "Alice" to "Bob"
- **THEN** that field displays "Bob"

#### Scenario: Omitting a key does not clear a field

- **WHEN** `values` changes from `{ "field.1": "Alice", "field.2": "x" }` to `{ "field.2": "x" }`
- **THEN** the `field.1` control keeps its current value

### Requirement: Prefill populates text, date, and select controls

The renderer SHALL forward a prefilled value so the field applies it to its control: single-line inputs, textareas, number inputs, and date inputs SHALL display the value; a `select` SHALL select the option whose key equals the value, and SHALL render its hint/empty state when no option key matches. Non-string primitive values SHALL be coerced with `String()`; `null` and `undefined` entries SHALL be treated as absent.

#### Scenario: Text and textarea controls show prefilled text

- **WHEN** `field.1` is a single-line text field and `field.7` a multiline field, prefilled with "Alice" and "Notes"
- **THEN** the input displays "Alice" and the textarea displays "Notes"

#### Scenario: Date control shows the prefilled date

- **WHEN** a date field is prefilled with `"2024-05-06"`
- **THEN** the date control displays 2024-05-06

#### Scenario: Select prefill selects the matching option

- **WHEN** a select field with options `us`/`ca`/`mx` is prefilled with `"ca"`
- **THEN** "CA" is the selected option and the placeholder hint option is not selected

#### Scenario: Select prefill without a matching option falls back to its empty state

- **WHEN** a select field with options `us`/`ca` is prefilled with `"zz"`
- **THEN** no real option is selected, the field is back in its hint/empty state, and its submitted value is empty rather than `"zz"`

#### Scenario: Non-string prefill values are coerced

- **WHEN** `values` is constructed in JavaScript with a numeric value such as `{ "field.3": 42 }`
- **THEN** the rendered field displays "42" rather than failing

#### Scenario: Nullish prefill entries are treated as absent

- **WHEN** `values` contains `{ "field.3": null }`
- **THEN** the field for id 3 stays empty and no `"null"` text is rendered

### Requirement: Prefill checks checkboxes only for the serialized on value

A checkbox field SHALL be checked when its prefilled value equals `'on'` — the serialized form `wbSubmit` emits — and SHALL be unchecked for any other prefilled value. A prefilled checkbox SHALL round-trip through submit unchanged.

#### Scenario: on prefills a checked checkbox

- **WHEN** a checkbox field named `field.5` is prefilled with `"on"`
- **THEN** the checkbox renders checked and submitting yields `field.5: "on"`

#### Scenario: Other values leave the checkbox unchecked

- **WHEN** a checkbox field is prefilled with `"true"`, `"yes"`, or `""`
- **THEN** the checkbox renders unchecked

### Requirement: Renderer exposes a setValues public method

`wb-form-renderer` SHALL expose a public `setValues(values: Record<string, string>): Promise<void>` method that applies the given prefill object, equivalent to setting the `values` prop. This lets hosts apply loaded data imperatively, mirroring `setFields`.

#### Scenario: Host applies loaded data via setValues

- **WHEN** a host page calls `renderer.setValues({ "field.1": "Alice" })`
- **THEN** the rendered field for id 1 displays "Alice"

### Requirement: Dev harness demonstrates the submit-to-prefill round trip

The dev harness at `packages/form-components/src/index.html` SHALL include a prefill input (a JSON textarea plus an apply button) that parses the entered object and calls `renderer.setValues(...)`. Applying a previously submitted `wbSubmit` payload SHALL fill the rendered form with those values. Invalid JSON SHALL be surfaced in the harness output without calling `setValues`.

#### Scenario: Submitted payload can be pasted back as prefill

- **WHEN** the user submits the rendered form, pastes the resulting payload into the harness prefill input, and applies it
- **THEN** the rendered form's controls show the values that were submitted

#### Scenario: Invalid prefill JSON is reported without side effects

- **WHEN** the user enters malformed JSON in the harness prefill input and applies it
- **THEN** the harness displays an error in its output block and the rendered form is unchanged
