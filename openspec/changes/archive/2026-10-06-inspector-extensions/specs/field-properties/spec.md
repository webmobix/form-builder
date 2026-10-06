# Spec Delta

## ADDED Requirements

### Requirement: FieldMeta carries host-owned metadata
`form-core` SHALL define an optional `metadata?: Record<string, unknown>` property on `FieldMeta`, holding extension-owned per-element values keyed by each extension entry's `key`. `metadata` SHALL apply to both data fields (`kind` absent or `'data'`) and design-only elements (`kind === 'design'`). It SHALL be optional and omitted for elements with no extension values. It is presentation-only and SHALL NOT participate in validation or form rendering.

#### Scenario: FieldMeta accepts metadata
- **WHEN** a `FieldMeta` is constructed with `{ id: 1, type: 'text', label: 'Email', metadata: { pii: true } }`
- **THEN** it is type-valid and carries the `metadata` map

#### Scenario: metadata is optional
- **WHEN** a `FieldMeta` is constructed without a `metadata` property
- **THEN** the element is valid and carries no extension values

#### Scenario: metadata applies to data and design elements
- **WHEN** a data field and a design-only element each carry `metadata`
- **THEN** both are valid and each carries its own independent metadata map

#### Scenario: metadata does not affect validation or rendering
- **WHEN** an element with metadata is validated or rendered
- **THEN** the metadata does not change validity, the submitted value, or the rendered output
