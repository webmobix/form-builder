# Spec Delta

## ADDED Requirements

### Requirement: Consistent pointer affordance across the element surface
While the pointer is over any non-interactive part of a canvas element, the canvas SHALL present the same pointer (hand) cursor used on the element border. The cursor SHALL NOT change to a default, text, or disabled cursor when the pointer crosses the field label, field body, disabled preview control, heading, paragraph, or empty-column placeholder inside an element. Interactive chrome keeps its own cursor: the drag grip SHALL present a grab cursor and the delete button SHALL present a pointer cursor.

#### Scenario: Hovering the field label shows the pointer cursor
- **WHEN** the pointer rests over the label text of a rendered data field (outside the grip and delete button)
- **THEN** the cursor is the pointer (hand) cursor, matching the element border

#### Scenario: Hovering the field body shows the pointer cursor
- **WHEN** the pointer rests over the disabled control rendered as a data field's body
- **THEN** the cursor is the pointer (hand) cursor, not the default/disabled cursor, and the element's hover outline is shown

#### Scenario: Hovering a heading or paragraph shows the pointer cursor
- **WHEN** the pointer rests over the text of a rendered heading or paragraph element
- **THEN** the cursor is the pointer (hand) cursor

#### Scenario: Interactive chrome keeps its distinct cursor
- **WHEN** the pointer rests over the drag grip or the delete button
- **THEN** the grip shows a grab cursor and the delete button shows a pointer cursor, distinct from the element body

## MODIFIED Requirements

### Requirement: Canvas controls are inert
Rendered canvas controls SHALL NOT accept user input interaction: they SHALL NOT receive keyboard focus, SHALL NOT accept typing or value changes, SHALL NOT toggle checkboxes, and SHALL NOT open native pickers or popups. Keyboard navigation SHALL move between element wrappers, never into inner controls. Clicking anywhere on an element SHALL select it and emit `wbFieldSelected` (inspector wiring unchanged); clicking the empty canvas area SHALL deselect.

#### Scenario: Typing into a canvas control does nothing
- **WHEN** the user attempts to type or paste into a canvas-rendered input
- **THEN** the value remains empty and no edit occurs

#### Scenario: Checkbox does not toggle
- **WHEN** the user clicks the checkbox of a canvas-rendered checkbox field
- **THEN** the checkbox stays unchecked and the element becomes selected instead

#### Scenario: Tab skips inner controls
- **WHEN** the user presses Tab repeatedly while the canvas has focus
- **THEN** focus lands on element wrappers only, never inside an input, textarea, or editor

#### Scenario: Clicking an element selects it
- **WHEN** the user clicks anywhere on a rendered element
- **THEN** the canvas emits `wbFieldSelected` with that element and shows the selection ring

#### Scenario: Clicking the inert preview control selects the element
- **WHEN** the user clicks directly on a rendered data field's disabled control or its label
- **THEN** the disabled control does not absorb the click: the element becomes selected and `wbFieldSelected` is emitted, with no value change in the control

#### Scenario: Clicking empty canvas deselects
- **WHEN** an element is selected and the user clicks the canvas background outside any element
- **THEN** the selection is cleared
