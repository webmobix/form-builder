## MODIFIED Requirements

### Requirement: Renderer renders a fillable form from a FieldMeta[] config
The `wb-form-renderer` component SHALL accept a `fields: FieldMeta[]` prop and render one `wb-form-field` child per entry inside a `<form>` element in its shadow DOM. For each field it SHALL forward the entry's `type`, `label`, `subtype` (including the new `url` and `password` values), `restrictions`, `multiline`, `initialLines`, `maxHeight`, and a `required` flag to the corresponding `wb-form-field` props. The renderer SHALL derive each rendered field's submission `name` as `field.<id>` using the entry's stable `id`.

#### Scenario: Empty config renders no fields
- **WHEN** `fields` is `[]` (or unset)
- **THEN** the renderer renders the surrounding `<form>` with no `wb-form-field` children

#### Scenario: One field renders one labeled input
- **WHEN** `fields` is `[{ id: 1, type: 'text', label: 'Name' }]`
- **THEN** the renderer renders exactly one `wb-form-field` with `label="Name"`, `type="text"`, and `name="field.1"`

#### Scenario: Multiple fields each get a unique name from their id
- **WHEN** `fields` is `[{ id: 1, type: 'text', label: 'A' }, { id: 2, type: 'checkbox', label: 'B' }]`
- **THEN** the renderer renders two `wb-form-field` elements with `name="field.1"` and `name="field.2"` respectively, each forwarding its own `label` and `type`

#### Scenario: subtype and restrictions are forwarded to the field
- **WHEN** `fields` contains an entry `{ id: 3, type: 'text', label: 'Age', subtype: 'number', restrictions: { number: { min: 0, max: 120 } } }`
- **THEN** the rendered `wb-form-field` has `subtype="number"` and `restrictions` equal to `{ number: { min: 0, max: 120 } }`

#### Scenario: url subtype is forwarded
- **WHEN** `fields` contains an entry `{ id: 4, type: 'text', label: 'Website', subtype: 'url' }`
- **THEN** the rendered `wb-form-field` has `subtype="url"` and renders an `<input type="url">`

#### Scenario: password subtype is forwarded
- **WHEN** `fields` contains an entry `{ id: 5, type: 'text', label: 'Secret', subtype: 'password' }`
- **THEN** the rendered `wb-form-field` has `subtype="password"` and renders an `<input type="password">`

#### Scenario: required flag is forwarded when set
- **WHEN** a field entry carries a truthy `required` flag
- **THEN** the rendered `wb-form-field` has its `required` prop set to `true`

#### Scenario: multiline presentation options are forwarded to the field
- **WHEN** `fields` contains an entry `{ id: 7, type: 'text', subtype: 'text', label: 'Notes', multiline: true, initialLines: 4, maxHeight: 200 }`
- **THEN** the rendered `wb-form-field` has `multiline={true}`, `initialLines={4}`, and `maxHeight={200}` forwarded as props

#### Scenario: omitted multiline options do not force textarea rendering
- **WHEN** `fields` contains a text field entry with no `multiline` property
- **THEN** the rendered `wb-form-field` has no `multiline` prop set (or it is falsy) and renders a single-line input