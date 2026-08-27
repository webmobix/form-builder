## REMOVED Requirements

### Requirement: Canvas represents rich text fields as summary chips
**Reason**: Superseded by the realistic canvas preview — the canvas no longer renders any element as a summary chip, richtext included.
**Migration**: The canvas now renders `richtext` fields as live read-only Tiptap previews per "Canvas renders rich text fields as read-only live previews" (below).

## ADDED Requirements

### Requirement: Canvas renders rich text fields as read-only live previews
The canvas SHALL render `type: 'richtext'` fields as real read-only Tiptap instances matching the live form rendering, including the placeholder hint when the content is empty. The toolbar and link bar SHALL be hidden and the editor SHALL NOT be editable. Selection and drag/reorder SHALL operate on the element wrapper exactly as for other data fields.

#### Scenario: Empty richtext shows its placeholder hint
- **WHEN** the canvas renders an empty richtext field that has a placeholder configured
- **THEN** the read-only editor displays the placeholder hint as the live form does

#### Scenario: Editor is not editable on the canvas
- **WHEN** the user attempts to type or use formatting in a canvas-rendered richtext field
- **THEN** the editor does not enter edit mode and no toolbar or link bar is visible

#### Scenario: Wrapper-level select and drag behave like other fields
- **WHEN** the user clicks the grip badge of a richtext element
- **THEN** selection and drag/reorder proceed identically to other data fields
