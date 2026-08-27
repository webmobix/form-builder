## Requirements

### Requirement: Field model discriminates data and design elements
`form-core` SHALL extend `FieldMeta` with a `kind: 'data' | 'design'` discriminator (defaulting to `'data'` when absent for backward compatibility) and a `designType: 'heading' | 'paragraph' | 'row'` discriminator present whenever `kind === 'design'`. Data fields (`kind === 'data'`) SHALL keep the existing `type`/`subtype`/`restrictions`/`multiline`/`required` shape unchanged. Design-only elements SHALL NOT carry `type`, `subtype`, `restrictions`, `multiline`, `initialLines`, `maxHeight`, or `required`. The canvas, palette, renderer, and inspector SHALL import this `FieldMeta` as the single source of truth for element shape.

#### Scenario: FieldMeta carries kind and designType
- **WHEN** the field model is defined
- **THEN** `FieldMeta` exposes `kind: 'data' | 'design'` and `designType?: 'heading' | 'paragraph' | 'row'` alongside the existing data-field properties

#### Scenario: kind defaults to data when absent
- **WHEN** a previously serialized `FieldMeta` without a `kind` property is imported
- **THEN** the entry is treated as `kind === 'data'` and its existing `type`/`label`/`subtype`/`restrictions` remain valid

#### Scenario: Design elements do not carry data-field properties
- **WHEN** a `FieldMeta` has `kind === 'design'`
- **THEN** it SHALL NOT carry `type`, `subtype`, `restrictions`, `multiline`, `initialLines`, `maxHeight`, or `required`

### Requirement: Paragraph element carries a text body
A `designType === 'paragraph'` element SHALL carry its body copy in an optional `text: string` property. The `text` property SHALL be the multi-line prose rendered in the live form, edited via a textarea in the inspector, and rendered as-is in the editor canvas preview. The `label` property SHALL remain a short summary for palette/inspector use and SHALL NOT be displayed as the paragraph's canvas body when `text` is present.

#### Scenario: Paragraph element exposes text
- **WHEN** the field model is defined for a paragraph element
- **THEN** `FieldMeta` exposes `text?: string` usable by `designType === 'paragraph'` elements

#### Scenario: Canvas preview renders the text body
- **WHEN** a paragraph element with both `label` and `text` is rendered on the canvas
- **THEN** the canvas shows the paragraph's `text` prose (not its `label`), matching the live form rendering

### Requirement: Row container element carries columns and children
A `designType === 'row'` element SHALL carry a `columns: number` property (default 2, minimum 1, maximum 4) and a `children: FieldMeta[][]` property whose length SHALL equal `columns`. Each entry in `children` SHALL be the vertical stack of child elements for that column. Children MAY be any element kind, including nested row containers. When `columns` is changed, the canvas SHALL truncate or pad `children` to the new length; children in truncated columns SHALL be moved to the last remaining column (non-destructive).

#### Scenario: Row container exposes columns and children
- **WHEN** the field model is defined for a row container element
- **THEN** `FieldMeta` exposes `columns?: number` (default 2) and `children?: FieldMeta[][]` for `designType === 'row'` elements

#### Scenario: children length matches columns
- **WHEN** a row container has `columns: 3`
- **THEN** `children` is an array of length 3, each entry the vertical stack for that column

#### Scenario: Reducing columns preserves children
- **WHEN** a row container with `columns: 3` and populated children is changed to `columns: 2`
- **THEN** the children from the truncated third column are appended to the last remaining column's stack and `children` length becomes 2

#### Scenario: Increasing columns pads with empty stacks
- **WHEN** a row container with `columns: 2` is changed to `columns: 3`
- **THEN** `children` is padded with an empty array so its length becomes 3 and existing children keep their column index

### Requirement: Palette exposes design-only entries
The palette SHALL include three design-only entries alongside the existing data-field entries: "Title/Headline" (`designType: 'heading'`), "Paragraph" (`designType: 'paragraph'`), and "Row container" (`designType: 'row'`). Each entry SHALL emit `wbAddField` on click with `{ kind: 'design', designType, label }` (and no `type`/`subtype`). Each entry SHALL also support the existing desktop pointer-drag path, emitting `wbPaletteDragStart`/`wbPaletteDragMove`/`wbPaletteDragEnd` with the same design-only payload.

#### Scenario: Design-only entries appear in the palette
- **WHEN** the palette is rendered
- **THEN** it shows "Title/Headline", "Paragraph", and "Row container" buttons alongside the existing data-field buttons

#### Scenario: Clicking a design-only entry emits wbAddField
- **WHEN** the user clicks the "Title/Headline" palette entry
- **THEN** the palette emits `wbAddField` with `{ kind: 'design', designType: 'heading', label: 'Title/Headline' }` and no `type` or `subtype`

#### Scenario: Dragging a design-only entry emits the drag events
- **WHEN** the user drags the "Row container" palette entry onto the canvas
- **THEN** the palette emits `wbPaletteDragStart`, `wbPaletteDragMove`, and `wbPaletteDragEnd` with a `{ kind: 'design', designType: 'row', label: 'Row container' }` payload

### Requirement: Canvas renders design-only rows
The canvas SHALL render a design-only element as a realistic preview of how `wb-form-renderer` renders it: a heading element SHALL render its `label` as an `<h2>`-equivalent styled heading; a paragraph element SHALL render its `text` body (`label` when `text` is absent) using the renderer's paragraph typography; a row container SHALL render a flex row with one equal-width column per `columns` entry, each column containing the realistically rendered children for that column. Design-only elements SHALL remain selectable like data elements and SHALL emit `wbFieldSelected` with the full element (including `children` for row containers).

