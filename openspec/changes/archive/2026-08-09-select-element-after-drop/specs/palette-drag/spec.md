## MODIFIED Requirements

### Requirement: Insert at hovered index on drop
When the user releases the pointer over the canvas during a palette drag, the system SHALL insert a new field of the dragged type (and `subtype` when present) at the insertion index indicated by the drop indicator, SHALL emit `wbChange` with the updated field list, SHALL make the newly inserted field the selected field, and SHALL emit `wbFieldSelected` for that field. If no insertion index is current (pointer released outside the row list), no field SHALL be added.

#### Scenario: Drop inserts at the indicated position with subtype
- **WHEN** the user releases the pointer over the canvas with the drop indicator at index N while dragging the "Email" entry
- **THEN** a new field with `{ type: 'text', subtype: 'email', label: 'Email' }` is inserted at index N and `wbChange` is emitted with the full updated field list

#### Scenario: Drop outside the canvas cancels
- **WHEN** the user releases the pointer outside the canvas row list
- **THEN** no field is added and `wbChange` is not emitted for an insert

#### Scenario: New field receives a stable unique id
- **WHEN** a field is inserted via a palette drag drop
- **THEN** the new field is assigned a unique id from the same id source as click-added fields, preserving the canvas's stable-key discipline

#### Scenario: Dropped field becomes the selected field
- **WHEN** a palette drag is dropped over the canvas and a new field is inserted
- **THEN** the canvas sets the newly inserted field as its selected field (matching click-to-add behavior)

#### Scenario: Dropped field is revealed in the inspector
- **WHEN** a palette drag is dropped over the canvas and a new field is inserted
- **THEN** the canvas emits `wbFieldSelected` with the newly inserted field so the inspector renders its properties without an additional click
