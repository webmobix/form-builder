## ADDED Requirements

### Requirement: CSS custom properties for inspector container theming
The `wb-inspector` component SHALL expose CSS custom properties on `:host` for the container's background, border, border-radius, padding, and font-size. Each property SHALL fall back to the current hardcoded value when not set by the consumer.

| CSS Custom Property | Fallback Value |
|---|---|
| `--wb-inspector-background` | `#fff` |
| `--wb-inspector-border` | `1px solid #e4e4e0` |
| `--wb-inspector-border-radius` | `10px` |
| `--wb-inspector-padding` | `16px` |
| `--wb-inspector-font-size` | `14px` |

#### Scenario: Consumer sets background via CSS var
- **WHEN** a consumer sets `--wb-inspector-background: #f4f4f2` on `<wb-inspector>`
- **THEN** the container SHALL have a background of `#f4f4f2`

#### Scenario: Consumer does not set any CSS vars
- **WHEN** a consumer uses `<wb-inspector>` without setting any CSS custom properties
- **THEN** the container SHALL use the default fallback values (`#fff`, `1px solid #e4e4e0`, `10px`, `16px`, `14px`)

#### Scenario: Consumer sets border-radius only
- **WHEN** a consumer sets `--wb-inspector-border-radius: 4px` on `<wb-inspector>`
- **THEN** the container SHALL have a border-radius of `4px` while background, border, padding, and font-size use their fallback values

### Requirement: Inspector width is controlled by the host
The `wb-inspector` component SHALL have a width of `100%` and SHALL NOT enforce a minimum width, so the host can control the component's width.

#### Scenario: Host sets a width
- **WHEN** a consumer sets a width (e.g. `width: 300px`) on `<wb-inspector>`
- **THEN** the inspector SHALL render at that width

#### Scenario: No width set by host
- **WHEN** a consumer uses `<wb-inspector>` without setting a width
- **THEN** the inspector SHALL fill the width of its host (`100%`)

### Requirement: CSS custom properties are documented
The `readme.md` for `wb-inspector` SHALL list all exposed CSS custom properties with their names, fallback values, and a brief description.

#### Scenario: readme contains CSS vars table
- **WHEN** a developer reads `readme.md`
- **THEN** the document SHALL include a table of CSS custom properties with name, fallback, and description columns
