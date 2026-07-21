## Requirements

### Requirement: FieldMeta carries a required flag
The `FieldMeta` interface in `form-core` SHALL include an optional `required` boolean property. When `true`, the field SHALL be treated as mandatory. When `false` or `undefined`, the field SHALL NOT be required.

#### Scenario: FieldMeta includes required property
- **WHEN** a `FieldMeta` object is created
- **THEN** it MAY carry a `required?: boolean` property alongside `id`, `type`, `label`, `subtype`, and `restrictions`

#### Scenario: Required field enforces value presence
- **WHEN** a field has `required: true` and the user submits the form without entering a value
- **THEN** the field SHALL report a `valueMissing` validity error with a message indicating the field is required

#### Scenario: Non-required field allows empty value
- **WHEN** a field has `required: false` (or `required` is undefined) and the user submits the form without entering a value
- **THEN** the field SHALL NOT report a `valueMissing` validity error

### Requirement: Inspector provides a required toggle
The inspector SHALL render a "Required" checkbox toggle for all field types. Toggling it SHALL emit a `wbFieldUpdated` event with `{ required: true }` or `{ required: false }` in the patch.

#### Scenario: Required checkbox appears for all field types
- **WHEN** any field type is selected in the inspector
- **THEN** the inspector renders a "Required" checkbox showing the field's current `required` state (unchecked when unset)

#### Scenario: Toggling required emits an update
- **WHEN** the user checks or unchecks the "Required" checkbox
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ required: true }` or `{ required: false }`

### Requirement: Form renderer forwards required to wb-form-field
The form renderer SHALL forward the `required` property from each `FieldMeta` entry to the corresponding `wb-form-field` component.

#### Scenario: Required field renders with required prop
- **WHEN** a `FieldMeta` entry has `required: true`
- **THEN** the rendered `wb-form-field` has its `required` prop set to `true`

#### Scenario: Non-required field renders without required prop
- **WHEN** a `FieldMeta` entry has `required: false` or `required` is undefined
- **THEN** the rendered `wb-form-field` has its `required` prop set to `false` (or omitted)
