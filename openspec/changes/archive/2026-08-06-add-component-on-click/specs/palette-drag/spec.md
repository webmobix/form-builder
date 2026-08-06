## MODIFIED Requirements

### Requirement: Click-to-add follows selection
The existing click-to-add path SHALL continue to emit `wbAddField` with the same `{ type, label }` payload. When no canvas component is selected, click-to-add SHALL append the field to the end of the canvas. When a canvas component is selected, click-to-add SHALL insert the field immediately after that selected component. The desktop drag capability SHALL NOT alter the `wbAddField` event contract.

#### Scenario: Click appends when nothing is selected
- **WHEN** a user clicks (taps) a palette item while no canvas component is selected
- **THEN** the field is appended to the end of the canvas via the existing `wbAddField` → `addField` path

#### Scenario: Click inserts after the selected component
- **WHEN** a user clicks (taps) a palette item while a canvas component is selected
- **THEN** the field is inserted immediately after the selected component

#### Scenario: wbAddField contract unchanged
- **WHEN** a palette item is clicked
- **THEN** `wbAddField` is emitted with the same `{ type, label }` payload as before this change
