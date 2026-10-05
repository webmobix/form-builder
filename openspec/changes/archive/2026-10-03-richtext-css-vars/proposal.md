## Why

The previous `css-vars-form-field` change exposed most richtext styling as CSS custom properties, but several literals in the richtext editor remain hardcoded: toolbar/linkbar/spacing margins, the link bar input styling, the error font size, the editor width, and Tiptap block/paragraph margins. Embedding pages still cannot fully control richtext appearance without CSS hacks, so the `--wb-richtext-*` family should be completed.

## What Changes

- Add `--wb-richtext-toolbar-margin-bottom` for `.wb-richtext__toolbar`
- Add `--wb-richtext-btn-line-height` for `.wb-richtext__btn`
- Add `--wb-richtext-linkbar-margin-bottom` for `.wb-richtext__linkbar`
- Add `--wb-richtext-linkbar-input-*` properties for `.wb-richtext__linkbar input` (`min-width`, `padding`, `font-size`, `border`, `border-radius`)
- Add `--wb-richtext-error-font-size` for `.wb-richtext__error`
- Add `--wb-richtext-editor-width` for `.wb-richtext__editor`
- Add `--wb-richtext-paragraph-margin`, `--wb-richtext-heading-margin`, `--wb-richtext-quote-margin`, and `--wb-richtext-quote-padding-left` for the Tiptap content blocks
- Update `readme.md` to document the new CSS custom properties

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `form-field-css-vars`: extend the exposed richtext CSS custom properties to cover the remaining literal values in the richtext editor, toolbar, link bar, error, and Tiptap content blocks.

## Impact

- `packages/form-components/src/components/wb-form-field/wb-form-field.css` — replace the remaining hardcoded richtext values with `var()` references and defaults
- `packages/form-components/src/components/wb-form-field/readme.md` — document the new CSS custom properties
