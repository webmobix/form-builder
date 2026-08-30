## ADDED Requirements

### Requirement: Canvas elements expose a remove overlay button
Every element rendered on the canvas (data fields, headings, paragraphs, row containers, and nested children inside row container columns) SHALL render a remove overlay button ("×") positioned top-right within the element chrome, adjacent to the type tag. Activating the remove button SHALL delete that element only (no subtree sibling effects), SHALL NOT trigger element selection, and SHALL NOT start a drag.

#### Scenario: Every element kind shows the remove button
- **WHEN** the canvas renders a data field, a heading, a paragraph, a row container, and a nested child
- **THEN** each rendered element contains a top-right remove button regardless of element kind or nesting depth

#### Scenario: Activation deletes the element without selecting it
- **WHEN** the user clicks the remove button of an unselected element
- **THEN** the element is removed, `wbChange` is emitted with the updated field list, and no `wbFieldSelected` event is emitted for the removed element

#### Scenario: Remove button does not start a drag
- **WHEN** the user presses the pointer on a remove button and drags
- **THEN** no reorder drag or palette-style ghost drag starts

### Requirement: Removing a row container removes its subtree
Removing a row container SHALL remove the container together with all elements in its `children` columns. Removing a nested child SHALL remove only that child from its column stack. A container whose columns become empty SHALL keep rendering its column slots.

#### Scenario: Container delete removes children
- **WHEN** the user deletes a row container with two populated columns
- **THEN** the container and every nested child are removed from the field list in the emitted `wbChange` payload

#### Scenario: Nested child delete splices only that child
- **WHEN** the user deletes a nested paragraph inside the first column of a container
- **THEN** the paragraph is removed from that column and all other elements, including siblings, remain

#### Scenario: Emptied container keeps its slots
- **WHEN** the last child of every column of a container is deleted
- **THEN** the container stays on the canvas rendering one empty slot per column

### Requirement: Deletion clears selection for removed elements
When the removed element (or any element inside a removed subtree) is currently selected, the canvas SHALL clear the selection and emit `wbFieldDeselected` before emitting removal/change notifications. When the removed element was not selected, `wbFieldDeselected` SHALL NOT be emitted.

#### Scenario: Deleting the selected element deselects
- **WHEN** an element is selected and the user deletes it via its remove button
- **THEN** the canvas emits `wbFieldDeselected` and the inspector clears

#### Scenario: Deleting a selected element's container deselects
- **WHEN** a nested child is selected and the user deletes its parent row container
- **THEN** the canvas emits `wbFieldDeselected` because the selected element was inside the removed subtree

#### Scenario: No deselect when deleting an unselected element
- **WHEN** element A is selected and the user deletes a different element B
- **THEN** `wbFieldDeselected` is not emitted and A remains selected

### Requirement: Canvas emits wbFieldRemoved on deletion
The canvas SHALL emit `wbFieldRemoved: CustomEvent<{ id: number }>` with the id of the top-level or nested element that was removed, after any deselection and together with (or before) the `wbChange` emission, for every deletion regardless of entry point.

#### Scenario: Removing a nested child reports the child id
- **WHEN** the user deletes a nested child with id 7 inside a container
- **THEN** `wbFieldRemoved` is emitted with `detail` equal to `{ id: 7 }`

### Requirement: removeField public method
The canvas SHALL expose `removeField(id: number): Promise<void>` that removes the element with the given id anywhere in the tree (top-level or nested inside container columns) and SHALL be a no-op when no element with that id exists (no `wbChange`, no events).

#### Scenario: Removing an unknown id is a no-op
- **WHEN** `canvas.removeField(999)` is called and no element with id 998/999 exists
- **THEN** the canvas state is unchanged and no `wbChange` is emitted

#### Scenario: Removing the same id twice
- **WHEN** `canvas.removeField(5)` is called twice for an existing element with id 5
- **THEN** the second call is a no-op

### Requirement: Inspector offers a delete action for the selected element
The inspector SHALL render a Delete button for the currently selected element in both the design-element panel and the data-field panel. Activating it SHALL emit `wbInspectDelete: CustomEvent<{ id: number }>` with the selected field's id; the inspector SHALL NOT mutate canvas state directly.

#### Scenario: Delete button present on both panels
- **WHEN** the inspector shows settings for a data field or a design element
- **THEN** a Delete button is rendered in the panel

#### Scenario: Activation emits wbInspectDelete
- **WHEN** the user clicks Delete while a field with id 12 is selected
- **THEN** the inspector emits `wbInspectDelete` with `detail` equal to `{ id: 12 }` and performs no state mutation itself

### Requirement: Removed element ids are never reused
The canvas SHALL mint element ids from a monotonically increasing counter that deletion SHALL NOT decrement or reset. Deleted ids SHALL never be assigned to newly added elements within a session, and `getNextElementId()` SHALL return the next id that a subsequent insertion will use without consuming it.

#### Scenario: Deleted id is not reused after re-adding
- **WHEN** elements with ids 1, 2, 3 exist, id 2 is deleted, and a new field is added
- **THEN** the new field receives id 4, not 2

#### Scenario: getNextElementId peeks without consuming
- **WHEN** `canvas.getNextElementId()` is called twice without adding elements
- **THEN** both calls return the same value, and the next added element receives exactly that id

#### Scenario: getNextElementId accounts for nested children
- **WHEN** a container's nested child carries the highest id on the canvas
- **THEN** `getNextElementId()` returns a value greater than that child's id

### Requirement: Persisted next-id restore
`importState` SHALL accept either a plain `FieldMeta[]` (legacy behavior unchanged) or a `{ fields: FieldMeta[]; nextId?: number }` object. When `nextId` is provided, the counter SHALL be resynced so the next assigned id is at least `nextId`, regardless of imported ids. The resync SHALL walk nested children when computing imported ids.

#### Scenario: Restored counter survives a saved form with deletions
- **WHEN** a host saved a form with `nextId: 10` (elements 1, 2 deleted in the session) and later calls `canvas.importState({ fields: [{ id: 3, type: 'text', label: 'A' }], nextId: 10 })`
- **THEN** the next added element receives id 10, not 4

#### Scenario: Plain array import keeps legacy resync
- **WHEN** `canvas.importState([{ id: 100, type: 'text', label: 'A' }])` is called
- **THEN** the next added element receives an id greater than 100

#### Scenario: nextId wins over higher imported ids
- **WHEN** `canvas.importState({ fields: [{ id: 50, type: 'text', label: 'A' }], nextId: 60 })` is called
- **THEN** the next added element receives id 60, not 51