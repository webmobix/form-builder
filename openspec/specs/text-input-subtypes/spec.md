## Requirements

### Requirement: Palette exposes text-input subtypes as first-class entries
The `wb-palette` component SHALL render, alongside the existing "Text input" entry, separate palette entries for "Email", "URL", "Number", and "Password". Each entry SHALL correspond to a `text` field (i.e. `type === 'text'`) with a specific `subtype`: Email → `email`, URL → `url`, Number → `number`, Password → `password`. The "Text input" entry SHALL continue to produce a `text` field with `subtype: 'text'` (or no `subtype`, defaulting to `text`).

#### Scenario: Palette lists the text-input subtype entries
- **WHEN** the palette renders
- **THEN** it shows distinct entries labeled "Text input", "Email", "URL", "Number", and "Password", in addition to the existing "Dropdown", "Date", and "Checkbox"

#### Scenario: Email palette entry emits a text field with email subtype
- **WHEN** a user clicks the "Email" palette entry
- **THEN** `wbAddField` is emitted with `{ type: 'text', subtype: 'email', label: 'Email' }`

#### Scenario: URL palette entry emits a text field with url subtype
- **WHEN** a user clicks the "URL" palette entry
- **THEN** `wbAddField` is emitted with `{ type: 'text', subtype: 'url', label: 'URL' }`

#### Scenario: Number palette entry emits a text field with number subtype
- **WHEN** a user clicks the "Number" palette entry
- **THEN** `wbAddField` is emitted with `{ type: 'text', subtype: 'number', label: 'Number' }`

#### Scenario: Password palette entry emits a text field with password subtype
- **WHEN** a user clicks the "Password" palette entry
- **THEN** `wbAddField` is emitted with `{ type: 'text', subtype: 'password', label: 'Password' }`

#### Scenario: Text input palette entry emits a text field with text subtype
- **WHEN** a user clicks the "Text input" palette entry
- **THEN** `wbAddField` is emitted with `{ type: 'text', subtype: 'text', label: 'Text input' }`

#### Scenario: Non-text palette entries carry no subtype
- **WHEN** a user clicks the "Dropdown", "Date", or "Checkbox" palette entry
- **THEN** `wbAddField` is emitted with `{ type: <that type>, label: <that label> }` and no `subtype` property

### Requirement: Palette carries subtype in drag-end payload
When the user drags a palette entry onto the canvas and releases over the canvas row list, the palette SHALL emit `wbPaletteDragEnd` carrying the dragged entry's `{ type, subtype?, label }`, where `subtype` is present for the text-input subtype entries (Email/URL/Number/Password/Text input) and absent for the non-text entries.

#### Scenario: Dragging the Email entry carries email subtype
- **WHEN** the user drags the "Email" palette entry and releases it over the canvas
- **THEN** `wbPaletteDragEnd` is emitted with `{ type: 'text', subtype: 'email', label: 'Email' }`

#### Scenario: Dragging the Dropdown entry carries no subtype
- **WHEN** the user drags the "Dropdown" palette entry and releases it over the canvas
- **THEN** `wbPaletteDragEnd` is emitted with `{ type: 'select', label: 'Dropdown' }` and no `subtype`

### Requirement: Canvas persists the subtype from palette events
The `wb-canvas` component SHALL accept an optional `subtype` argument in its `addField`, `addFieldAfter`, and `commitExternalInsert` methods and SHALL store it on the newly created `FieldMeta.subtype`. When `subtype` is omitted, the created field SHALL have no `subtype` property (defaulting to `text` at render/validation time as today).

#### Scenario: addFieldAfter persists subtype for email
- **WHEN** the host calls `canvas.addFieldAfter('text', 'Email', 'email')`
- **THEN** a new field is inserted after the selected component (or appended) with `{ type: 'text', subtype: 'email', label: 'Email' }` and a fresh unique `id`

#### Scenario: addField without subtype creates a default text field
- **WHEN** the host calls `canvas.addField('text', 'Name')` with no third argument
- **THEN** the created field has `{ type: 'text', label: 'Name' }` and no `subtype` property

#### Scenario: commitExternalInsert persists subtype from a palette drop
- **WHEN** the host calls `canvas.commitExternalInsert('text', 'Password', 'password')` at the current hover index
- **THEN** the inserted field has `{ type: 'text', subtype: 'password', label: 'Password' }`

### Requirement: TextSubtype includes url and password
`form-core` SHALL extend `TextSubtype` to include `'url'` and `'password'` in addition to the existing `'text'`, `'number'`, `'email'`, and `'tel'`. `FieldSubtype` SHALL remain `TextSubtype` (the only subtype union today).

#### Scenario: FieldMeta accepts subtype url
- **WHEN** a `FieldMeta` is constructed with `{ type: 'text', subtype: 'url', label: 'Website' }`
- **THEN** it is type-valid and the renderer/inspector treat `subtype` as `'url'`

#### Scenario: FieldMeta accepts subtype password
- **WHEN** a `FieldMeta` is constructed with `{ type: 'text', subtype: 'password', label: 'Secret' }`
- **THEN** it is type-valid and the renderer/inspector treat `subtype` as `'password'`
