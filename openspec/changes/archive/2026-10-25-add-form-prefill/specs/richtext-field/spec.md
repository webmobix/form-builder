## ADDED Requirements

### Requirement: Rich text fields render a prefilled document

When a richtext field receives a prefilled value that is a JSON document string (the shape it submits), the editor SHALL display that document with its formatting intact and SHALL submit the same document as its JSON string under `field.<id>`. A prefilled document consisting solely of empty paragraphs SHALL be treated as empty and submit `''`.

#### Scenario: Prefilled document renders formatted content

- **WHEN** a richtext field is prefilled with the JSON string of a document containing bold text
- **THEN** the editor displays that text in bold and the placeholder hint is not shown

#### Scenario: Prefilled document round-trips through submit

- **WHEN** a richtext field prefilled with a document is submitted without edits
- **THEN** the submitted `field.<id>` value parses to the same document content that was prefilled

#### Scenario: Structurally empty prefilled document submits empty

- **WHEN** a richtext field is prefilled with a document made only of empty paragraphs
- **THEN** the editor appears empty and submitting yields `''` for that field

### Requirement: Prefilled rich text replaces content only when the value changes

Receiving a new prefill value for a richtext field SHALL replace the editor's content with the newly prefilled document. Re-rendering with an unchanged prefill value SHALL NOT reset content the user has edited, and the richtext prefill SHALL follow the renderer's unknown-key and no-clobber rules.

#### Scenario: New prefill value replaces edited content

- **WHEN** a richtext field holds user-entered content and a different prefilled document arrives for that field
- **THEN** the editor shows the newly prefilled document

#### Scenario: Unchanged prefill preserves user edits

- **WHEN** the editor holds user-entered content and the renderer re-renders with the same prefilled value
- **THEN** the editor keeps the user's content

### Requirement: Invalid prefilled rich text is ignored safely

A prefilled value for a richtext field that is not a valid JSON document string SHALL be ignored: the editor SHALL stay empty (or keep its current content), the field SHALL NOT throw, and a warning SHALL be logged.

#### Scenario: Malformed JSON leaves the editor empty

- **WHEN** a richtext field is prefilled with `"not-json"`
- **THEN** the editor remains empty, submitting yields `''`, and a warning is logged
