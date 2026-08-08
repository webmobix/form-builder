## MODIFIED Requirements

### Requirement: Editable type propagated to the canvas
The inspector SHALL NOT provide a type selector. A field's `type` is fixed at creation time (by the palette entry used to add it) and cannot be changed from the inspector. The inspector SHALL show a read-only display name (see "Read-only field display name") instead of any `type` mutation control.

#### Scenario: No type selector is rendered
- **WHEN** any field is selected in the inspector
- **THEN** the inspector does not render a `<select>` for `type` and SHALL NOT emit a patch changing `type`

#### Scenario: Switching away from text is no longer an inspector action
- **WHEN** the user is editing a text field in the inspector
- **THEN** there is no control to change the field's `type` to a non-text type; switching type requires deleting and re-adding the field from the palette

### Requirement: Editable subtype for text fields
The inspector SHALL NOT provide a subtype selector. A text field's `subtype` is fixed at creation time (by the palette entry used to add it) and cannot be changed from the inspector. The inspector SHALL derive the field's display name from its fixed `type` and `subtype` (see "Read-only field display name").

#### Scenario: No subtype selector is rendered for text fields
- **WHEN** the selected field's type is `text`
- **THEN** the inspector does not render a `<select>` for `subtype` and SHALL NOT emit a patch changing `subtype`

#### Scenario: No subtype selector for non-text fields
- **WHEN** the selected field's type is not `text`
- **THEN** the inspector does not render a subtype selector (unchanged behavior, now also true because the selector no longer exists)

#### Scenario: Switching subtype is no longer an inspector action
- **WHEN** the user is editing a text field in the inspector
- **THEN** there is no control to change the field's `subtype`; switching subtype requires deleting and re-adding the field from the palette

### Requirement: Read-only field display name in the inspector
The inspector SHALL render a read-only "Field" display line showing a friendly name derived from the selected field's `type` and `subtype`. The mapping SHALL be: `text`+`text` (or unset) → "Text input", `text`+`email` → "Email", `text`+`url` → "URL", `text`+`number` → "Number", `text`+`password` → "Password", `text`+`tel` → "Telephone", `select` → "Dropdown", `date` → "Date", `checkbox` → "Checkbox". The display SHALL NOT be an interactive control and SHALL NOT emit a patch.

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
- **WHEN** the selected field has `type: 'text'` and `subtype` is `'text'` or unset
- **THEN** the inspector's read-only "Field" display shows "Text input"

#### Scenario: Dropdown field shows "Dropdown"
- **WHEN** the selected field has `type: 'select'`
- **THEN** the inspector's read-only "Field" display shows "Dropdown"

#### Scenario: Display name is not editable
- **WHEN** the user interacts with the "Field" display line
- **THEN** no control emits a patch and the field's `type`/`subtype` are unchanged

### Requirement: Type and subtype-specific restrictions
The inspector SHALL render restriction inputs conditionally based on the field's fixed `type` and `subtype`. For `subtype === 'number'`, the inspector SHALL provide `min`, `max`, and `step` numeric inputs. For text-like subtypes (`text`, `email`, `url`, `password`, `tel`, or unset), the inspector SHALL provide a `maxLength` numeric input. Restrictions SHALL be stored on the field and propagated to the canvas. The restriction inputs SHALL remain editable; only the type/subtype selectors were removed.

#### Scenario: Number restriction inputs appear for number subtype
- **WHEN** the selected field's type is `text` and subtype is `number`
- **THEN** the inspector renders `min`, `max`, and `step` numeric inputs showing the field's current number restrictions (empty when unset)

#### Scenario: maxLength input appears for text-like subtypes
- **WHEN** the selected field's type is `text` and subtype is one of `text` (or unset), `email`, `url`, `password`, or `tel`
- **THEN** the inspector renders a `maxLength` numeric input showing the field's current text restriction (empty when unset)

#### Scenario: Restriction inputs hidden for non-text types
- **WHEN** the selected field's type is `select`, `date`, or `checkbox`
- **THEN** the inspector does not render number or text restriction inputs

#### Scenario: Editing a restriction updates the field
- **WHEN** the user edits a restriction input
- **THEN** the inspector emits an update with the field `id` and the changed restriction, and the canvas stores it under the matching restriction key

### Requirement: Inspector provides a multiline toggle for plain-text fields
The inspector SHALL render a "Multiline" checkbox toggle only for fields whose `type` is `text` and whose `subtype` is `text` (or unset, defaulting to `text`). The toggle SHALL NOT be shown for `text` subtypes other than `text` (number, email, url, password, tel). Toggling it SHALL emit a `wbFieldUpdated` event with `{ multiline: true }` or `{ multiline: false }` in the patch. (Unchanged behavior; preserved since subtype is now fixed at creation, not mutated by the inspector.)

#### Scenario: Multiline toggle appears for plain-text fields
- **WHEN** the selected field's `type` is `text` and `subtype` is `text` (or unset)
- **THEN** the inspector renders a "Multiline" checkbox showing the field's current `multiline` state (unchecked when unset)

#### Scenario: Multiline toggle hidden for email/url/password/number subtypes
- **WHEN** the selected field's `type` is `text` and `subtype` is one of `number`, `email`, `url`, `password`, or `tel`
- **THEN** the inspector does not render a "Multiline" toggle

#### Scenario: Toggling multiline emits an update
- **WHEN** the user checks or unchecks the "Multiline" toggle
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ multiline: true }` or `{ multiline: false }`

### Requirement: Field model carries subtype and restrictions
`form-core` SHALL define an extended `FieldMeta` that includes optional `subtype`, `restrictions`, `multiline`, `initialLines`, and `maxHeight`. `subtype` SHALL apply only to fields whose type is `text`. `TextSubtype` SHALL include `'text'`, `'number'`, `'email'`, `'tel'`, `'url'`, and `'password'`. `restrictions` SHALL be keyed by subtype (`number` → `{ min?, max?, step? }`, `text` → `{ maxLength? }`); text-like subtypes (`text`, `email`, `url`, `password`, `tel`) share the `text` restrictions key. `multiline`, `initialLines`, and `maxHeight` SHALL apply only to fields whose `type` is `text` and `subtype` is `text`; they are presentation-only and SHALL NOT participate in value validation. `wb-canvas` and `wb-inspector` SHALL import this `FieldMeta` as the single source of truth for field shape.

#### Scenario: FieldMeta includes subtype and restrictions
- **WHEN** the field model is defined
- **THEN** `FieldMeta` exposes `subtype?: FieldSubtype` and `restrictions?: Restrictions` alongside `id`, `type`, and `label`

#### Scenario: TextSubtype includes url and password
- **WHEN** the field model is defined
- **THEN** `TextSubtype` is `'text' | 'number' | 'email' | 'tel' | 'url' | 'password'`

#### Scenario: FieldMeta includes multiline presentation fields
- **WHEN** the field model is defined
- **THEN** `FieldMeta` also exposes `multiline?: boolean`, `initialLines?: number`, and `maxHeight?: number` as optional presentation properties

#### Scenario: Restrictions map to JSON Schema keywords
- **WHEN** a field carries number restrictions `{ min, max, step }` or text restrictions `{ maxLength }`
- **THEN** the model is shaped so those values map to JSON Schema `minimum`/`maximum`/`multipleOf` and `maxLength` respectively

#### Scenario: Multiline presentation fields do not affect validation
- **WHEN** a field has `multiline: true`, `initialLines: 5`, and `maxHeight: 200`
- **THEN** those values are used only for rendering and SHALL NOT be passed to `ElementInternals.setValidity` or alter the field's submitted value