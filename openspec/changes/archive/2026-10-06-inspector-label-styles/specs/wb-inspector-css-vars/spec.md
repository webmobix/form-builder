# Spec Delta

## ADDED Requirements

### Requirement: CSS custom properties for inspector label theming
The `wb-inspector` component SHALL expose CSS custom properties on `:host` for the two label kinds it renders: the stacked labels above inputs and the inline labels beside checkboxes. Each property SHALL fall back to the component's built-in default when not set by the consumer. The checkbox label's color and font-size SHALL fall back to the corresponding field-label property, so a field-label override cascades to checkbox labels, while the checkbox label's font-weight and letter-spacing SHALL use their own distinct fallbacks so the two label kinds remain visually distinguishable.

| CSS Custom Property | Fallback Value (provisional) |
|---|---|
| `--wb-inspector-field-label-color` | `#0a0a0a` |
| `--wb-inspector-field-label-font-size` | `14px` |
| `--wb-inspector-field-label-font-weight` | `600` |
| `--wb-inspector-field-label-letter-spacing` | `0.5px` |
| `--wb-inspector-checkbox-label-color` | `var(--wb-inspector-field-label-color, #0a0a0a)` |
| `--wb-inspector-checkbox-label-font-size` | `var(--wb-inspector-field-label-font-size, 14px)` |
| `--wb-inspector-checkbox-label-font-weight` | `400` |
| `--wb-inspector-checkbox-label-letter-spacing` | `normal` |

#### Scenario: Consumer sets a field label property
- **WHEN** a consumer sets `--wb-inspector-field-label-font-weight: 700` on `<wb-inspector>`
- **THEN** labels rendered above inputs SHALL use font-weight `700`

#### Scenario: Consumer sets a checkbox label property
- **WHEN** a consumer sets `--wb-inspector-checkbox-label-font-weight: 600` on `<wb-inspector>`
- **THEN** labels rendered beside checkboxes SHALL use font-weight `600` while labels above inputs keep their own value

#### Scenario: Field label color override cascades to checkbox labels
- **WHEN** a consumer sets `--wb-inspector-field-label-color: #ff0000` and does not set `--wb-inspector-checkbox-label-color`
- **THEN** both labels above inputs and labels beside checkboxes SHALL use color `#ff0000`

#### Scenario: Checkbox override wins over the field label value
- **WHEN** a consumer sets both `--wb-inspector-field-label-color: #ff0000` and `--wb-inspector-checkbox-label-color: #00ff00`
- **THEN** labels above inputs SHALL use `#ff0000` and labels beside checkboxes SHALL use `#00ff00`

#### Scenario: Consumer does not set any label properties
- **WHEN** a consumer uses `<wb-inspector>` without setting any label CSS custom properties
- **THEN** field labels SHALL use their built-in fallbacks, and checkbox labels SHALL inherit color and font-size from the field-label fallbacks while using their own `400` font-weight and `normal` letter-spacing, so the two kinds differ in font-weight and letter-spacing

#### Scenario: Label properties are documented
- **WHEN** a developer reads the `wb-inspector` `readme.md`
- **THEN** the CSS custom properties table SHALL list the field-label and checkbox-label properties with their names, fallback values, and descriptions
