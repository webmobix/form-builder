## Requirements

### Requirement: Text field can render as a multi-line textarea
A `text` field with `subtype === 'text'` SHALL support a `multiline` flag. When `multiline` is true, the field SHALL render a `<textarea>` element instead of an `<input>`; when false (the default), it SHALL render the existing `<input>`. Switching `multiline` SHALL NOT change the field's `type`, `subtype`, `name`, `required`, or `restrictions`, and the current value SHALL be preserved across the switch.

#### Scenario: Multiline off renders a single-line input
- **WHEN** a `wb-form-field` has `type="text"`, `subtype="text"`, and `multiline` is false or unset
- **THEN** it renders an `<input type="text">` element (the pre-change behavior)

#### Scenario: Multiline on renders a textarea
- **WHEN** a `wb-form-field` has `type="text"`, `subtype="text"`, and `multiline` is true
- **THEN** it renders a `<textarea>` element with the same `name`, `required`, and `maxLength` attributes as the equivalent input would have had

#### Scenario: Toggling multiline preserves the value
- **WHEN** the user enters "hello" into a text field and then enables `multiline` (or vice versa)
- **THEN** the rendered control still contains "hello" without the user retyping

#### Scenario: Multiline is ignored for non-plain-text subtypes
- **WHEN** a field has `type="text"` and `subtype="number"` (or `email`/`tel`) and `multiline` is true
- **THEN** the field still renders an `<input>` of the subtype's type and SHALL NOT render a `<textarea>`

### Requirement: Textarea auto-grows to fit content
A multiline textarea SHALL grow its height to fit its content using CSS `field-sizing: content`, with the `rows` attribute set from the field's `initialLines` value as the floor (the height when empty or short). When `maxHeight` is set, the textarea SHALL scroll instead of growing further once its height reaches `maxHeight` pixels.

#### Scenario: Empty textarea shows initialLines rows
- **WHEN** a multiline field has `initialLines=3` and no content
- **THEN** the rendered `<textarea>` has `rows="3"` and its visible height corresponds to three text rows

#### Scenario: Content grows the textarea up to maxHeight
- **WHEN** the user types enough content to exceed `initialLines` rows and `maxHeight` is set to 200
- **THEN** the textarea height grows to fit the content until it reaches 200px, after which it stops growing and scrolls

#### Scenario: No maxHeight allows unbounded growth
- **WHEN** `maxHeight` is unset and the user types many lines
- **THEN** the textarea grows without limit to fit all content (no scroll appears)

#### Scenario: Fallback on browsers without field-sizing support
- **WHEN** the user's browser does not support `field-sizing: content`
- **THEN** the textarea still renders with `rows={initialLines}` and behaves as a normal fixed-height scrolling textarea (no JS polyfill is loaded)

### Requirement: Field model carries multiline presentation options
`form-core` SHALL extend `FieldMeta` with optional `multiline: boolean`, `initialLines: number`, and `maxHeight: number` fields. All three SHALL be optional and SHALL default to `false`, `3`, and `undefined` respectively when a field is created without them. Existing `FieldMeta` objects that omit these fields SHALL continue to render as single-line inputs unchanged.

#### Scenario: FieldMeta exposes the new presentation fields
- **WHEN** the field model is defined
- **THEN** `FieldMeta` exposes `multiline?: boolean`, `initialLines?: number`, and `maxHeight?: number` alongside the existing `id`, `type`, `label`, `subtype`, `required`, and `restrictions`

#### Scenario: Omitting the new fields preserves legacy behavior
- **WHEN** a `FieldMeta` object has no `multiline`, `initialLines`, or `maxHeight` properties
- **THEN** the renderer treats it as a single-line input with no textarea rendering
