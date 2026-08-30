## Requirements

### Requirement: Palette offers the rich text field type
The palette (`wb-palette`) SHALL include a data-field entry `{ type: 'richtext', label: 'Rich text' }` in its catalog. Activating or dragging the entry SHALL emit the same `FieldTypeDef` payload used by every other palette entry so the canvas creates a `richtext` field through the standard insertion flow.

#### Scenario: Palette lists Rich text
- **WHEN** the palette renders its field-type catalog
- **THEN** an entry labeled "Rich text" with `type: 'richtext'` is present alongside the existing field types

#### Scenario: Inserting from the palette creates a richtext field
- **WHEN** the user clicks or drags the "Rich text" palette entry into the canvas
- **THEN** the canvas appends a field with `type: 'richtext'`, a default label, a fresh numeric `id`, and no `subtype`

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

### Requirement: Field model carries the richtext type and placeholder
`form-core` SHALL extend `FieldType` with `'richtext'`. `FieldMeta` SHALL expose an optional `placeholder?: string` presentation property that applies to all fillable data field types (`text` in all subtypes, `select`, `date`, `checkbox`, and `richtext`); it is presentation-only and SHALL NOT participate in value validation. The richtext-specific placeholder rendering behavior is defined in "Placeholder rendering for rich text fields"; placeholder rendering for the other field types is defined in the `form-renderer` capability.

#### Scenario: FieldType includes richtext
- **WHEN** the field model is defined
- **THEN** `FieldType` includes `'richtext'`

#### Scenario: FieldMeta includes optional placeholder
- **WHEN** the field model is defined
- **THEN** `FieldMeta` exposes `placeholder?: string`

#### Scenario: Placeholder is valid on any data field type
- **WHEN** a `FieldMeta` is constructed with `type: 'text'`, `type: 'select'`, `type: 'date'`, `type: 'checkbox'`, or `type: 'richtext'` and a `placeholder` string
- **THEN** it is type-valid and the `placeholder` is carried as a presentation-only property (no validation or submission payload change)

### Requirement: Renderer provides a rich text editor with a fixed toolbar
`wb-form-field` SHALL render `type === 'richtext'` as a Tiptap v3 editor mounted inside its shadow root, with a fixed toolbar positioned above the editable area. The toolbar SHALL remain visible while the field is enabled and reflect active mark/node state as the caret or selection moves.

#### Scenario: Richtext field renders editor and toolbar
- **WHEN** the rendered form contains a richtext field
- **THEN** `wb-form-field` displays a fixed toolbar above a focusable editable content area, both scoped to the component's shadow root

#### Scenario: Active state follows selection
- **WHEN** the caret sits inside bold text
- **THEN** the toolbar's Bold button renders in its active state

### Requirement: Editor provides the standard formatting feature set
The richtext editor SHALL provide exactly these formatting capabilities: bold, italic, underline, strikethrough, heading level 2, heading level 3, bullet list, ordered list, blockquote, link insertion/editing with protocol validation and an inline URL input, clear formatting, undo, and redo. It SHALL NOT provide images, tables, code blocks, horizontal rules, text alignment, or color/highlight.

#### Scenario: Applying bold formats the selection
- **WHEN** the user selects text and activates the Bold toolbar action
- **THEN** the selected text renders bold and the resulting stored document records a bold mark on that text range

#### Scenario: Link insertion validates protocol
- **WHEN** the user enters `javascript:alert(1)` as a link URL via the inline URL input
- **THEN** the editor refuses to apply the link (protocol validation), while `https://` URLs apply normally

#### Scenario: Clear formatting removes marks
- **WHEN** the user selects formatted text and activates Clear Formatting
- **THEN** bold/italic/underline/strikethrough and link marks are removed from the selection without altering the text itself

#### Scenario: Undo reverts the last edit
- **WHEN** the user applies bold and then activates Undo
- **THEN** the bold formatting is removed and the document returns to its prior state

### Requirement: Rich text values serialize as JSON document strings
When a richtext field's content is non-empty, `wb-form-field` SHALL serialize the current Tiptap document with `getJSON()` and `JSON.stringify`, pushing the resulting string through `ElementInternals.setFormValue` so submissions carry it under the key `field.<id>` as a plain string. The overall `wbSubmit` payload shape (`Record<string, string>`) SHALL be unchanged.

#### Scenario: Submission carries the JSON document
- **WHEN** a filler enters "**Hello** world" in a required richtext field named `field.7` and submits
- **THEN** the `wbSubmit` detail contains `field.7` mapped to a string that parses to a Tiptap JSON document whose content encodes the bold mark and the entered text

