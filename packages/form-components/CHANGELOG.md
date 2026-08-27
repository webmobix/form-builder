# @webmobix/form-components

## 0.4.0

### Minor Changes

- 636c111: preview canvas now shows real form element
- be3751b: Add a real select field instead of the placeholder and fix rendering bugs on Safari.

## 0.3.0

### Minor Changes

- 3748635: added a new rich text field
- 3748635: Add the `richtext` field type: a Tiptap v3 editor with a fixed toolbar (bold, italic, underline, strikethrough, H2/H3, lists, blockquote, validated links, clear formatting, undo/redo) rendered by `wb-form-field`. Rich text values serialize as Tiptap JSON document strings under the existing `field.<id>` key (`''` when empty); required and plain-text max-length validation run through the native validity flow. Adds a `placeholder` field property (richtext-only), a "Rich text" palette entry with canvas chip and inspector controls, and an exported `docToHtml()` utility (generateHTML + DOMPurify) for rendering stored documents as sanitized HTML.

## 0.2.0

### Minor Changes

- 32d9281: add design components for title, text, rows

### Patch Changes

- e10f18e: Select an element after drag and drop

## 0.1.1

### Patch Changes

- 3a2d14b: Fix broken publish: include dist/ and loader/ output in the published package. The previous 0.1.0 release shipped an empty tarball (no dist/), making it unimportable.

## 0.1.0

### Minor Changes

- 3a8e70c: added high level fields to palette like email, url, etc. and hide the type and subtype fields from the user.
