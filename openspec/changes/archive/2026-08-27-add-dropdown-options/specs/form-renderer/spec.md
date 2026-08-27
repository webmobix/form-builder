## ADDED Requirements

### Requirement: Renderer forwards dropdown options to the field
When rendering a data field whose `type` is `select`, the `wb-form-renderer` SHALL forward the entry's `options` to the rendered `wb-form-field` so the fillable form renders a real dropdown with the configured choices.

#### Scenario: Select entry options are forwarded
- **WHEN** `fields` contains a data entry `{ id: 6, kind: 'data', type: 'select', label: 'Country', options: [{ key: 'us', label: 'US' }, { key: 'ca', label: 'CA' }, { key: 'mx', label: 'MX' }] }`
- **THEN** the rendered `wb-form-field` receives `options` `[{ key: 'us', label: 'US' }, { key: 'ca', label: 'CA' }, { key: 'mx', label: 'MX' }]`

#### Scenario: Select entry without options renders an empty dropdown
- **WHEN** a `select` data entry has no `options`
- **THEN** the rendered `wb-form-field` receives no `options` and renders an empty `<select>`
