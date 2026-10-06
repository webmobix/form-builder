# Spec Delta

## Purpose

Lets a host declare additional inspector controls per element kind and store their values on each element, without modifying the `wb-inspector` component.

## ADDED Requirements

### Requirement: Inspector accepts a host-supplied extension shape
`wb-inspector` SHALL expose an `extension` property and a `setExtension(shape)` method accepting an `InspectorExtension`. The shape SHALL map element kinds to ordered sections: `{ data?: InspectorExtensionSection[]; design?: InspectorExtensionSection[] }`. Each section SHALL have an optional `title` and a `fields` array. The inspector SHALL render the host-supplied shape and SHALL NOT mutate it.

#### Scenario: Setting the shape via the method
- **WHEN** the host calls `setExtension({ data: [...], design: [...] })` on `wb-inspector`
- **THEN** the inspector stores the shape and renders the sections for the selected element's kind

#### Scenario: Setting the shape via the property
- **WHEN** the host assigns `inspector.extension = { data: [...] }`
- **THEN** the inspector renders the `data` sections for a selected data element

#### Scenario: No shape supplied
- **WHEN** the host supplies no `extension` (or an empty shape)
- **THEN** the inspector renders no extension sections and does not mutate any element's metadata

### Requirement: Extension sections are selected by element kind
The inspector SHALL render the sections under the selected element's kind key: `data` when the element's `kind` is absent or `'data'`, and `design` when `kind === 'design'`. Sections for the other kind SHALL NOT be rendered. When no element is selected, no extension sections SHALL be rendered.

#### Scenario: Data element renders data sections only
- **WHEN** a data element is selected and the shape has both `data` and `design` sections
- **THEN** the inspector renders only the `data` sections

#### Scenario: Design element renders design sections only
- **WHEN** a design-only element is selected and the shape has both `data` and `design` sections
- **THEN** the inspector renders only the `design` sections

#### Scenario: No selection renders no sections
- **WHEN** no element is selected
- **THEN** the inspector renders no extension sections

### Requirement: Extension entry types are discriminated and extensible
Each entry SHALL carry a `type` discriminator. The only supported `type` SHALL be `'checkbox'`. The entry union SHALL be structured so additional entry types can be added later without changing the section or shape structure. An entry with an unrecognized `type` SHALL be ignored rather than causing an error.

#### Scenario: Checkbox entry is recognized
- **WHEN** a section declares an entry with `type: 'checkbox'`
- **THEN** the inspector renders it as a checkbox control

#### Scenario: Unknown entry type is ignored
- **WHEN** a section declares an entry with a `type` the inspector does not support
- **THEN** the inspector ignores that entry and continues rendering the supported entries

### Requirement: Checkbox entry declares key, label, and default state
A checkbox entry SHALL declare a required `key` (string), a required `label` (string), and an optional `defaultState` (boolean). The `key` SHALL be the metadata key used to store the entry's value. An absent `defaultState` SHALL mean unchecked (`false`). `key` SHALL be unique among the entries declared for the same element kind.

#### Scenario: Checkbox entry carries key and label
- **WHEN** a checkbox entry is declared with `{ type: 'checkbox', key: 'pii', label: 'Contains PII' }`
- **THEN** the inspector renders a checkbox labelled "Contains PII" and stores its value under `metadata.pii`

#### Scenario: Absent defaultState means unchecked
- **WHEN** a checkbox entry omits `defaultState` and the element has no value for its `key`
- **THEN** the inspector renders the checkbox unchecked

### Requirement: Extension sections render at the end of the inspector form
When an element is selected and its kind has one or more extension sections, the inspector SHALL render those sections after all built-in property controls and before the Delete action. A section with a `title` SHALL render that title as a group heading. Every entry declared in the shape SHALL be rendered; the inspector SHALL NOT conditionally hide a declared entry.

#### Scenario: Sections render after built-in controls and before Delete
- **WHEN** a data element with configured extension sections is selected
- **THEN** the extension sections appear below the built-in controls (Label, Required, restrictions, etc.) and above the Delete button

#### Scenario: Section title is rendered
- **WHEN** a section declares a `title`
- **THEN** the inspector renders that title as the section's group heading

#### Scenario: Every declared entry is rendered
- **WHEN** a section declares multiple entries
- **THEN** the inspector renders a control for each declared entry with no conditional hiding

