## MODIFIED Requirements

### Requirement: importState resyncs the id counter to avoid collisions
After a successful `importState(fieldsOrState)` call, the canvas SHALL resync its internal id counter so that the next newly-added field receives an id strictly greater than every imported id (computed by walking nested container children in addition to top-level fields) AND greater than the counter's previous value. When the argument is a `{ fields, nextId? }` object and `nextId` is provided, the counter SHALL be resynced so the next assigned id is at least `nextId` (i.e. `uid = max(uid, maxDeep(fields.ids), nextId - 1)` semantically), so ids of elements deleted before the form was saved are never reused. The plain-array form keeps the existing semantic `max(max(imported ids, nested), previous counter value) + 1`, i.e. the next `++uid` yields a fresh, collision-free id.

#### Scenario: addField after import does not collide with imported ids
- **WHEN** `canvas.importState([{ id: 100, type: 'text', label: 'A' }])` is called and then `canvas.addField('text', 'B')` is called
- **THEN** the newly-added field has an `id` strictly greater than `100`

#### Scenario: Counter never decreases across imports
- **WHEN** `canvas.addField('text', 'Z')` yields id `5`, then `canvas.importState([{ id: 3, type: 'text', label: 'X' }])` is called, then `canvas.addField('text', 'Y')` is called
- **THEN** the new field's `id` is strictly greater than `5` (the counter did not regress to `3`)

#### Scenario: Nested children are included in the resync
- **WHEN** `canvas.importState([{ id: 1, kind: 'design', designType: 'row', label: 'Row', children: [[{ id: 40, type: 'text', label: 'Nested' }], []] }])` is called and then a field is added
- **THEN** the new field's `id` is strictly greater than `40`

#### Scenario: Persisted nextId raises the counter above deleted ids
- **WHEN** a host calls `canvas.importState({ fields: [{ id: 3, type: 'text', label: 'A' }], nextId: 10 })` and then adds a field
- **THEN** the new field's `id` is exactly `10` (ids 4–9 remain unconsumed but ids ≤ 9, potentially belonging to elements deleted before saving, are never reused)