## Requirements

### Requirement: Dropdown field renders a native select element
A `wb-form-field` with `type === 'select'` SHALL render a native `<select>` element instead of a text `<input>`. The `<select>` SHALL contain one `<option>` per configured option, in order, with the option's label as its text content and the option's key as its `value` attribute. The selected option's key SHALL be the field's submitted value via the existing `ElementInternals`/FormData flow.

#### Scenario: Select field renders a select element
- **WHEN** a `wb-form-field` has `type="select"` and options `[{ key: 'red', label: 'Red' }, { key: 'green', label: 'Green' }, { key: 'blue', label: 'Blue' }]`
- **THEN** it renders a `<select>` (not an `<input>`) containing three `<option>` children labeled "Red", "Green", and "Blue" in that order, with `value` attributes `red`, `green`, and `blue`

#### Scenario: Select field with no options renders an empty select
- **WHEN** a `wb-form-field` has `type="select"` and no `options`
- **THEN** it renders a `<select>` with no `<option>` children (or only a placeholder option)

#### Scenario: Submitting a select field submits the chosen option's key
- **WHEN** the user selects the "Green" option on a select field and the form is submitted
- **THEN** the submitted value for that field's name is `"green"` (the selected option's key)

#### Scenario: Required validation applies to select fields
- **WHEN** a required select field has no selection and the form is submitted
- **THEN** the field reports a value-missing validity error and is not submitted empty

### Requirement: Dropdown options are forwarded to the field
The `wb-form-renderer` and the `wb-canvas` preview SHALL forward a field's `options` to the `wb-form-field` so both the rendered fillable form and the canvas preview display a real dropdown with the configured choices.

#### Scenario: Renderer forwards options to the field
- **WHEN** the renderer renders a `select` data field whose `FieldMeta.options` is `[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]`
- **THEN** the rendered `wb-form-field` receives `options` `[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]` and renders two `<option>`s

#### Scenario: Canvas preview forwards options to the field
- **WHEN** the canvas renders a `select` field preview whose `FieldMeta.options` is `[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]`
- **THEN** the preview `wb-form-field` receives `options` `[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]`
