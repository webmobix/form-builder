## MODIFIED Requirements

### Requirement: Inspector provides a placeholder input for rich text fields

When a data field is selected (any `type`: `text` in all subtypes, `select`, `date`, `checkbox`, `richtext`), the inspector SHALL render a "Placeholder" text input bound to the field's `placeholder` property. Editing it SHALL emit a `wbFieldUpdated` event with the field `id` and a patch containing `{ placeholder: <value> }`. Clearing the input SHALL be treated as unset (`undefined`). The Placeholder input SHALL NOT be rendered for design-only elements — it SHALL NOT be rendered for `kind: 'design'` elements. The input SHALL be rendered for every data field type without exception.

#### Scenario: Placeholder input appears for rich text fields

- **WHEN** the selected field's type is `richtext`
- **THEN** the inspector renders a "Placeholder" text input showing the field's current value (empty when unset)

#### Scenario: Editing the placeholder emits an update

- **WHEN** the user changes the Placeholder input to "Tell us more"
- **THEN** the inspector emits `wbFieldUpdated` with the field `id` and a patch containing `{ placeholder: "Tell us more" }`

#### Scenario: Clearing the placeholder treats it as unset

- **WHEN** the user empties the Placeholder input
- **THEN** the emitted patch sets `placeholder` to `undefined` and the renderer displays no helper text

#### Scenario: Placeholder input appears for additional data field types

- **WHEN** the selected field's type is `text` (any subtype), `select`, `date`, or `checkbox`
- **THEN** the inspector renders the same "Placeholder" text input bound to the field's `placeholder` property with identical patch semantics

#### Scenario: Placeholder input hidden for design-only elements

- **WHEN** the selected element is a design-only element (`kind: 'design'`)
- **THEN** the inspector does not render a Placeholder input