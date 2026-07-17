## ADDED Requirements

### Requirement: Desktop drag initiation from palette
The system SHALL allow a user on a fine-pointer (desktop) input device to press and hold on a palette item and begin dragging that field type toward the canvas. Drag initiation SHALL be gated to fine-pointer or mouse input; coarse-pointer (touch) interactions SHALL fall through to the existing tap-to-add behavior and SHALL NOT start a drag.

#### Scenario: Mouse press starts a drag
- **WHEN** a desktop user presses the mouse button down on a palette item
- **THEN** the system begins a palette drag for that field type and starts tracking pointer movement

#### Scenario: Touch press does not start a drag
- **WHEN** a touch user presses down on a palette item
- **THEN** the system does not start a drag and the existing tap-to-add behavior remains available

#### Scenario: Fine-pointer pen input starts a drag
- **WHEN** a user with a fine-pointer pen device presses down on a palette item
- **THEN** the system begins a palette drag for that field type

### Requirement: Floating ghost preview during palette drag
The system SHALL render a floating ghost preview that follows the pointer during a palette drag. The ghost SHALL be displayed in the light DOM (not inside a shadow root) so it remains visible across shadow boundaries, and SHALL show the dragged field's label. The ghost SHALL be removed when the drag ends or is cancelled.

#### Scenario: Ghost appears and follows the pointer
- **WHEN** a palette drag is in progress
- **THEN** a floating element showing the dragged field's label is rendered in the document body and its position tracks the pointer's client coordinates

#### Scenario: Ghost is removed on drop
- **WHEN** the user releases the pointer over the canvas
- **THEN** the ghost element is removed from the document

#### Scenario: Ghost is removed on cancel
- **WHEN** the drag is cancelled (e.g. the pointer is released outside the canvas, or a pointercancel occurs)
- **THEN** the ghost element is removed from the document and no field is added

### Requirement: Live drop indicator during palette drag
While a palette drag is in progress, the canvas SHALL display its existing drop indicator at the insertion index computed from the pointer's vertical position over the canvas rows. When the pointer is outside the canvas's row list, no insertion indicator SHALL be shown.

#### Scenario: Indicator tracks the pointer over the canvas
- **WHEN** the pointer moves over the canvas row list during a palette drag
- **THEN** the drop indicator is shown at the index where the new field would be inserted, updating as the pointer moves

#### Scenario: No indicator when pointer is off the canvas
- **WHEN** the pointer is outside the canvas row list during a palette drag
- **THEN** no drop indicator is shown and no insertion index is committed

### Requirement: Insert at hovered index on drop
When the user releases the pointer over the canvas during a palette drag, the system SHALL insert a new field of the dragged type at the insertion index indicated by the drop indicator, and SHALL emit `wbChange` with the updated field list. If no insertion index is current (pointer released outside the row list), no field SHALL be added.

#### Scenario: Drop inserts at the indicated position
- **WHEN** the user releases the pointer over the canvas with the drop indicator at index N
- **THEN** a new field of the dragged type is inserted at index N and `wbChange` is emitted with the full updated field list

#### Scenario: Drop outside the canvas cancels
- **WHEN** the user releases the pointer outside the canvas row list
- **THEN** no field is added and `wbChange` is not emitted for an insert

#### Scenario: New field receives a stable unique id
- **WHEN** a field is inserted via a palette drag drop
- **THEN** the new field is assigned a unique id from the same id source as click-added fields, preserving the canvas's stable-key discipline

### Requirement: Click-to-add remains append-only
The existing click-to-add path SHALL continue to append the field to the end of the canvas and SHALL continue to emit `wbAddField` with the same payload. The desktop drag capability SHALL NOT alter the `wbAddField` event contract or the append behavior of `addField`.

#### Scenario: Click still appends
- **WHEN** a user clicks (taps) a palette item without initiating a drag
- **THEN** the field is appended to the end of the canvas via the existing `wbAddField` → `addField` path

#### Scenario: wbAddField contract unchanged
- **WHEN** a palette item is clicked
- **THEN** `wbAddField` is emitted with the same `{ type, label }` payload as before this change

### Requirement: No new third-party drag dependency
The palette drag-and-drop SHALL be implemented using native Pointer Events, consistent with the existing canvas reorder drag. The system SHALL NOT introduce a new drag-and-drop library.

#### Scenario: Implementation uses Pointer Events
- **WHEN** the palette drag is implemented
- **THEN** it uses Pointer Events (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) and `setPointerCapture`, and no new drag-and-drop package is added to dependencies