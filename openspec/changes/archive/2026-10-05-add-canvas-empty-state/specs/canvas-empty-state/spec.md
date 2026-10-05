# Spec Delta

## Purpose

Lets hosts fill the empty canvas with their own default content (onboarding copy, illustration, or drop guidance) while the canvas keeps working as a drop target for adding the first element.

## ADDED Requirements

### Requirement: Canvas renders host-provided default content when empty

When the top-level element list is empty, the canvas SHALL render an unnamed slot inside its scrollable canvas surface so that children passed by the host are displayed as the canvas's default content. When at least one element exists, the canvas SHALL NOT render the slot and the passed children SHALL be hidden. When the host passes no children, the canvas SHALL display no built-in placeholder.

#### Scenario: Empty canvas shows passed children

- **WHEN** `wb-canvas` is rendered with host-provided children and its element list is empty
- **THEN** those children are displayed in the canvas surface

#### Scenario: Non-empty canvas hides passed children

- **WHEN** the canvas contains at least one element and children were passed by the host
- **THEN** the default content is not rendered and the element list is shown

#### Scenario: No children passed leaves the canvas unchanged

- **WHEN** `wb-canvas` is rendered with no children and an empty element list
- **THEN** no placeholder, box, or other new visual is displayed beyond the existing blank canvas

### Requirement: Empty canvas remains a palette drop target

While the default content is shown, the canvas SHALL remain a palette drop target over its scrollable surface. A palette drag over the canvas SHALL resolve the top-level insertion index (0 for an empty canvas) and SHALL show the top-level drop indicator; releasing there SHALL insert the dragged element and replace the default content with the rendered field list.

#### Scenario: Drop indicator appears over an empty canvas

- **WHEN** a palette drag moves over an empty canvas that shows default content
- **THEN** the top-level drop indicator is shown at insertion index 0

#### Scenario: Dropping over the empty state inserts the element

- **WHEN** a palette drag is released over an empty canvas showing default content
- **THEN** the dragged element is inserted as the first element, `wbChange` is emitted with the updated field list, and the default content is no longer rendered

#### Scenario: Release outside the canvas does not insert

- **WHEN** a palette drag is released outside the canvas scrollable surface
- **THEN** no element is added and the default content remains

### Requirement: Default content is excluded from element hit-testing

The default content SHALL NOT be treated as a canvas element: it SHALL carry no element id, SHALL NOT participate in insertion-index computation, and SHALL NOT be a row-container column target. Insertion index and column targeting SHALL be derived only from rendered elements.

#### Scenario: Default-content markup does not shift the insertion index

- **WHEN** the canvas is empty, shows default content, and a drag insertion index is computed
- **THEN** the computed index is 0 and does not count any part of the default content as a row

#### Scenario: Default-content markup is not a column target

- **WHEN** a drag hovers over the scrollable surface while default content is shown and there are no row containers
- **THEN** no column drop target is resolved

### Requirement: Empty-state sizing hook

The canvas SHALL expose a `--wb-canvas-empty-min-height` CSS custom property that sets the minimum height of the default-content region. Its default SHALL be `0` so hosts that pass no children incur no extra box.

#### Scenario: Host sets the empty-state height

- **WHEN** a host sets `--wb-canvas-empty-min-height` on the canvas
- **THEN** the default-content region uses that value as its minimum height, giving the empty canvas a larger drop surface

#### Scenario: Default is zero

- **WHEN** the host does not set the property
- **THEN** the default-content region adds no minimum height of its own

### Requirement: Canvas fills available height and centres default content

The canvas SHALL fill the height made available by its container, and while the canvas is empty its default content SHALL be centred vertically within that region. When the container provides no height, the canvas SHALL fall back to sizing to its content. When elements are present, the field list SHALL keep its existing top-aligned scroll behaviour.

#### Scenario: Canvas fills a definite container height

- **WHEN** the canvas is placed in a container that gives it a definite height
- **THEN** the canvas and its scrollable surface fill that height

#### Scenario: Empty default content is vertically centred

- **WHEN** the canvas is empty, shows default content, and is taller than that content
- **THEN** the default content is centred vertically within the canvas surface

#### Scenario: Non-empty field list stays top-aligned

- **WHEN** the canvas has at least one element
- **THEN** the field list starts at the top of the scrollable surface and scrolls as before
