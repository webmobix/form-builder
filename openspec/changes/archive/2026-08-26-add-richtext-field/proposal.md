# Add Rich Text Field

## Why

The form builder currently offers only plain-text input fields; form fillers cannot enter formatted content (bold, lists, headings, links), and form builders cannot offer that capability to respondents. A Tiptap-based rich text field closes this gap with a proven, actively maintained editor stack while keeping the existing flat submission contract intact.

## What Changes

- Add a new data field type `'richtext'` selectable from the palette, rendered as a summary chip on the canvas (no inline editing), configurable in the inspector, and fillable in `wb-form-renderer` via `wb-form-field`.
- Embed a Tiptap v3 editor with a fixed toolbar offering: bold, italic, underline, strikethrough, H2/H3 headings, bullet list, ordered list, blockquote, link (with protocol validation and inline URL entry), clear formatting, undo/redo.
- Store field values as Tiptap/ProseMirror JSON documents serialized with `JSON.stringify` into the existing flat `Record<string, string>` submission record under `field.<id>`; empty content submits `''`.
- Export a `docToHtml()` utility (tiptap `generateHTML` wrapped with DOMPurify sanitization) so consumers can render stored documents as safe HTML without mounting an editor.
- Validate via the existing `ElementInternals.setValidity` flow: required (empty = missing) and max characters counted on plain text; overflow is allowed during typing and flagged as invalid on sync/submit rather than hard-blocked.
- Introduce a `placeholder` property on `FieldMeta`, rendered via the Tiptap Placeholder extension — scoped to the richtext field only in this change.
- Inspector gains: "Rich text" display name, Placeholder input, Max Length input (reusing existing text restrictions) for richtext fields.
- Add dependencies to `@webmobix/form-components`: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/pm`, `@tiptap/extension-placeholder`, `dompurify`.

## Capabilities

### New Capabilities
- `richtext-field`: The rich text data field end-to-end — palette entry, canvas chip representation, inspector properties (placeholder, max length), Tiptap editor rendering with fixed toolbar, JSON-doc value format and empty-content semantics, plain-text length validation, read-only/disabled/reset behavior, and the exported `docToHtml()` utility.

### Modified Capabilities
- `field-properties`: The read-only display name mapping gains `richtext` → "Rich text"; the type/subtype-specific restriction rule changes so `richtext` fields show the Max Length input (previously restricted to text-like subtypes only); the inspector renders a Placeholder input for richtext fields (new property on `FieldMeta`).

## Impact

- **Code**: `packages/form-components` — `src/core/types.ts` (`FieldType` union, `FieldMeta.placeholder`), new internal editor component, `wb-palette.tsx` (`FIELD_TYPES` entry), `wb-canvas.tsx` (`buildField`, `rowTypeLabel`), `wb-inspector.tsx` (`displayName`, property controls), `wb-form-field.tsx` (render branch + validity), `wb-form-renderer.tsx` (passthrough), package exports (`docToHtml`).
- **Dependencies**: `@tiptap/core@^3.30`, `@tiptap/starter-kit@^3.30`, `@tiptap/pm@^3.30`, `@tiptap/extension-placeholder@^3.30`, `dompurify` added to `packages/form-components`; bundle size increases for consumers using rich text (mitigated by tree-shakeable `dist-custom-elements`).
- **APIs**: No breaking changes — submission contract stays a flat `Record<string, string>`; richtext values are JSON strings within it. React wrappers regenerate automatically via `reactOutputTarget`.
- **Out of scope**: wiring `dataSchema`/`FormDefinition`, image uploads/media, global placeholder/help-text rollout, i18n.
