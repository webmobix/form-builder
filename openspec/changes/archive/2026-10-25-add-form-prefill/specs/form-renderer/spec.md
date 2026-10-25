## ADDED Requirements

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
