---
'@webmobix/form-components': minor
---

Add the `richtext` field type: a Tiptap v3 editor with a fixed toolbar (bold, italic, underline, strikethrough, H2/H3, lists, blockquote, validated links, clear formatting, undo/redo) rendered by `wb-form-field`. Rich text values serialize as Tiptap JSON document strings under the existing `field.<id>` key (`''` when empty); required and plain-text max-length validation run through the native validity flow. Adds a `placeholder` field property (richtext-only), a "Rich text" palette entry with canvas chip and inspector controls, and an exported `docToHtml()` utility (generateHTML + DOMPurify) for rendering stored documents as sanitized HTML.
