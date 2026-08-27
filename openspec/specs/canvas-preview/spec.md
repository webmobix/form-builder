## Requirements

### Requirement: Canvas renders data fields as real inert form controls
The canvas SHALL render each `kind === 'data'` element by stamping a real `wb-form-field` component forwarded the entry's `type`, `subtype`, `restrictions`, `multiline`, `initialLines`, `maxHeight`, `placeholder`, `required`, and `label` props, placed in disabled state, so its appearance matches what `wb-form-renderer` produces for the same entry (labels, required marks, control styling, spacing). Disabled fields SHALL look normal: no dimming, graying, or other visual difference from the live form's normal appearance.

#### Scenario: Text field renders as the real labeled input
- **WHEN** the canvas renders a `kind: 'data'`, `type: 'text'` element with a label
- **THEN** the canvas shows a `wb-form-field` rendering the same labeled `<input>` markup and styling the live form would show

#### Scenario: Required mark renders as in the live form
- **WHEN** a data element has `required: true`
- **THEN** the canvas-rendered field shows the label followed by the red required asterisk, matching the renderer

#### Scenario: Disabled fields show no disabled visual treatment
- **WHEN** any data field is rendered on the canvas in disabled state
- **THEN** the control looks identical to its enabled live-form appearance (no browser-disabled graying)

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

#### Scenario: Clicking empty canvas deselects
- **WHEN** an element is selected and the user clicks the canvas background outside any element
- **THEN** the selection is cleared

### Requirement: Hover border distinguishes leaf elements from layout containers
While the pointer hovers over an unselected element, the canvas SHALL draw an outline around it: approximately 2px solid light-blue (accent family) for leaf elements (data fields, headings, paragraphs); a dashed variant of the same blue for layout containers (row containers and their columns). No outline SHALL be shown when the pointer is not over the element, unless the element is selected.

#### Scenario: Hovering a data field shows a solid outline
- **WHEN** the pointer moves over an unselected text field on the canvas
- **THEN** a solid light-blue outline (~2px) appears around the element

#### Scenario: Hovering a row container shows a dashed outline
- **WHEN** the pointer moves over an unselected row container
- **THEN** a dashed light-blue outline appears around the container

#### Scenario: Outline disappears on unhover
- **WHEN** the pointer leaves an unselected element
- **THEN** the outline is removed

### Requirement: Selected element keeps a persistent distinct ring
A selected element SHALL display a persistent solid `#2f6fed` ring with a faint shadow regardless of hover state, visually distinct from the lighter hover outline.

#### Scenario: Selection persists without hover
- **WHEN** an element is selected and the pointer moves elsewhere
- **THEN** the solid accent ring remains visible on the selected element

#### Scenario: Selection styling differs from hover styling
- **WHEN** comparing a hovered unselected element to a selected one
- **THEN** the selected element uses the stronger solid accent ring while the hovered element uses the lighter (or dashed) hover outline

### Requirement: Always-visible drag handle initiates handle-only dragging
Each element on the canvas SHALL show a floating grip badge overlapping its top-left corner at all times (not only on hover), with tooltip "Drag to move". Pressing the badge SHALL select the element and start the existing pointer-capture drag/reorder flow (including palette→canvas cross-drag targets). Dragging from any other part of the element SHALL NOT initiate a drag.

#### Scenario: Handle visible without hover
- **WHEN** the canvas displays elements and the pointer is elsewhere
- **THEN** every element shows its grip badge at the top-left corner

#### Scenario: Pressing the handle starts a drag and selects
- **WHEN** the user presses the grip badge and moves the pointer
- **THEN** the element becomes selected and the existing ghost/insertion-indicator drag flow starts

#### Scenario: Element body does not drag
- **WHEN** the user presses and moves on a rendered element outside the handle
- **THEN** no drag starts (the interaction is selection only)

### Requirement: Editor chrome hidden until contextually revealed
The per-element type badge SHALL NOT be shown in the default canvas rendering. While an element is hovered or selected, the canvas SHALL show its type badge as a small floating neutral tag at the element's top-right corner.

#### Scenario: No badge by default
- **WHEN** the canvas renders elements with the pointer away and nothing selected
- **THEN** no type badges are visible

#### Scenario: Badge appears on hover at top-right
- **WHEN** the pointer hovers an element
- **THEN** a floating type tag appears at that element's top-right corner

### Requirement: Empty layout columns show an empty-slot placeholder
A layout column containing no children SHALL render a slim dashed empty-slot strip (minimum height ~44px) so drops remain discoverable; the strip SHALL disappear once the column contains children. Column outlines additionally appear during container hover and drag targeting as described in the hover-border requirement.

#### Scenario: Empty column shows slot strip
- **WHEN** a row container renders a column whose children stack is empty
- **THEN** that column displays a subtle dashed strip of about 44px minimum height

#### Scenario: Filled column hides the strip
- **WHEN** a child element is added to a column showing the slot strip
- **THEN** the strip disappears and the child renders in its place

#### Scenario: Slot strip accepts drops
- **WHEN** a palette drag is released over an empty column's slot strip
- **THEN** the new element is inserted into that column as today
