## Requirements

### Requirement: CSS custom properties for palette panel theming
The `wb-palette` component SHALL expose CSS custom properties on `:host` for the `.panel` element's background, border-radius, padding, and gap. Each property SHALL fall back to the current hardcoded value when not set by the consumer.

| CSS Custom Property | Fallback Value |
|---|---|
| `--wb-palette-background` | `#f4f4f2` |
| `--wb-palette-border-radius` | `10px` |
| `--wb-palette-padding` | `8px` |
| `--wb-palette-gap` | `6px` |

#### Scenario: Consumer sets background via CSS var
- **WHEN** a consumer sets `--wb-palette-background: #fff` on `<wb-palette>`
- **THEN** the `.panel` element SHALL have a background of `#fff`

#### Scenario: Consumer does not set any CSS vars
- **WHEN** a consumer uses `<wb-palette>` without setting any CSS custom properties
- **THEN** the `.panel` element SHALL use the default fallback values (`#f4f4f2`, `10px`, `8px`, `6px`)

#### Scenario: Consumer sets border-radius only
- **WHEN** a consumer sets `--wb-palette-border-radius: 4px` on `<wb-palette>`
- **THEN** the `.panel` element SHALL have a border-radius of `4px` while background, padding, and gap use their fallback values

### Requirement: CSS custom properties are documented
The `readme.md` for `wb-palette` SHALL list all exposed CSS custom properties with their names, fallback values, and a brief description.

#### Scenario: readme contains CSS vars table
- **WHEN** a developer reads `readme.md`
- **THEN** the document SHALL include a table of CSS custom properties with name, fallback, and description columns
