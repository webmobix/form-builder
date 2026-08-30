## ADDED Requirements

### Requirement: Existing-element drops move into the targeted row column
When the user releases the pointer over a row container column while dragging an existing canvas element (a drag that did not originate from the palette), the canvas SHALL remove the element from its current location (top-level list or any container's `children`), insert it into the targeted column's stack at the position indicated by the column drop indicator, and emit `wbChange` with the updated field list. The element SHALL keep its existing `id` (no new id SHALL be assigned). After a move within the same column, the insertion position SHALL be interpreted relative to the stack after removal so the element lands where the indicator pointed. A drop that resolves to no current target SHALL leave the field list unchanged.

#### Scenario: Top-level element moves into a column
- **WHEN** the user drags a top-level text field and releases it over the second column of a 2-column row container with the column indicator between that column's first and second children
- **THEN** the text field is removed from the top-level list, inserted at the indicated index of that column's stack, keeps its original `id`, and `wbChange` is emitted with the updated field list

#### Scenario: Element moves out of a row column to the top level
- **WHEN** the user drags a child element out of a row container's column and releases it over the top-level list between two top-level elements
- **THEN** the element is removed from the column's stack, inserted into the top-level list at the indicated index, keeps its original `id`, and `wbChange` is emitted

#### Scenario: Element moves between columns of the same container
- **WHEN** the user drags a child from the first column of a row container and releases it over the second column at the column indicator
- **THEN** the child is removed from the first column's stack and inserted into the second column's stack at the indicated index with its `id` preserved

#### Scenario: Element moves within the same column
- **WHEN** the user drags the first child of a column stack downward and releases it between the second and third children of the same column
- **THEN** the child ends up at the target index of that column's stack and its `id` is unchanged

#### Scenario: Drop with no target leaves state unchanged
- **WHEN** the user releases an existing-element drag outside the top-level row list and outside any row container
- **THEN** the field list is unchanged, `wbChange` is not emitted, and drag state is cleared

#### Scenario: Moved element keeps its identity
- **WHEN** an existing element is dropped into a row container column
- **THEN** the element's `id` is identical before and after the move and consumers receive it under the same id in `wbChange`

### Requirement: Existing-element drags show the column drop indicator
While an existing-element drag is in progress and the pointer is over a row container's column area, the canvas SHALL show the same column-aware drop indicator used during palette drags (drop line at the insertion position inside the targeted column, highlighted column), and SHALL NOT show the top-level indicator. When the pointer is over the top-level list but not inside any row container, the existing top-level indicator SHALL be shown. When the pointer is outside both, no indicator SHALL be shown. If the dragged element is a row container and the pointer is over a container nested inside it, no column indicator SHALL be shown for that container.

#### Scenario: Indicator highlights the targeted column during an internal drag
- **WHEN** the pointer is over the first column of a 2-column row container while an existing top-level element is being dragged
- **THEN** the canvas shows a drop line inside that column at the position where the element would be inserted and highlights that column, and no top-level indicator is shown

#### Scenario: Top-level indicator during an internal drag outside containers
- **WHEN** the pointer is over the top-level list but not inside any row container while an existing element is being dragged
- **THEN** the canvas shows the top-level drop indicator at the top-level insertion index

#### Scenario: No indicator over the dragged container's own subtree
- **WHEN** a row container is being dragged and the pointer hovers over a row container nested inside it
- **THEN** no column drop indicator is shown for the inner container

### Requirement: Nested children are draggable
Grip pointer-down on a nested child element inside a row container column SHALL start a drag of that child (in addition to the existing select-on-press behavior), such that the child can be moved to a top-level position, into another column, or reordered within its own column. Dragging a top-level element SHALL continue to work as before.

#### Scenario: Child grips and drags out of its column
- **WHEN** the user presses the grip of a nested child in a row container column and drags to the top-level list
- **THEN** a drag starts for that child, the top-level drop indicator is shown, and on release the child is moved to the top-level list at the indicated index

#### Scenario: Child reorders within its own column
- **WHEN** the user drags a nested child within its own column stack and releases it at a different vertical position
- **THEN** the child is reordered within that column's stack with its `id` preserved

#### Scenario: Top-level drag behavior is unchanged
- **WHEN** the user drags a top-level element by its grip and releases it over the top-level list
- **THEN** the existing top-level reorder behavior applies as before this change

### Requirement: A container cannot be dropped into its own subtree
When the dragged element is a row container, dropping it into any column of a container nested within its own subtree SHALL be prevented: no move SHALL be performed for such a target and the field list SHALL remain unchanged if the pointer is released there. Other containers (not inside the dragged element's subtree) SHALL remain valid drop targets.

#### Scenario: Dropping a container onto its own descendant is rejected
- **WHEN** the user drags a row container and releases the pointer over a column of a row container nested inside that dragged container
- **THEN** the field list is unchanged, `wbChange` is not emitted, and drag state is cleared

#### Scenario: Dropping a container onto a sibling container still works
- **WHEN** the user drags a row container and releases the pointer over a column of a different row container that is not inside its subtree
- **THEN** the dragged container is moved into that column's stack with its `children` intact