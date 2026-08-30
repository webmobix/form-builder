## MODIFIED Requirements

### Requirement: Always-visible drag handle initiates handle-only dragging
Each element on the canvas SHALL show a floating grip badge overlapping its top-left corner at all times (not only on hover), with tooltip "Drag to move". Pressing the badge SHALL select the element and start the existing pointer-capture drag/reorder flow (including palette→canvas cross-drag targets). Dragging from any other part of the element SHALL NOT initiate a drag. During a grip-handle reorder drag, the canvas SHALL display the same top-level insertion indicator used by palette drags — a visual line at the index where the element would be inserted — updating live as the pointer moves over the canvas row list; when the pointer is outside the canvas row list, no insertion indicator SHALL be shown. The indicator positioning and the committed drop index SHALL use the same insertion-index computation as palette drags, accounting for the dragged element's own position so the committed index produces the intended final order.

#### Scenario: Handle visible without hover
- **WHEN** the canvas displays elements and the pointer is elsewhere
- **THEN** every element shows its grip badge at the top-left corner

#### Scenario: Pressing the handle starts a drag and selects
- **WHEN** the user presses the grip badge and moves the pointer
- **THEN** the element becomes selected and the ghost and insertion-indicator drag flow starts with the indicator visible

#### Scenario: Element body does not drag
- **WHEN** the user presses and moves on a rendered element outside the handle
- **THEN** no drag starts (the interaction is selection only)

#### Scenario: Indicator shows insertion position during reorder
- **WHEN** an element is being reordered by its grip handle and the pointer moves over the canvas row list
- **THEN** the insertion indicator appears at the insertion index between other elements, updating as the pointer moves

#### Scenario: Indicator hidden when pointer leaves the row list
- **WHEN** an element is being reordered by its grip handle and the pointer moves off the canvas row list
- **THEN** no insertion indicator is shown

#### Scenario: Drop lands where the indicator showed
- **WHEN** the user releases the pointer during a reorder drag with the indicator between two other elements
- **THEN** the dragged element is committed at the index the indicator displayed, matching the final order the indicator promised

#### Scenario: Releasing off the row list cancels the reorder
- **WHEN** the user releases the pointer during a reorder drag while the pointer is outside the canvas row list (no indicator shown)
- **THEN** the field order is unchanged and no `wbChange` is emitted