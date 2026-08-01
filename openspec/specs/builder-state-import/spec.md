## ADDED Requirements

### Requirement: Canvas hydrates from a FieldMeta[] payload via importState
The `wb-canvas` component SHALL expose a public `importState(fields: FieldMeta[]): Promise<void>` method that replaces the canvas's current field list with the provided `fields` wholesale. The imported fields' `id` values SHALL be preserved as-is (no remapping). After a successful import, the canvas SHALL emit `wbChange` with the new `fields` array.

#### Scenario: Import a two-field payload
- **WHEN** `canvas.importState([{ id: 10, type: 'text', label: 'First' }, { id: 20, type: 'checkbox', label: 'Subscribe' }])` is called
- **THEN** the canvas renders two rows with labels "First" and "Subscribe", and emits `wbChange` with `detail` equal to the imported array

#### Scenario: Import replaces existing canvas contents
- **WHEN** the canvas is showing fields `[{ id: 1, type: 'text', label: 'Name' }]` and `canvas.importState([{ id: 7, type: 'text', label: 'Email' }])` is called
- **THEN** the canvas renders only the "Email" row (id 7) and no longer renders the "Name" row

#### Scenario: Imported ids are preserved without remapping
- **WHEN** `canvas.importState([{ id: 42, type: 'text', label: 'X' }])` is called
- **THEN** the rendered row corresponds to a field with `id` exactly `42`, and the emitted `wbChange` payload contains `{ id: 42, ... }`

#### Scenario: Importing an empty array clears the canvas
- **WHEN** the canvas is showing fields and `canvas.importState([])` is called
- **THEN** the canvas renders no rows and emits `wbChange` with `detail` equal to `[]`

### Requirement: importState resyncs the id counter to avoid collisions
After a successful `importState(fields)` call, the canvas SHALL resync its internal id counter so that the next newly-added field receives an id strictly greater than every imported id AND greater than the counter's previous value. The counter SHALL be set to `max(max(imported ids), previous counter value) + 1` semantically (i.e. the next `++uid` yields a fresh, collision-free id).

#### Scenario: addField after import does not collide with imported ids
- **WHEN** `canvas.importState([{ id: 100, type: 'text', label: 'A' }])` is called and then `canvas.addField('text', 'B')` is called
- **THEN** the newly-added field has an `id` strictly greater than `100`

#### Scenario: Counter never decreases across imports
- **WHEN** `canvas.addField('text', 'Z')` yields id `5`, then `canvas.importState([{ id: 3, type: 'text', label: 'X' }])` is called, then `canvas.addField('text', 'Y')` is called
- **THEN** the new field's `id` is strictly greater than `5` (the counter did not regress to `3`)

### Requirement: importState resets selection and emits wbFieldDeselected
When `importState` is called and a field is currently selected, the canvas SHALL set its selection to none and emit `wbFieldDeselected`. If no field is selected, the canvas SHALL NOT emit `wbFieldDeselected`.

#### Scenario: Selected field is deselected on import
- **WHEN** a field is selected on the canvas and `canvas.importState([{ id: 1, type: 'text', label: 'A' }])` is called
- **THEN** the canvas emits `wbFieldDeselected` and the selection is cleared

#### Scenario: No deselect event when nothing is selected
- **WHEN** no field is selected on the canvas and `canvas.importState([{ id: 1, type: 'text', label: 'A' }])` is called
- **THEN** the canvas does not emit `wbFieldDeselected`

### Requirement: importState guards against malformed input
`importState` SHALL perform a lightweight structural check: the argument must be an array, and every entry must have a numeric `id`, a string `type`, and a string `label`. On invalid input, `importState` SHALL be a no-op (the canvas state is unchanged) and SHALL NOT emit `wbChange`.

#### Scenario: Non-array input is a no-op
- **WHEN** `canvas.importState({ not: 'an array' })` is called on a canvas showing one field
- **THEN** the canvas still shows the one field and no `wbChange` event is emitted

#### Scenario: Entry missing id is a no-op
- **WHEN** `canvas.importState([{ type: 'text', label: 'A' }])` is called
- **THEN** the canvas state is unchanged and no `wbChange` event is emitted

#### Scenario: Entry with non-numeric id is a no-op
- **WHEN** `canvas.importState([{ id: 'x', type: 'text', label: 'A' }])` is called
- **THEN** the canvas state is unchanged and no `wbChange` event is emitted
