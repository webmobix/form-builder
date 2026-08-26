# Field Properties Specification (delta)

## MODIFIED Requirements

### Requirement: Read-only field display name in the inspector
The inspector SHALL render a read-only "Field" display line showing a friendly name derived from the selected field's `type` and `subtype`. The mapping SHALL be: `text`+`text` (or unset) → "Text input", `text`+`email` → "Email", `text`+`url` → "URL", `text`+`number` → "Number", `text`+`password` → "Password", `text`+`tel` → "Telephone", `select` → "Dropdown", `date` → "Date", `checkbox` → "Checkbox", `richtext` → "Rich text". The display SHALL NOT be an interactive control and SHALL NOT emit a patch.

#### Scenario: Email field shows "Email"
- **WHEN** the selected field has `type: 'text'` and `subtype: 'email'`
- **THEN** the inspector's read-only "Field" display shows "Email"

#### Scenario: Password field shows "Password"
- **WHEN** the selected field has `type: 'text'` and `subtype: 'password'`
- **THEN** the inspector's read-only "Field" display shows "Password"

#### Scenario: URL field shows "URL"
- **WHEN** the selected field has `type: 'text'` and `subtype: 'url'`
- **THEN** the inspector's read-only "Field" display shows "URL"

#### Scenario: Plain text field shows "Text input"
- **WHEN** the selected field's `type: 'text'` and `subtype` is `'text'` or unset
- **THEN** the inspector's read-only "Field" display shows "Text input"

#### Scenario: Dropdown field shows "Dropdown"
- **WHEN** the selected field's type is `select`
- **THEN** the inspector's read-only "Field" display shows "Dropdown"

#### Scenario: Rich text field shows "Rich text"
- **WHEN** the selected field's type is `richtext`
- **THEN** the inspector's read-only "Field" display shows "Rich text"

#### Scenario: Display name is not editable
- **WHEN** the user interacts with the "Field" display line
- **THEN** no control emits a patch and the field's `type`/`subtype` are unchanged

### Requirement: Type and subtype-specific restrictions
The inspector SHALL render restriction inputs conditionally based on the field's fixed `type` and `subtype`. For `subtype === 'number'`, the inspector SHALL provide `min`, `max`, and `step` numeric inputs. For text-like subtypes (`text`, `email`, `url`, `password`, `tel`, or unset), the inspector SHALL provide a `maxLength` numeric input. Fields whose type is `richtext` SHALL also provide a `maxLength` numeric input, stored under the shared text restrictions key. Restrictions SHALL be stored on the field and propagated to the canvas. The restriction inputs SHALL remain editable; only the type/subtype selectors were removed.

#### Scenario: Number restriction inputs appear for number subtype
- **WHEN** the selected field's type is `text` and subtype is `number`
- **THEN** the inspector renders `min`, `max`, and `step` numeric inputs showing the field's current number restrictions (empty when unset)

#### Scenario: maxLength input appears for text-like subtypes
- **WHEN** the selected field's type is `text` and subtype is one of `text` (or unset), `email`, `url`, `password`, or `tel`
- **THEN** the inspector renders a `maxLength` numeric input showing the field's current text restriction (empty when unset)

#### Scenario: maxLength input appears for rich text fields
- **WHEN** the selected field's type is `richtext`
- **THEN** the inspector renders a `maxLength` numeric input showing the field's current text restriction (empty when unset)

#### Scenario: Restriction inputs hidden for non-text types
- **WHEN** the selected field's type is `select`, `date`, or `checkbox`
- **THEN** the inspector does not render number or text restriction inputs

#### Scenario: Editing a restriction updates the field
- **WHEN** the user edits a restriction input
- **THEN** the inspector emits an update with the field `id` and the changed restriction, and the canvas stores it under the matching restriction key

#### Scenario: Blank restriction values are treated as unset
- **WHEN** the user clears a restriction input
- **THEN** the emitted update omits (or sets to undefined) that restriction, and the field treats it as not constrained

## ADDED Requirements

### Requirement: Inspector provides a placeholder input for rich text fields
When the selected field's type is `richtext`, the inspector SHALL render a "Placeholder" text input bound to the field's `placeholder` property. Editing it SHALL emit a `wbFieldUpdated` event with the field `id` and a patch containing `{ placeholder: <value> }`. Clearing the input SHALL be treated as unset (`undefined`). The Placeholder input SHALL NOT be rendered for any other field type.

#### Scenario: Placeholder input appears for rich text fields
- **WHEN** the selected field's type is `richtext`
- **THEN** the inspector renders a "Placeholder" text input showing the field's current value (empty when unset)

#### Scenario: Editing the placeholder emits an update
- **WHEN** the user changes the Placeholder input to "Tell us more"
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ placeholder: "Tell us more" }`

#### Scenario: Clearing the placeholder treats it as unset
- **WHEN** the user empties the Placeholder input
- **THEN** the emitted patch sets `placeholder` to `undefined` and the renderer displays no helper text

#### Scenario: Placeholder input hidden for other types
- **WHEN** the selected field's type is not `richtext`
- **THEN** the inspector does not render a Placeholder input
