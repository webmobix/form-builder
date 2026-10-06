# Spec Delta

## MODIFIED Requirements

### Requirement: Inspector offers a delete action for the selected element
The inspector SHALL render a Delete button for the currently selected element in both the design-element panel and the data-field panel when its `showDeleteFieldButton` property is not `false` (default `true`). Activating it SHALL emit `wbInspectDelete: CustomEvent<{ id: number }>` with the selected field's id; the inspector SHALL NOT mutate canvas state directly. When `showDeleteFieldButton` is `false`, the inspector SHALL NOT render the Delete button and SHALL NOT emit `wbInspectDelete`.

#### Scenario: Delete button present on both panels
- **WHEN** the inspector shows settings for a data field or a design element and `showDeleteFieldButton` is unset or `true`
- **THEN** a Delete button is rendered in the panel

#### Scenario: Delete button hidden when disabled
- **WHEN** the inspector shows settings for a data field or a design element and `showDeleteFieldButton` is `false`
- **THEN** the inspector does not render a Delete button in either panel

#### Scenario: Activation emits wbInspectDelete
- **WHEN** the user clicks Delete while a field with id 12 is selected and `showDeleteFieldButton` is not `false`
- **THEN** the inspector emits `wbInspectDelete` with `detail` equal to `{ id: 12 }` and performs no state mutation itself
