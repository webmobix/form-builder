## Why

The `wb-form-field` component styles its container, label, required mark, and native input controls with hardcoded values. Because of shadow DOM encapsulation, embedding pages cannot theme these properties without deep CSS hacks. Exposing CSS custom properties gives consumers a clean, documented API consistent with `wb-palette` and `wb-inspector`.

## What Changes

- Add CSS custom properties to `.wb-field` for `font-size`
- Add CSS custom properties to `.wb-field__label` for `font-size`, `color`, and `margin-bottom`
- Add a CSS custom property to `.required-mark` for `color`
- Update the shared `.wb-field` input rule (`input[type="text"]`, `date`, `email`, `url`, `number`, `password`, `tel`) to use `var()` for every property except `box-sizing`, keeping current values as defaults
- Reuse the shared `--wb-field-input-*` properties on the textarea and select controls, and add `--wb-field-textarea-min-height` and `--wb-field-select-background` for their remaining literal values
- Add `--wb-field-checkbox-gap` for the checkbox row gap and `--wb-field-checkbox-accent-color` for the checkbox accent color
- Add `--wb-field-disabled-background` for the disabled control background (native inputs, textarea, select, and the disabled richtext editor)
- Add `--wb-field-hint-font-size` for the placeholder helper text font size
- Add `--wb-richtext-*` properties for the remaining literal richtext editor, toolbar button, linkbar input, error, and blockquote styles
- Update `readme.md` to document the new CSS custom properties

## Capabilities

### New Capabilities
- `form-field-css-vars`: CSS custom properties for theming the form field container, label, required mark, and native input controls

### Modified Capabilities
- None

## Impact

- `packages/form-components/src/components/wb-form-field/wb-form-field.css` — replace hardcoded values with `var()` references and defaults
- `packages/form-components/src/components/wb-form-field/readme.md` — document new CSS custom properties