#### Scenario: Re-editing preserves formatting losslessly
- **WHEN** a submitted JSON document string is loaded back into a richtext editor instance
- **THEN** all supported marks and nodes round-trip without loss

### Requirement: Structurally empty content submits an empty string
A richtext document consisting solely of empty paragraphs (no text nodes) SHALL be considered empty. Empty content SHALL submit `''` under `field.<id>` rather than a serialized document.

#### Scenario: Untouched field submits empty string
- **WHEN** a filler leaves a non-required richtext field untouched and submits
- **THEN** the submission maps `field.<id>` to `''`

#### Scenario: Deleting all content empties the value
- **WHEN** a filler deletes all text and structure from a populated richtext field and submits
- **THEN** the submission maps `field.<id>` to `''`

### Requirement: Required validation for rich text fields
A richtext field with `required: true` SHALL report a missing-value error through `ElementInternals.setValidity` (anchored to the editor container) when its content is empty, with the message "`<label>` is required".

#### Scenario: Required empty field reports valueMissing
- **WHEN** a required richtext field is left empty and the form is submitted
- **THEN** validity flags report the missing value, the native bubble/message names the field label, and no `wbSubmit` value for the field passes validation intent

#### Scenario: Content satisfies required
- **WHEN** a required richtext field contains any text node and the form is submitted
- **THEN** no validity error is reported for the field

### Requirement: Maximum plain-text length validation
A richtext field with `restrictions.text.maxLength` set SHALL count its content length as the concatenated text-node content of the document. Exceeding the limit SHALL NOT be prevented during typing or paste; instead the field SHALL surface a validity error "`<label>` exceeds N characters" via `ElementInternals.setValidity` on value sync and on submit, anchored to the editor container.

#### Scenario: Overflow is allowed while typing
- **WHEN** a richtext field has `maxLength` 100 and the user pastes 150 characters of plain text
- **THEN** the content remains intact and no input events are blocked

#### Scenario: Overflow reports a validity error
- **WHEN** a richtext field holds 150 plain-text characters against a `maxLength` of 100 and the value syncs or the form is submitted
- **THEN** `setValidity` reports a custom error whose message names the field label and the limit

#### Scenario: HTML markup does not count toward the limit
- **WHEN** content consists of a short sentence fully wrapped in bold across multiple paragraphs
- **THEN** the counted length equals the visible character count, excluding any markup or node overhead

### Requirement: Placeholder rendering for rich text fields
When the field defines `placeholder`, the editor SHALL display it as muted helper text while the document is empty, via the Tiptap Placeholder extension. When no `placeholder` is set, no helper text SHALL appear. The placeholder SHALL never appear once the document contains content.

#### Scenario: Placeholder shows in empty editor
- **WHEN** a richtext field has `placeholder: "Tell us more"` and empty content
- **THEN** the editable area displays "Tell us more" styled as muted helper text

#### Scenario: Placeholder disappears with content and is absent when unset
- **WHEN** the user types any character into a field with a placeholder, or views a field without `placeholder` set
- **THEN** the placeholder text is gone in the former case and never rendered in the latter

### Requirement: Disabled and reset behavior for rich text fields
On `formDisabledCallback`, the editor SHALL become non-editable and hide its toolbar while continuing to display the formatted content. On `formResetCallback`, the editor SHALL clear to an empty document and push `''` via `setFormValue`.

#### Scenario: Disabled field hides chrome but keeps content
- **WHEN** the ancestor form is disabled
- **THEN** the toolbar disappears, the editable area is not editable, and previously entered formatted content remains visible

#### Scenario: Reset clears to empty
- **WHEN** the ancestor form resets
- **THEN** the editor content returns to an empty document and the field's form value becomes `''`

### Requirement: Exported docToHtml utility renders sanitized HTML
The library SHALL export `docToHtml(jsonDoc)` which converts a stored Tiptap JSON document to an HTML string using Tiptap's `generateHTML` over the shipped schema and passes the result through DOMPurify before returning it. This SHALL be the only HTML-producing path for rich text values.

#### Scenario: Document converts to safe HTML
- **WHEN** a consumer calls `docToHtml` with a stored document containing bold text and an ordered list
- **THEN** the return value is an HTML string containing `<strong>` and `<ol>`/`<li>` markup matching the document

#### Scenario: Hostile attributes are stripped
- **WHEN** a hand-crafted document attempts to smuggle script content or event-handler attributes into the output
- **THEN** the returned HTML contains neither executable script elements nor `on*` handler attributes
