## MODIFIED Requirements

### Requirement: Paragraph element carries a text body
A `designType === 'paragraph'` element SHALL carry its body copy in an optional `text: string` property. The `text` property SHALL be the multi-line prose rendered in the live form, edited via a textarea in the inspector, and rendered as-is in the editor canvas preview. The `label` property SHALL remain a short summary for palette/inspector use and SHALL NOT be displayed as the paragraph's canvas body when `text` is present.

#### Scenario: Paragraph element exposes text
- **WHEN** the field model is defined for a paragraph element
- **THEN** `FieldMeta` exposes `text?: string` usable by `designType === 'paragraph'` elements

#### Scenario: Canvas preview renders the text body
- **WHEN** a paragraph element with both `label` and `text` is rendered on the canvas
- **THEN** the canvas shows the paragraph's `text` prose (not its `label`), matching the live form rendering

### Requirement: Canvas renders design-only rows
The canvas SHALL render a design-only element as a realistic preview of how `wb-form-renderer` renders it: a heading element SHALL render its `label` as an `<h2>`-equivalent styled heading; a paragraph element SHALL render its `text` body (`label` when `text` is absent) using the renderer's paragraph typography; a row container SHALL render a flex row with one equal-width column per `columns` entry, each column containing the realistically rendered children for that column. Design-only elements SHALL remain selectable like data elements and SHALL emit `wbFieldSelected` with the full element (including `children` for row containers).

#### Scenario: Heading renders as a styled heading
- **WHEN** the canvas renders a `designType: 'heading'` element
- **THEN** the element's label renders as an `<h2>`-equivalent heading matching the live form

#### Scenario: Paragraph renders its text body
- **WHEN** the canvas renders a `designType: 'paragraph'` element carrying `text`
- **THEN** the full `text` prose renders as paragraph copy, matching the live form rather than a truncated chip preview

#### Scenario: Row container renders real columns with rendered children
- **WHEN** the canvas renders a `designType: 'row'` element with `columns: 2` and children
- **THEN** a flex row shows one equal-width column per entry, each column containing its children rendered as realistic previews

#### Scenario: Selecting a design-only row emits wbFieldSelected
- **WHEN** the user clicks a design-only element
- **THEN** the canvas emits `wbFieldSelected` with the full element including `children` when the element is a row container
