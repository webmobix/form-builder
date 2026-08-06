## Why

The `wb-palette` component uses hardcoded values for `.panel` background, border-radius, padding, and gap. Embedding pages cannot customize these visual properties without deep CSS hacks. Exposing CSS custom properties on `:host` gives consumers a clean, documented API for theming.

## What Changes

- Add CSS custom properties on `:host` for the `.panel` styles: `--wb-palette-background`, `--wb-palette-border-radius`, `--wb-palette-padding`, `--wb-palette-gap`
- Reference these vars in `.panel` rules, falling back to current hardcoded values
- Update `readme.md` to document the new CSS custom properties

## Capabilities

### New Capabilities
- `palette-css-vars`: CSS custom properties on `:host` for theming the palette panel background, border-radius, padding, and gap

### Modified Capabilities
- None

## Impact

- `packages/form-components/src/components/wb-palette/wb-palette.css` — add `:host` CSS vars and update `.panel` to use them
- `packages/form-components/src/components/wb-palette/readme.md` — document new CSS custom properties
