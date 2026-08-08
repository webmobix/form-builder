## MODIFIED Requirements

### Requirement: Click-to-add follows selection
The existing click-to-add path SHALL continue to emit `wbAddField` with a `{ type, label }` payload, now extended with an optional `subtype` for the text-input subtype palette entries (Email/URL/Number/Password/Text input). When no canvas component is selected, click-to-add SHALL append the field to the end of the canvas. When a canvas component is selected, click-to-add SHALL insert the field immediately after that selected component. The desktop drag capability SHALL NOT alter the `wbAddField` event contract beyond adding the optional `subtype`.

#### Scenario: Click appends when nothing is selected
- **WHEN** a user clicks (taps) a palette item while no canvas component is selected
- **THEN** the field is appended to the end of the canvas via the existing `wbAddField` → `addField` path, carrying its `subtype` when present

#### Scenario: Click inserts after the selected component
- **WHEN** a user clicks (taps) a palette item while a canvas component is selected
- **THEN** the field is inserted immediately after the selected component, carrying its `subtype` when present

#### Scenario: wbAddField contract carries optional subtype
- **WHEN** a palette item is clicked
- **THEN** `wbAddField` is emitted with `{ type, label, subtype? }`, where `subtype` is present for text-input subtype entries and absent otherwise

### Requirement: Insert at hovered index on drop
When the user releases the pointer over the canvas during a palette drag, the system SHALL insert a new field of the dragged type (and `subtype` when present) at the insertion index indicated by the drop indicator, and SHALL emit `wbChange` with the updated field list. If no insertion index is current (pointer released outside the row list), no field SHALL be added.

#### Scenario: Drop inserts at the indicated position with subtype
- **WHEN** the user releases the pointer over the canvas with the drop indicator at index N while dragging the "Email" entry
- **THEN** a new field with `{ type: 'text', subtype: 'email', label: 'Email' }` is inserted at index N and `wbChange` is emitted with the full updated field list

#### Scenario: Drop outside the canvas cancels
- **WHEN** the user releases the pointer outside the canvas row list
- **THEN** no field is added and `wbChange` is not emitted for an insert

#### Scenario: New field receives a stable unique id
- **WHEN** a field is inserted via a palette drag drop
- **THEN** the new field is assigned a unique id from the same id source as click-added fields, preserving the canvas's stable-key discipline