## MODIFIED Requirements

### Requirement: Canvas renders data fields as real inert form controls

The canvas SHALL render each `kind === 'data'` element by stamping a real `wb-form-field` component forwarded the entry's `type`, `subtype`, `restrictions`, `multiline`, `initialLines`, `maxHeight`, `placeholder`, `required`, and `label` props, placed in disabled state, so its appearance matches what `wb-form-renderer` produces for the same entry (labels, required marks, control styling, spacing, placeholder renderings). Disabled fields SHALL look normal: no dimming, graying, or other visual difference from the live form's normal appearance. The placeholder SHALL render per field type exactly as the live form renders it: native placeholder attribute for `text` inputs and textareas, disabled sentinel-value hint option for `select`, muted helper text for `date` and `checkbox`, and the Tiptap placeholder hint for `richtext`.

#### Scenario: Text field renders as the real labeled input

- **WHEN** the canvas renders a `kind: 'data'`, `type: 'text'` element with a label
- **THEN** the canvas shows a `wb-form-field` rendering the same labeled `<input>` markup and styling the live form would show

#### Scenario: Required mark renders as in the live form

- **WHEN** a data element has `required: true`
- **THEN** the canvas-rendered field shows the label followed by the red required asterisk, matching the renderer

#### Scenario: Disabled fields show no disabled visual treatment

- **WHEN** any data field is rendered on the canvas in disabled state
- **THEN** the control looks identical to its enabled live-form appearance (no browser-disabled graying)

#### Scenario: Placeholder renders as in the live form for every data field type

- **WHEN** a data element of any type (`text` in any subtype, `select`, `date`, `checkbox`, `richtext`) has a `placeholder` set
- **THEN** the canvas-rendered field shows the placeholder exactly as `wb-form-renderer` shows it for the same entry (native placeholder, disabled hint option, or muted helper text respectively)