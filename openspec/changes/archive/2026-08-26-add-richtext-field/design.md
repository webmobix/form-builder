# Design — Add Rich Text Field

## Context

The form builder is a Stencil web-components monorepo. Fields are flat `FieldMeta` objects owned by `wb-canvas`, edited through `wb-inspector` patches, and rendered by `wb-form-field` (form-associated, value pushed into the ancestor `<form>` via `ElementInternals.setFormValue`). Submissions leave `wb-form-renderer` as a flat `Record<string, string>` built from `FormData`. There is no rich-text, sanitizer, or upload infrastructure today, and no UI-primitive library — components are hand-styled per-component CSS in Shadow DOM with `--wb-*` variable theming.

All product decisions for this change were settled in a structured interview; this document records them as engineering choices with rationale.

## Goals / Non-Goals

**Goals:**
- Form fillers can enter formatted content (bold/italic/underline/strike, H2/H3, bullet & ordered lists, blockquote, links, clear formatting, undo/redo) in a `richtext` data field.
- Rich text values flow through the existing submission contract unchanged (flat string map).
- Consumers can render stored rich text as sanitized HTML via an exported utility.
- Builder UX stays consistent: palette entry, canvas summary chip, inspector property editing.
- Required and max-plain-text-length validation through the existing native validity machinery.

**Non-Goals:**
- Image/media embedding and uploads (no upload infra exists).
- Tables, code blocks, text-align, highlight/color formatting.
- Global placeholder/help-text rollout across other field types.
- Wiring `dataSchema`/`FormDefinition` into rendering or validation.
- i18n of editor UI strings (repo-wide convention is hardcoded English).
- Upgrading the paragraph *design element* to rich text (possible follow-up reusing internals).

## Decisions

### D1: New data field type `'richtext'`
A first-class `FieldType`, not a paragraph-design-element upgrade and not a standalone decoupled web component.
*Why:* the need is "respondents enter formatted answers"; the existing pipeline (palette → canvas → inspector → renderer → FormData) gives everything else for free. A standalone component would duplicate form-associated plumbing; a design-element upgrade solves a different problem (static builder content).
*Alternative considered:* both at once — rejected to limit scope; internals will be shaped so the design-element reuse is a small follow-up.

### D2: Value stored as Tiptap JSON document, serialized as a string
`FieldMeta` gains nothing for the value; the submitted value under `field.<id>` is `JSON.stringify(doc)` produced by the editor's `getJSON()`. The submission contract (`Record<string, string>` from `FormData`) is untouched.
*Why:* lossless round-trip (no formatting lost when re-editing), stable against extension changes, diffable structure. HTML strings lose fidelity once unsupported tags are pasted; Markdown round-trips poorly.
*Alternatives considered:* HTML string (simplest but lossy on re-edit); extending `wbSubmit` to carry structured values (**BREAKING**, rejected).

### D3: Structurally empty documents submit `''`
A doc containing only blank paragraphs serializes as `''`; otherwise the JSON string. Required-validation reads `''` as missing.
*Why:* uniformity with every native control's FormData behavior; consumers get predictable strings. Always-JSON would force every consumer to special-case emptiness.

### D4: Standard feature tier via Tiptap StarterKit v3
Pin `@tiptap/*` to `^3.30`. Use `StarterKit` (v3 includes Underline and Link) configured down to exactly the agreed feature set, plus `@tiptap/extension-placeholder`.
*Why:* StarterKit minimizes dependency sprawl; v3's expanded kit covers the whole tier without extra packages. Anything beyond (images, tables) needs infrastructure that doesn't exist yet.

### D5: Fixed toolbar above the editable area
Static toolbar rendered inside the field's shadow root; active states reflect selection via editor events. Link insertion opens a small inline URL input anchored in the toolbar area; Link extension keeps default protocol validation (blocks `javascript:` etc.).
*Why:* discoverability for form fillers beats minimal chrome; bubble menus hide affordances from inexperienced users.
*Alternative considered:* bubble menu on selection (rejected for discoverability).

### D6: Overflow allowed, invalidity flagged (no hard block)
Max length counts **plain text** (concatenated text-node content of the doc). Typing/pasting past the limit is not prevented; instead `ElementInternals.setValidity` reports `customError` ("`<label>` exceeds N characters") on sync/submit, anchored to the editor container.
*Why:* Q13 chose flag-over-block deliberately — differs from native `maxLength` hard-blocking, but keeps long paste-and-trim workflows possible and reuses the established validity flow. Reuses `restrictions.text.maxLength` so the inspector control works unmodified.

### D7: Editor embedded in `wb-form-field`, logic in a shared module
No new public custom element. `wb-form-field` renders a contenteditable host div; Tiptap instantiation, extension list, toolbar model, and helpers live in a non-component module beside it (e.g. `richtext.ts`). Styles go into `wb-form-field.css` (shadow-scoped).
*Why:* avoids expanding the public API surface and bundle entry points now, while keeping the module boundary clean enough to lift into its own component (or the paragraph design element) later.
*Alternative considered:* dedicated internal `wb-rich-text-editor` component (deferred until a second consumer exists).

### D8: Sanitization at the single HTML boundary
Exported `docToHtml(doc)` wraps Tiptap's `generateHTML` with DOMPurify. Nothing else in the library turns rich text into HTML.
*Why:* documents originate from our own structured editor (not arbitrary HTML ingestion), so attack surface is limited to attribute/node escape hatches (e.g. link hrefs) — one sanitized export path covers consumers rendering saved content server- or client-side.

### D9: Builder-side representation stays a chip
Canvas row renders label + "Rich text" type badge; no live editor on the canvas. Inspector edits Label, Required, Placeholder (new `FieldMeta.placeholder`, richtext-only), Max Length.
*Why:* consistent with the canvas contract (rows are summaries; drag/reorder depends on it); introducing canvas-live editing is a cross-cutting change out of scope.

### D10: formAssociated parity
`setFormValue('' | json)` on every change; `formResetCallback` clears to empty doc; `formDisabledCallback` hides the toolbar and sets the editor non-editable. Disabled/readonly editors show formatted content without chrome.

## Risks / Trade-offs

- [Tiptap inside Shadow DOM has known styling/selection quirks] → All editor interactions covered by Playwright-browser-mode `.cmp.test.tsx` (typing, toolbar toggles, submit payload) before merge; styles injected via the component's own stylesheet only.
- [Bundle size grows materially for richtext users] → Single shared module import path keeps it out of non-richtext builds where tree-shaking applies; document approximate cost in README; no lazy-loading in v1.
- [Stored JSON is opaque to backends expecting plain text] → Format documented in spec; `docToHtml()` shipped so any consumer can derive display HTML; empty case is plain `''`.
- [Future extension removals silently drop stored node types on re-edit] → Conservative node set now; if the set ever shrinks, add a migration/version key before changing the schema.
- [Plain-text char count may differ from users' mental count (whitespace, newlines)] → Acceptable for v1; counting rule specified precisely (concatenated text-node content).
- [`placeholder` lands as the first per-field presentation prop outside text fields] → Kept richtext-scoped; generalization is an explicit future change, not silent creep.

## Migration Plan

Purely additive: new union member, new optional props, new exports. No existing behavior changes. Ship behind normal minor release via Changesets. Rollback = revert (no persisted-form migration exists in-repo; stored submissions elsewhere remain valid JSON strings regardless).

## Open Questions

None blocking — all product decisions were resolved during the interview. Future candidates (out of scope): global placeholder/help-text, images/uploads, paragraph design-element upgrade.
