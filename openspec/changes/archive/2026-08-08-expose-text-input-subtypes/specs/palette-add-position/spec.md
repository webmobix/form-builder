## MODIFIED Requirements

### Requirement: Click insertion follows selection
When a user clicks a palette item, the system SHALL insert the new field either immediately after the currently selected canvas component (when exactly one component is selected) or at the end of the canvas field list (when no component is selected). The inserted field SHALL carry the palette entry's `subtype` when present (Email/URL/Number/Password/Text input entries) so the created `FieldMeta` has the correct `subtype`.

#### Scenario: Insert after selected component with subtype
- **WHEN** a user has a single component selected in the canvas and clicks the "Number" palette item
- **THEN** a new field with `{ type: 'text', subtype: 'number', label: 'Number' }` is inserted immediately after the selected component and `wbChange` is emitted with the full updated field list

#### Scenario: Append when nothing is selected with no subtype
- **WHEN** a user clicks the "Dropdown" palette item while no component is selected in the canvas
- **THEN** a new field with `{ type: 'select', label: 'Dropdown' }` (no `subtype`) is appended to the end of the canvas field list and `wbChange` is emitted with the full updated field list

### Requirement: New field becomes selected
After a palette click that adds a field (whether inserted after a selected component or appended), the system SHALL make the newly added field the currently selected component and emit `wbFieldSelected` with the new field (including its `subtype` when applicable).

#### Scenario: Inserted field is selected
- **WHEN** a palette click inserts a new field after a selected component
- **THEN** the newly inserted field becomes the selected component and `wbFieldSelected` is emitted with the new field

#### Scenario: Appended field is selected
- **WHEN** a palette click appends a new field to the end while no component was selected
- **THEN** the newly appended field becomes the selected component and `wbFieldSelected` is emitted with the new field

### Requirement: wbAddField contract carries optional subtype
The existing `wbAddField` event SHALL continue to be emitted by the palette with a `{ type, label }` payload on click, now extended with an optional `subtype` property for text-input subtype entries. Position decision-making SHALL occur downstream in the canvas, not in the palette.

#### Scenario: wbAddField payload includes subtype for text-input entries
- **WHEN** a user clicks a text-input subtype palette item (Email/URL/Number/Password/Text input)
- **THEN** `wbAddField` is emitted with `{ type: 'text', subtype: <that subtype>, label: <that label> }`

#### Scenario: wbAddField payload omits subtype for non-text entries
- **WHEN** a user clicks a non-text palette item (Dropdown/Date/Checkbox)
- **THEN** `wbAddField` is emitted with `{ type: <that type>, label: <that label> }` and no `subtype` property

### Requirement: New field receives a stable unique id
When a field is inserted via a palette click, the system SHALL assign the new field a unique id from the same id source used by `addField` and drag-and-drop insertion, preserving the canvas's stable-key discipline. The `subtype` SHALL be persisted on the new `FieldMeta` when provided.

#### Scenario: Click-inserted field is uniquely identified and carries subtype
- **WHEN** a palette click inserts a field after a selected component or appends it
- **THEN** the new field is assigned a unique id from the canvas id source, does not collide with existing field ids, and carries the palette entry's `subtype` when present