### Requirement: Checkbox state resolves from metadata or default state
For each rendered checkbox entry, the inspector SHALL render it checked when `metadata[key]` is `true` and unchecked when `metadata[key]` is `false`. When `metadata[key]` is `undefined`, the inspector SHALL use the entry's `defaultState`, treating an absent `defaultState` as `false`. The inspector SHALL NOT fall back to `defaultState` when a value is stored.

#### Scenario: Stored true renders checked
- **WHEN** `metadata[key]` is `true`
- **THEN** the checkbox renders checked

#### Scenario: Stored false overrides a true default
- **WHEN** `metadata[key]` is `false` and the entry's `defaultState` is `true`
- **THEN** the checkbox renders unchecked

#### Scenario: Undefined value uses the default state
- **WHEN** `metadata[key]` is `undefined` and the entry's `defaultState` is `true`
- **THEN** the checkbox renders checked

#### Scenario: Undefined value with no default renders unchecked
- **WHEN** `metadata[key]` is `undefined` and the entry omits `defaultState`
- **THEN** the checkbox renders unchecked

### Requirement: Toggling a checkbox persists the full metadata map
When the user toggles a rendered checkbox entry, the inspector SHALL emit a `wbFieldUpdated` event with the selected element's `id` and a patch `{ metadata: <map> }`, where `<map>` is the element's current metadata with the toggled entry's `key` set to the new boolean. The emitted map SHALL preserve all existing keys, including keys not declared in the current shape.

#### Scenario: Toggling emits a metadata patch
- **WHEN** the user checks a checkbox entry with `key: 'pii'`
- **THEN** the inspector emits `wbFieldUpdated` with `{ id, patch: { metadata: { ...existing, pii: true } } }`

#### Scenario: Existing keys are preserved
- **WHEN** the element already has metadata keys not declared by the current shape and the user toggles a declared entry
- **THEN** the emitted metadata map still contains those undeclared keys

#### Scenario: Canvas applies the metadata patch
- **WHEN** the host applies the inspector's metadata patch through the canvas update method
- **THEN** the canvas stores the new metadata map on the element and emits `wbChange` with the updated field list

#### Scenario: The patch replaces the metadata map
- **WHEN** the host applies a metadata patch
- **THEN** the element's metadata becomes the emitted map (a full replacement), so the inspector MUST include any keys it intends to keep

### Requirement: Missing extension keys are seeded when an element is selected
When the inspector receives an element via `setField`, for each entry declared for that element's kind whose `key` is missing from `metadata`, the inspector SHALL seed the key with the entry's `defaultState`, treating an absent `defaultState` as `false`. When at least one key was seeded, the inspector SHALL emit a single `wbFieldUpdated` carrying the element's `id` and a patch with the complete seeded map. When nothing needed seeding, it SHALL NOT emit. The same seeding SHALL apply when the shape changes while an element is selected.

#### Scenario: Selection seeds missing keys
- **WHEN** an element with no metadata is selected and its kind declares two checkbox entries
- **THEN** the inspector emits one `wbFieldUpdated` whose patch metadata contains both keys seeded from their defaults

#### Scenario: Selection with complete metadata emits nothing
- **WHEN** an element whose metadata already contains every declared key is selected
- **THEN** the inspector does not emit `wbFieldUpdated` for seeding

#### Scenario: Absent default seeds false
- **WHEN** a declared key is missing and its entry omits `defaultState`
- **THEN** the seeded value for that key is `false`

#### Scenario: Shape change seeds newly declared keys
- **WHEN** the extension shape gains a newly declared key while an element is selected
- **THEN** the inspector seeds that key on the selected element and emits one `wbFieldUpdated`

### Requirement: Extension metadata is inert outside the inspector
`FieldMeta.metadata` SHALL be presentation-only extension data. It SHALL NOT participate in validation, SHALL NOT alter the submitted form value, and SHALL be ignored by `wb-form-renderer`. Metadata SHALL survive export/import and canvas patch application, including keys not declared by the current shape.

#### Scenario: Renderer ignores metadata
- **WHEN** an element carries metadata and is rendered by `wb-form-renderer`
- **THEN** the metadata has no effect on the rendered control

#### Scenario: Validation ignores metadata
- **WHEN** the form is validated or submitted
- **THEN** metadata is not included in the submitted value and does not affect validity

#### Scenario: Round-trip preserves metadata
- **WHEN** a builder payload containing element metadata is exported and re-imported
- **THEN** each element's metadata is preserved exactly, including undeclared keys
