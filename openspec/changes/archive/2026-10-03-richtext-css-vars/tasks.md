# Tasks

## 1. Richtext Chrome (toolbar, button, linkbar, error)

- [x] 1.1 In `wb-form-field.css`, update `.wb-richtext__toolbar` `margin-bottom` to `var(--wb-richtext-toolbar-margin-bottom, 4px)` and `.wb-richtext__btn` `line-height` to `var(--wb-richtext-btn-line-height, 1.4)`
- [x] 1.2 In `wb-form-field.css`, update `.wb-richtext__linkbar` `margin-bottom` to `var(--wb-richtext-linkbar-margin-bottom, 4px)`
- [x] 1.3 In `wb-form-field.css`, update `.wb-richtext__linkbar input` `min-width`, `padding`, `font-size`, `border`, and `border-radius` to `var(--wb-richtext-linkbar-input-min-width, 160px)`, `var(--wb-richtext-linkbar-input-padding, 6px 8px)`, `var(--wb-richtext-linkbar-input-font-size, 13px)`, `var(--wb-richtext-linkbar-input-border, 1px solid #ddd)`, and `var(--wb-richtext-linkbar-input-border-radius, 6px)`, leaving `flex` and `box-sizing` unchanged
- [x] 1.4 In `wb-form-field.css`, update `.wb-richtext__error` `font-size` to `var(--wb-richtext-error-font-size, 12px)`

## 2. Richtext Editor and Content Blocks

- [x] 2.1 In `wb-form-field.css`, update `.wb-richtext__editor` `width` to `var(--wb-richtext-editor-width, 100%)`, leaving `box-sizing` unchanged
- [x] 2.2 In `wb-form-field.css`, update `.wb-richtext__editor .tiptap p` `margin` to `var(--wb-richtext-paragraph-margin, 0 0 0.4em)` and `.wb-richtext__editor .tiptap h2, h3` `margin` to `var(--wb-richtext-heading-margin, 0.4em 0)`
- [x] 2.3 In `wb-form-field.css`, update `.wb-richtext__editor .tiptap blockquote` `margin` to `var(--wb-richtext-quote-margin, 0.4em 0)` and `padding-left` to `var(--wb-richtext-quote-padding-left, 10px)`

## 3. Documentation

- [x] 3.1 Extend the `wb-form-field/readme.md` CSS Custom Properties table with the new `--wb-richtext-*` properties

## 4. Verification

- [x] 4.1 Run the package's build and confirm the component's styles still compile with no errors
