## MODIFIED Requirements

### Requirement: CSS custom properties for native controls, state, hint, and richtext

The `wb-form-field` component SHALL expose CSS custom properties for the textarea, select, and checkbox controls, the disabled background, the placeholder hint font size, and the remaining richtext editor styles. Each property SHALL fall back to the current hardcoded value when not set by the consumer.

| CSS Custom Property | Applies To | Fallback Value |
|---|---|---|
| `--wb-field-textarea-min-height` | `.wb-field__textarea` | `fit-content` |
| `--wb-field-select-background` | `.wb-field__select` | `#fff` |
| `--wb-field-checkbox-gap` | `.wb-field--checkbox__row` | `8px` |
| `--wb-field-checkbox-accent-color` | `.wb-field--checkbox input` | `#2f6fed` |
| `--wb-field-disabled-background` | disabled `input`, `textarea`, `select`, richtext editor | `#fff` |
| `--wb-field-hint-font-size` | `.wb-field__placeholder-hint` | `12px` |
| `--wb-richtext-editor-padding` | `.wb-richtext__editor` | `8px 10px` |
| `--wb-richtext-editor-min-height` | `.wb-richtext__editor` | `96px` |
| `--wb-richtext-editor-width` | `.wb-richtext__editor` | `100%` |
| `--wb-richtext-font-size` | `.wb-richtext__editor .tiptap` | `15px` (already exposed; retained) |
| `--wb-richtext-line-height` | `.wb-richtext__editor .tiptap` | `1.5` |
| `--wb-richtext-paragraph-margin` | `.wb-richtext__editor .tiptap p` | `0 0 0.4em` |
| `--wb-richtext-heading-margin` | `.wb-richtext__editor .tiptap h2`, `h3` | `0.4em 0` |
| `--wb-richtext-toolbar-margin-bottom` | `.wb-richtext__toolbar` | `4px` |
| `--wb-richtext-btn-padding` | `.wb-richtext__btn` | `4px 8px` |
| `--wb-richtext-btn-font-size` | `.wb-richtext__btn` | `12px` |
| `--wb-richtext-btn-line-height` | `.wb-richtext__btn` | `1.4` |
| `--wb-richtext-btn-hover-border-color` | `.wb-richtext__btn:hover` | `#bbb` |
| `--wb-richtext-linkbar-gap` | `.wb-richtext__linkbar` | `6px` |
| `--wb-richtext-linkbar-margin-bottom` | `.wb-richtext__linkbar` | `4px` |
| `--wb-richtext-linkbar-input-min-width` | `.wb-richtext__linkbar input` | `160px` |
| `--wb-richtext-linkbar-input-padding` | `.wb-richtext__linkbar input` | `6px 8px` |
| `--wb-richtext-linkbar-input-font-size` | `.wb-richtext__linkbar input` | `13px` |
| `--wb-richtext-linkbar-input-border` | `.wb-richtext__linkbar input` | `1px solid #ddd` |
| `--wb-richtext-linkbar-input-border-radius` | `.wb-richtext__linkbar input` | `6px` |
| `--wb-richtext-error-color` | `.wb-richtext__error` | `#e53e3e` |
| `--wb-richtext-error-font-size` | `.wb-richtext__error` | `12px` |
| `--wb-richtext-quote-border` | `.wb-richtext__editor .tiptap blockquote` | `3px solid #ddd` |
| `--wb-richtext-quote-color` | `.wb-richtext__editor .tiptap blockquote` | `#55554f` |
| `--wb-richtext-quote-margin` | `.wb-richtext__editor .tiptap blockquote` | `0.4em 0` |
| `--wb-richtext-quote-padding-left` | `.wb-richtext__editor .tiptap blockquote` | `10px` |

The textarea and select rules SHALL reuse the shared `--wb-field-input-*` properties from the first requirement for `width`, `padding`, `font-size`, `border`, and `border-radius`, and SHALL continue to set `box-sizing: border-box` unconditionally.

Layout-critical richtext properties (`display`, `flex`, `flex-wrap`, `align-items`, `float`, `outline`, `cursor`, `resize`, `appearance`) SHALL remain literal and are not exposed as CSS custom properties.

#### Scenario: Consumer themes textarea and select via shared input vars
- **WHEN** a consumer sets `--wb-field-input-padding` and `--wb-field-input-border` on `<wb-form-field>`
- **THEN** the textarea and select controls SHALL use those values for padding and border, while `box-sizing` remains `border-box`

#### Scenario: Consumer themes a disabled control background
- **WHEN** a consumer sets `--wb-field-disabled-background: #1e1e1e` on `<wb-form-field>`
- **THEN** disabled native inputs, textarea, select, and the disabled richtext editor SHALL have that background

#### Scenario: Consumer themes the link bar input
- **WHEN** a consumer sets `--wb-richtext-linkbar-input-padding`, `--wb-richtext-linkbar-input-border`, and `--wb-richtext-linkbar-input-border-radius` on `<wb-form-field>`
- **THEN** the link bar input SHALL use those values for padding, border, and border-radius

#### Scenario: Consumer themes richtext content spacing
- **WHEN** a consumer sets `--wb-richtext-paragraph-margin`, `--wb-richtext-heading-margin`, and `--wb-richtext-quote-margin` on `<wb-form-field>`
- **THEN** the Tiptap paragraphs, headings, and blockquotes SHALL use those margins

#### Scenario: Consumer themes richtext error and toolbar chrome
- **WHEN** a consumer sets `--wb-richtext-error-font-size` and `--wb-richtext-toolbar-margin-bottom` on `<wb-form-field>`
- **THEN** the richtext error text SHALL use that font size and the toolbar SHALL use that margin-bottom

#### Scenario: Consumer does not set the new CSS vars
- **WHEN** a consumer uses `<wb-form-field>` without setting any of the new CSS custom properties
- **THEN** the textarea, select, checkbox, disabled state, hint, and richtext styles SHALL use their default fallback values

#### Scenario: Consumer does not set the richtext CSS vars
- **WHEN** a consumer uses `<wb-form-field>` without setting any of the richtext CSS custom properties
- **THEN** the toolbar, link bar, link bar input, error text, editor, and Tiptap content blocks SHALL use their default fallback values
