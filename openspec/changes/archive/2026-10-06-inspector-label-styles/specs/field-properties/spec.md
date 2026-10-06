# Spec Delta

## MODIFIED Requirements

### Requirement: Editable type propagated to the canvas
The inspector SHALL NOT provide a type selector. A field's `type` is fixed at creation time (by the palette entry used to add it) and cannot be changed from the inspector. The inspector SHALL NOT render any read-only `type` display line.

#### Scenario: No type selector is rendered
- **WHEN** any field is selected in the inspector
- **THEN** the inspector does not render a `<select>` for `type` and SHALL NOT emit a patch changing `type`

#### Scenario: Switching away from text is no longer an inspector action
- **WHEN** the user is editing a text field in the inspector
- **THEN** there is no control to change the field's `type` to a non-text type; switching type requires deleting and re-adding the field from the palette

### Requirement: Editable subtype for text fields
The inspector SHALL NOT provide a subtype selector. A text field's `subtype` is fixed at creation time (by the palette entry used to add it) and cannot be changed from the inspector. The inspector SHALL NOT render a read-only display name derived from the field's fixed `type` and `subtype`.

#### Scenario: No subtype selector is rendered for text fields
- **WHEN** the selected field's type is `text`
- **THEN** the inspector does not render a `<select>` for `subtype` and SHALL NOT emit a patch changing `subtype`

#### Scenario: No subtype selector for non-text fields
- **WHEN** the selected field's type is not `text`
- **THEN** the inspector does not render a subtype selector (unchanged behavior, now also true because the selector no longer exists)

#### Scenario: Switching subtype is no longer an inspector action
- **WHEN** the user is editing a text field in the inspector
- **THEN** there is no control to change the field's `subtype`; switching subtype requires deleting and re-adding the field from the palette

## ADDED Requirements

### Requirement: Inspector distinguishes stacked field labels from checkbox labels
Labels rendered above an input SHALL use a stacked label style and SHALL carry a stacked class hook. Labels rendered beside a checkbox SHALL use a distinct inline checkbox-label style and SHALL carry a separate checkbox class hook. The two styles SHALL be visually distinguishable, and each SHALL be targetable independently so hosts can theme them separately (see the `wb-inspector-css-vars` capability for the exposed custom properties).

#### Scenario: A label above an input uses the stacked style
- **WHEN** a data field or design element is selected and the inspector renders a label above an input or read-only display
- **THEN** that label uses the stacked label class and stacked style

#### Scenario: Checkbox labels use the inline style
- **WHEN** the inspector renders the "Required" toggle, the "Multiline" toggle, or an extension checkbox
- **THEN** the label text beside the checkbox uses the checkbox label class and the inline checkbox-label style

#### Scenario: The two label styles are visually distinguishable
- **WHEN** a screen renders both a stacked field label and a checkbox label with no host overrides
- **THEN** the two labels do not share an identical font weight and letter-spacing

## REMOVED Requirements

### Requirement: Read-only field display name in the inspector
**Reason**: The friendly type name duplicates information already implied by the palette entry used to create the field, and the panel is cleaner without it. The field `type`/`subtype` remain fixed and are no longer displayed.
**Migration**: No replacement is needed. The field's type/subtype are still determined by the palette entry used to create it; consumers that displayed or relied on the inspector's read-only type name should read the field's `type`/`subtype` from the `FieldMeta` model directly.