#### Scenario: Heading renders as a styled heading
- **WHEN** the canvas renders a `designType: 'heading'` element
- **THEN** the element's label renders as an `<h2>`-equivalent heading matching the live form

#### Scenario: Paragraph renders its text body
- **WHEN** the canvas renders a `designType: 'paragraph'` element carrying `text`
- **THEN** the full `text` prose renders as paragraph copy, matching the live form rather than a truncated chip preview

#### Scenario: Row container renders real columns with rendered children
- **WHEN** the canvas renders a `designType: 'row'` element with `columns: 2` and children
- **THEN** a flex row shows one equal-width column per entry, each column containing its children rendered as realistic previews

#### Scenario: Selecting a design-only row emits wbFieldSelected
- **WHEN** the user clicks a design-only element
- **THEN** the canvas emits `wbFieldSelected` with the full element including `children` when the element is a row container

### Requirement: Column-aware drop indicator during palette drag over a row container
While a palette drag is in progress and the pointer is over a row container's column area, the canvas SHALL display a drop indicator identifying which column the dragged element will land in and at which vertical position within that column's stack. The indicator SHALL appear inside the targeted column. When the pointer is over the top-level canvas row list (not inside a row container), the existing top-level `hoverIndex` indicator SHALL be shown. When the pointer is outside both the row list and any row container, no indicator SHALL be shown.

#### Scenario: Indicator highlights the targeted column
- **WHEN** the pointer is over the second column of a 2-column row container during a palette drag
- **THEN** the canvas shows a drop indicator inside that second column at the vertical position where the new element would be inserted

#### Scenario: Top-level indicator remains when not over a container
- **WHEN** the pointer is over the top-level canvas row list but not inside any row container during a palette drag
- **THEN** the canvas shows the existing top-level drop indicator at the insertion index

#### Scenario: No indicator when pointer is off the canvas
- **WHEN** the pointer is outside the canvas row list and outside any row container during a palette drag
- **THEN** no drop indicator is shown and no insertion target is committed

### Requirement: Palette drop inserts into the targeted column
When the user releases the pointer over a row container column during a palette drag, the canvas SHALL insert the new element into that column's vertical stack at the position indicated by the column drop indicator, SHALL emit `wbChange` with the updated field list (including the updated `children` of the container), SHALL make the newly inserted element the selected element, and SHALL emit `wbFieldSelected` for it. When the pointer is released over the top-level row list, the existing top-level insertion path SHALL be used. When no drop target is current, no element SHALL be added.

#### Scenario: Drop into a column inserts the element
- **WHEN** the user releases the pointer over the first column of a 2-column row container with the column indicator at index 1 while dragging the "Paragraph" entry
- **THEN** a new element `{ kind: 'design', designType: 'paragraph', label: 'Paragraph' }` is inserted at index 1 of that column's stack and `wbChange` is emitted with the updated field list

#### Scenario: Dropped element becomes selected
- **WHEN** a palette drag is dropped into a row container column and a new element is inserted
- **THEN** the canvas sets the newly inserted element as the selected element and emits `wbFieldSelected` with it

#### Scenario: Drop outside any target cancels
- **WHEN** the user releases the pointer outside the canvas row list and outside any row container
- **THEN** no element is added and `wbChange` is not emitted for an insert

#### Scenario: New element receives a stable unique id
- **WHEN** an element is inserted into a row container column via a palette drag drop
- **THEN** the new element is assigned a unique id from the same id source as top-level insertions, preserving the canvas's stable-key discipline

### Requirement: Click-to-add inserts design-only elements
The existing click-to-add path SHALL insert a design-only element via `addFieldAfter` (or `addField` append) when a design-only palette entry is clicked, carrying `kind`, `designType`, and `label` (and no `type`/`subtype`). When a row container is the currently selected element, click-to-add SHALL append the new element to the container's first column (non-destructive), keeping the top-level append/insert-after-selected semantics for non-container selections.

#### Scenario: Click appends a heading when nothing is selected
- **WHEN** the user clicks the "Title/Headline" palette entry while no canvas element is selected
- **THEN** a new heading element is appended to the end of the canvas field list via `wbAddField` → `addFieldAfter`

#### Scenario: Click inserts after a selected data field
- **WHEN** the user clicks the "Paragraph" palette entry while a data field is selected
- **THEN** a new paragraph element is inserted immediately after the selected element

#### Scenario: Click adds into a selected row container's first column
- **WHEN** the user clicks the "Text input" palette entry while a row container is the selected element
- **THEN** a new text field is appended to the container's first column's stack and `wbChange` is emitted with the updated `children`

### Requirement: Canvas stable-key discipline extends to nested children
Nested children inside row containers SHALL keep the existing `key={f.id}` discipline so pointer-captured drag DOM is not destroyed mid-drag. Child element ids SHALL be unique across the entire canvas (top-level and all containers), drawn from the same id source.

#### Scenario: Child ids are globally unique
- **WHEN** a row container holds children in its columns
- **THEN** every child's `id` is unique across the whole canvas field list (no collision with top-level fields or other containers' children)

#### Scenario: Keyed children survive re-renders
- **WHEN** the canvas re-renders after a palette drop into a column
- **THEN** existing child DOM nodes are reused (keyed by `id`) rather than recreated
