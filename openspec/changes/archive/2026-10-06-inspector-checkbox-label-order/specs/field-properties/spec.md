# Spec Delta

## ADDED Requirements

### Requirement: Inspector checkbox toggles render the control before the label
Within `wb-inspector`, every checkbox toggle row SHALL render its checkbox control before its label text, so the control appears on the left and the label on the right. This ordering SHALL apply to the existing "Required" and "Multiline" toggles and to any future checkbox toggle added to the inspector. The wrapping `<label>` element SHALL still associate the control with its label text, and the reordering SHALL NOT change the toggle's checked state, the `wbFieldUpdated` patch it emits, or its click behavior.

#### Scenario: Required toggle renders the checkbox before the label
- **WHEN** a data field is selected in the inspector and the "Required" toggle is rendered
- **THEN** the checkbox control precedes the "Required" label text within the toggle row

#### Scenario: Multiline toggle renders the checkbox before the label
- **WHEN** a plain-text field is selected in the inspector and the "Multiline" toggle is rendered
- **THEN** the checkbox control precedes the "Multiline" label text within the toggle row

#### Scenario: Reordered toggle keeps its label and behavior
- **WHEN** the user checks or unchecks a reordered inspector checkbox toggle
- **THEN** the toggle still shows the same label text, reflects the field's state, and emits the same `wbFieldUpdated` patch as before the reordering
