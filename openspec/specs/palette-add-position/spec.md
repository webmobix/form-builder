## ADDED Requirements

### Requirement: Click insertion follows selection
When a user clicks a palette item, the system SHALL insert the new field either immediately after the currently selected canvas component (when exactly one component is selected) or at the end of the canvas field list (when no component is selected).

#### Scenario: Insert after selected component
- **WHEN** a user has a single component selected in the canvas and clicks a palette item
- **THEN** a new field of the clicked type is inserted immediately after the selected component and `wbChange` is emitted with the full updated field list

#### Scenario: Append when nothing is selected
- **WHEN** a user clicks a palette item while no component is selected in the canvas
- **THEN** the new field is appended to the end of the canvas field list and `wbChange` is emitted with the full updated field list

### Requirement: New field becomes selected
After a palette click that adds a field (whether inserted after a selected component or appended), the system SHALL make the newly added field the currently selected component and emit `wbFieldSelected` with the new field.

#### Scenario: Inserted field is selected
- **WHEN** a palette click inserts a new field after a selected component
- **THEN** the newly inserted field becomes the selected component and `wbFieldSelected` is emitted with the new field

#### Scenario: Appended field is selected
- **WHEN** a palette click appends a new field to the end while no component was selected
- **THEN** the newly appended field becomes the selected component and `wbFieldSelected` is emitted with the new field

### Requirement: wbAddField contract unchanged
The existing `wbAddField` event SHALL continue to be emitted by the palette with the same `{ type, label }` payload on click. Position decision-making SHALL occur downstream in the canvas, not in the palette.

#### Scenario: wbAddField payload unchanged
- **WHEN** a user clicks a palette item
- **THEN** `wbAddField` is emitted with the same `{ type, label }` payload as before this change

### Requirement: New field receives a stable unique id
When a field is inserted via a palette click, the system SHALL assign the new field a unique id from the same id source used by `addField` and drag-and-drop insertion, preserving the canvas's stable-key discipline.

#### Scenario: Click-inserted field is uniquely identified
- **WHEN** a palette click inserts a field after a selected component or appends it
- **THEN** the new field is assigned a unique id from the canvas id source and does not collide with existing field ids
