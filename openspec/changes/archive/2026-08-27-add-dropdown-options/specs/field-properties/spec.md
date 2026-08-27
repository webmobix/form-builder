## ADDED Requirements

### Requirement: FieldMeta carries dropdown options
`form-core` SHALL define an optional `options?: { key: string; label: string }[]` property on `FieldMeta`. `options` SHALL apply only to fields whose `type` is `select` and SHALL represent the ordered list of selectable choices for the dropdown. It SHALL be omitted (or empty) for all other field types. The editor UI SHALL use the same value for each option's `key` and `label`.

#### Scenario: FieldMeta accepts options for a select field
- **WHEN** a `FieldMeta` is constructed with `{ id: 1, type: 'select', label: 'Country', options: [{ key: 'us', label: 'US' }, { key: 'ca', label: 'CA' }, { key: 'mx', label: 'MX' }] }`
- **THEN** it is type-valid and carries the `options` array in order

#### Scenario: options is optional
- **WHEN** a `FieldMeta` is constructed without an `options` property
- **THEN** the field is valid and renders with no configured choices (empty dropdown)

### Requirement: Inspector provides an options editor for dropdown fields
When the selected field's `type` is `select`, the inspector SHALL render an "Options" editor allowing the builder to manage the dropdown's choices. The editor SHALL let the builder add a new option, remove an existing option, and edit an existing option's label. Changes SHALL emit a `wbFieldUpdated` event carrying the field `id` and a patch with the full updated `options` array, preserving order. The editor SHALL NOT be rendered for any non-`select` field type.

#### Scenario: Options editor appears for dropdown fields
- **WHEN** the selected field's `type` is `select`
- **THEN** the inspector renders an "Options" editor listing each current option with an editable text input and a remove control, plus an "Add option" action

#### Scenario: Options editor hidden for non-dropdown fields
- **WHEN** the selected field's `type` is not `select`
- **THEN** the inspector does not render the Options editor

#### Scenario: Editing an option label emits an update
- **WHEN** the builder changes an option's label from "A" to "Apple"
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch whose `options` reflects the option with `{ key: 'Apple', label: 'Apple' }` in the same position (key follows the label)

#### Scenario: Adding an option emits an update
- **WHEN** the builder adds a new option
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch whose `options` includes the new option appended

#### Scenario: Removing an option emits an update
- **WHEN** the builder removes an existing option
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch whose `options` no longer contains the removed option, preserving the order of the remaining options

#### Scenario: Canvas applies the options patch to the field
- **WHEN** the host applies the inspector's `options` patch to the matching canvas field
- **THEN** the canvas updates the field's `options` and emits `wbChange` with the updated field list
