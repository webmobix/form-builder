# Tasks — Add Rich Text Field

## 1. Dependencies and model

- [x] 1.1 Add `@tiptap/core@^3.30`, `@tiptap/starter-kit@^3.30`, `@tiptap/pm@^3.30`, `@tiptap/extension-placeholder@^3.30`, and `dompurify` (+ `@types/dompurify` if needed) to `packages/form-components` and install with pnpm
- [x] 1.2 Extend `FieldType` union in `src/core/types.ts` with `'richtext'` and add optional `placeholder?: string` to `FieldMeta`
- [x] 1.3 Export the new types from the package entry point and confirm `pnpm build` passes with Biome clean (`pnpm lint`)

## 2. Editor module (non-component core)

- [x] 2.1 Create `src/components/wb-form-field/richtext.ts` encapsulating Tiptap: StarterKit configured down to the standard feature set (bold, italic, underline, strike, H2/H3 headings, bullet/ordered lists, blockquote, link with default protocol validation, undo/redo — no images/tables/code/horizontal rule) plus Placeholder extension
- [x] 2.2 Define the toolbar model (ordered actions, active-state query functions, link URL inline-input flow, clear-formatting action)
- [x] 2.3 Implement empty-document helpers: `isEmptyDoc(json)` (only blank paragraphs → empty) and plain-text length counting (concatenated text-node content)
- [x] 2.4 Implement and export `docToHtml(jsonDoc)` = `generateHTML` over the shipped schema + DOMPurify sanitize; export from package index
- [x] 2.5 Unit tests for richtext module: feature-set configuration, empty-doc detection, plain-text counting (markup excluded), docToHtml output incl. hostile-attribute stripping

## 3. wb-form-field rendering and value binding

- [x] 3.1 Add render branch for `type === 'richtext'`: mount editor on a host div inside the shadow root; render fixed toolbar above the editable area from the toolbar model with active states bound to editor transactions
- [x] 3.2 Style toolbar + editor in `wb-form-field.css` (shadow-scoped, `--wb-*` theming variables consistent with existing components); placeholder styling via Placeholder extension classes
- [x] 3.3 Wire value binding into the form-associated contract: `sync()` pushes `JSON.stringify(getJSON())` or `''` for empty docs via `setFormValue`; re-sync on editor transactions
- [x] 3.4 Implement validation in `sync()`: required-empty → missing-value message "`<label>` is required"; `restrictions.text.maxLength` overflow (plain-text count) → custom error "`<label>` exceeds N characters"; both anchored via `setValidity` to the editor container — no input blocking
- [x] 3.5 Implement `formDisabledCallback` (hide toolbar, set editable false) and `formResetCallback` (clear to empty doc, push `''`)
- [x] 3.6 Render placeholder text in the empty editor when `placeholder` is set

## 4. Builder surfaces (palette, canvas, inspector)

- [x] 4.1 Add `{ type: 'richtext', label: 'Rich text' }` to `FIELD_TYPES` in `wb-palette.tsx`
- [x] 4.2 Canvas: include `richtext` in `buildField()` creation flow, add "Rich text" to `rowTypeLabel()` so rows render the summary chip badge; verify drag/reorder unaffected
- [x] 4.3 Inspector: map `richtext` → "Rich text" in `displayName()`; render Placeholder text input (emit patch, clear → undefined, richtext-only) and Max Length input for richtext fields

## 5. Renderer passthrough and harness

- [x] 5.1 Confirm `wb-form-renderer` renders richtext entries through its generic per-field path and that design-element handling is untouched; adjust only if the passthrough filters by type
- [x] 5.2 Verify dev harness (`src/index.html`) end-to-end: add Rich text from palette, edit properties in inspector, fill in renderer, submit and inspect `wbSubmit` payload (`field.<id>` JSON string / `''`)

## 6. Component tests (Playwright browser mode)

- [x] 6.1 `wb-form-field.cmp.test.tsx`: renders toolbar+editor, applies bold via toolbar, active-state reflection, typing produces JSON-string form value, empty submits `''`
- [x] 6.2 Validation tests: required-empty error message anchored correctly; overflow past maxLength flags custom error without blocking input; valid content clears errors
- [x] 6.3 Disabled/reset tests: disabled hides toolbar and locks editing while keeping content; reset clears to `''`
- [x] 6.4 Link tests: https URL applies; `javascript:` URL rejected
- [x] 6.5 Palette/canvas/inspector snapshot updates: palette entry present, chip badge label, inspector shows Rich text display name with Placeholder + Max Length controls

## 7. Docs and release

- [x] 7.1 Update README field-type list and document the rich text value format (`field.<id>` holds JSON.stringify'd Tiptap doc or `''`) plus `docToHtml()` usage example
- [x] 7.2 Add minor changeset for `@webmobix/form-components`
- [x] 7.3 Run full gates: `pnpm lint && pnpm build && pnpm test` across workspaces
