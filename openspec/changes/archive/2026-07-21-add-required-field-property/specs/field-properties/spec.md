## ADDED Requirements

### Requirement: Inspector provides a required toggle
The inspector SHALL render a "Required" checkbox toggle for all field types. Toggling it SHALL emit a `wbFieldUpdated` event with `{ required: true }` or `{ required: false }` in the patch.

#### Scenario: Required checkbox appears for all field types
- **WHEN** any field type is selected in the inspector
- **THEN** the inspector renders a "Required" checkbox showing the field's current `required` state (unchecked when unset)

#### Scenario: Toggling required emits an update
- **WHEN** the user checks or unchecks the "Required" checkbox
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ required: true }` or `{ required: false }`
