## MODIFIED Requirements

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