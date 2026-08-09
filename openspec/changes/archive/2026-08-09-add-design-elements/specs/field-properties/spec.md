## ADDED Requirements

### Requirement: Inspector renders a reduced property set for design-only elements
When the selected canvas element has `kind === 'design'`, the inspector SHALL render only the properties applicable to that element's `designType` and SHALL hide all data-field-only controls (Required, restrictions, multiline, initialLines, maxHeight). The inspector SHALL continue to render the editable Label input for all design-only element types so the canvas row title can be edited.

#### Scenario: Heading element shows label only
- **WHEN** the selected element has `kind === 'design'` and `designType === 'heading'`
- **THEN** the inspector renders the Label input and no Required checkbox, no restrictions, no multiline toggle, and no initialLines/maxHeight inputs

#### Scenario: Paragraph element shows label and text body
- **WHEN** the selected element has `kind === 'design'` and `designType === 'paragraph'`
- **THEN** the inspector renders the Label input and a multi-line `text` textarea bound to the element's `text` property, and no data-field-only controls

#### Scenario: Row container element shows label and columns
- **WHEN** the selected element has `kind === 'design'` and `designType === 'row'`
- **THEN** the inspector renders the Label input and a `columns` numeric input (min 1, max 4) bound to the element's `columns` property, and no data-field-only controls

#### Scenario: Data-field-only controls are hidden for design-only elements
- **WHEN** any design-only element is selected
- **THEN** the inspector does not render the Required checkbox, the restriction inputs, the Multiline toggle, or the initialLines/maxHeight inputs

### Requirement: Inspector edits the paragraph text body
For a `designType === 'paragraph'` element, the inspector SHALL provide a multi-line `text` textarea bound to the element's `text` property. Editing the textarea SHALL emit a `wbFieldUpdated` event with the field `id` and a patch containing `{ text: <value> }`.

#### Scenario: Editing the paragraph body emits an update
- **WHEN** the user edits the `text` textarea for a paragraph element
- **THEN** the inspector emits `wbFieldUpdated` with the element's `id` and a patch containing `{ text: <new value> }`

#### Scenario: Paragraph body update propagates to the canvas and renderer
- **WHEN** the inspector emits a `text` patch and the host applies it via the canvas update method
- **THEN** the canvas row's underlying element and the rendered form's `<p>` reflect the new `text` value

### Requirement: Inspector edits the row container column count
For a `designType === 'row'` element, the inspector SHALL provide a `columns` numeric input (min 1, max 4) bound to the element's `columns` property. Changing the input SHALL emit a `wbFieldUpdated` event with the field `id` and a patch containing `{ columns: <n> }`. The canvas SHALL truncate or pad `children` to the new column count, moving children from truncated columns to the last remaining column (non-destructive) and padding with empty arrays when increasing the count.

#### Scenario: Editing columns emits an update
- **WHEN** the user changes the `columns` input from 2 to 3
- **THEN** the inspector emits `wbFieldUpdated` with the element's `id` and a patch containing `{ columns: 3 }`

#### Scenario: Columns input enforces min and max
- **WHEN** the user attempts to set `columns` below 1 or above 4
- **THEN** the input clamps (or rejects) the value to the 1–4 range and the emitted patch stays within range

#### Scenario: Reducing columns preserves children
- **WHEN** the inspector emits a patch reducing `columns` from 3 to 2 on a populated row container
- **THEN** the canvas moves children from the truncated third column into the last remaining column and `children` length becomes 2

### Requirement: Inspector read-only display name for design-only elements
The inspector SHALL render a read-only "Element" display line for design-only elements showing a friendly name derived from `designType`: `heading` → "Title/Headline", `paragraph` → "Paragraph", `row` → "Row container". The display SHALL NOT be an interactive control and SHALL NOT emit a patch.

#### Scenario: Heading element shows "Title/Headline"
- **WHEN** the selected element has `designType === 'heading'`
- **THEN** the inspector's read-only "Element" display shows "Title/Headline"

#### Scenario: Paragraph element shows "Paragraph"
- **WHEN** the selected element has `designType === 'paragraph'`
- **THEN** the inspector's read-only "Element" display shows "Paragraph"

#### Scenario: Row container element shows "Row container"
- **WHEN** the selected element has `designType === 'row'`
- **THEN** the inspector's read-only "Element" display shows "Row container"

#### Scenario: Element display is not editable
- **WHEN** the user interacts with the "Element" display line
- **THEN** no control emits a patch and the element's `designType` is unchanged

## MODIFIED Requirements

### Requirement: Inspector panel reflects the selected canvas field
The system SHALL provide a right-hand inspector panel (`wb-inspector`) that renders the editable properties of the element currently selected on the canvas. When no canvas element is selected, the inspector SHALL render an empty/placeholder state and SHALL NOT edit any element. When a data field is selected, the inspector SHALL render its current label, type, subtype, and restrictions. When a design-only element is selected, the inspector SHALL render the reduced, element-type-specific property set described in "Inspector renders a reduced property set for design-only elements".

#### Scenario: Selecting a canvas row loads its data into the inspector
- **WHEN** a canvas row is clicked and the canvas emits `wbFieldSelected` with that element
- **THEN** the host passes the element to `wb-inspector` and the inspector renders that element's current properties (data-field properties for `kind === 'data'`, reduced design-only properties for `kind === 'design'`)

#### Scenario: No selection shows empty state
- **WHEN** no canvas element is selected
- **THEN** the inspector renders a placeholder (e.g. "Select a field to edit its settings") and exposes no editable inputs that could mutate an element

#### Scenario: Selecting a different row switches the inspector
- **WHEN** the user selects a different canvas row while one is already loaded
- **THEN** the inspector replaces its contents with the newly selected element's properties without merging stale values from the previous element

### Requirement: Inspector provides a required toggle
The inspector SHALL render a "Required" checkbox toggle for data fields (`kind === 'data'`). Toggling it SHALL emit a `wbFieldUpdated` event with `{ required: true }` or `{ required: false }` in the patch. The "Required" toggle SHALL NOT be rendered for design-only elements (`kind === 'design'`).

#### Scenario: Required checkbox appears for data fields
- **WHEN** a data field is selected in the inspector
- **THEN** the inspector renders a "Required" checkbox showing the field's current `required` state (unchecked when unset)

#### Scenario: Required checkbox hidden for design-only elements
- **WHEN** a design-only element is selected in the inspector
- **THEN** the inspector does not render a "Required" checkbox

#### Scenario: Toggling required emits an update
- **WHEN** the user checks or unchecks the "Required" checkbox on a data field
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ required: true }` or `{ required: false }`