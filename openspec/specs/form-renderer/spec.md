## Requirements

### Requirement: Renderer renders a fillable form from a FieldMeta[] config
The `wb-form-renderer` component SHALL accept a `fields: FieldMeta[]` prop and render one `wb-form-field` child per entry inside a `<form>` element in its shadow DOM. For each field it SHALL forward the entry's `type`, `label`, `subtype`, `restrictions`, and a `required` flag to the corresponding `wb-form-field` props. The renderer SHALL derive each rendered field's submission `name` as `field.<id>` using the entry's stable `id`.

#### Scenario: Empty config renders no fields
- **WHEN** `fields` is `[]` (or unset)
- **THEN** the renderer renders the surrounding `<form>` with no `wb-form-field` children

#### Scenario: One field renders one labeled input
- **WHEN** `fields` is `[{ id: 1, type: 'text', label: 'Name' }]`
- **THEN** the renderer renders exactly one `wb-form-field` with `label="Name"`, `type="text"`, and `name="field.1"`

#### Scenario: Multiple fields each get a unique name from their id
- **WHEN** `fields` is `[{ id: 1, type: 'text', label: 'A' }, { id: 2, type: 'checkbox', label: 'B' }]`
- **THEN** the renderer renders two `wb-form-field` elements with `name="field.1"` and `name="field.2"` respectively, each forwarding its own `label` and `type`

#### Scenario: subtype and restrictions are forwarded to the field
- **WHEN** `fields` contains an entry `{ id: 3, type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 120 } } }`
- **THEN** the rendered `wb-form-field` has `subtype="number"` and `restrictions` equal to `{ number: { min: 0, max: 120 } }`

#### Scenario: required flag is forwarded when set
- **WHEN** a field entry carries a truthy `required` flag
- **THEN** the rendered `wb-form-field` has its `required` prop set to `true`

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
The renderer SHALL include a submit button in its rendered form. On form submit, the renderer SHALL emit a `wbSubmit` event whose `detail` is a plain object mapping each rendered field's `name` (`field.<id>`) to its submitted value, derived from the form's `FormData`. Checkbox fields SHALL serialize to `'on'` when checked and be omitted (or empty) when unchecked, consistent with `wb-form-field`'s `setFormValue` behavior.

#### Scenario: Submit collects values keyed by field name
- **WHEN** the rendered form has fields with names `field.1` and `field.2`, the user enters "Alice" into field.1 and "admin" into field.2, and submits
- **THEN** the `wbSubmit` event `detail` equals `{ "field.1": "Alice", "field.2": "admin" }`

#### Scenario: Unchecked checkbox is omitted from the payload
- **WHEN** the rendered form has a checkbox field with name `field.5` left unchecked and the form is submitted
- **THEN** the `wbSubmit` event `detail` does not contain a `field.5` key (or its value is empty string)

#### Scenario: Checked checkbox serializes to on
- **WHEN** the rendered form has a checked checkbox field with name `field.5` and the form is submitted
- **THEN** the `wbSubmit` event `detail["field.5"]` equals `'on'`

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
