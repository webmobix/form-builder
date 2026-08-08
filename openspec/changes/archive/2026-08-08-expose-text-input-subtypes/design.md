## Context

The form-builder models all single-line text inputs as `FieldType = 'text'` with a `subtype` discriminator (`text | number | email | tel`) on `FieldMeta` (`packages/form-components/src/core/types.ts`). The palette (`wb-palette`) currently exposes a single "Text input" entry that emits `{ type: 'text', label }` via `wbAddField` / `wbPaletteDragEnd`. The canvas (`wb-canvas`) creates fields via `addField` / `addFieldAfter` / `commitExternalInsert`, each of which takes `(type, label)` and constructs `{ id, type, label }` — no `subtype`. The inspector (`wb-inspector`) lets the author change `type` and `subtype` after creation via two `<select>` elements (`onTypeChange`, `onSubtypeChange`), clearing restrictions/multiline when switching. The renderer (`wb-form-renderer`) forwards `subtype` to `wb-form-field`, whose `getInputType()` returns the subtype as the HTML `type` attribute for text fields.

`wb-form-field.getInputType()` already returns `subtype` verbatim for text fields (excluding `number` which maps to `'number'`), so adding `'url'` and `'password'` to `TextSubtype` makes them render as `<input type="url">` and `<input type="password">` with no renderer change. The validity `sync()` path only special-cases `number`; url/password fall through and behave like plain text for value-missing/maxLength.

## Goals / Non-Goals

**Goals:**
- Let a form author create Email, URL, Number, and Password fields in one click/drag from the palette, without knowing HTML input types.
- Keep the JSON model, validation, submission, and the `text` `FieldType` unchanged — palette subtypes only set the existing `subtype` field.
- Remove the Type and Subtype selectors from the inspector so authors can't accidentally switch a field's type/subtype post-creation; show a read-only display name instead.

**Non-Goals:**
- No new `FieldType`. Email/URL/Number/Password are still `text` fields with a `subtype`.
- No new restriction shapes. URL/Password reuse the existing `text` `maxLength` restriction.
- No change to the React wrapper, JSON Schema validation, or form submission.
- No reintroduction of type/subtype editing via a different surface. Type changes require deleting and re-adding the field.
- No change to `tel` (stays in the model for completeness, not surfaced in the palette in this change).

## Decisions

**1. Add `url` and `password` to `TextSubtype`.**
- *Why:* The model already discriminates text inputs via `subtype`. `url` and `password` are standard HTML input types that map 1:1 to existing subtype semantics (string value, optional `maxLength`). Adding them to the union is a one-line, backward-compatible widening.
- *Alternatives considered:* (a) Add a new `FieldType = 'email'` etc. — rejected: fragments the data model and duplicates the renderer/inspector branches. (b) Reuse `'text'` subtype and add a separate `inputType` field — rejected: `subtype` already exists and is the documented discriminator.

**2. Palette entries carry `subtype`; canvas insertion methods accept and persist it.**
- *Why:* `wbAddField` and `wbPaletteDragEnd` already carry `{ type, label }`. Extending the payload with `subtype?` and threading it through `addField` / `addFieldAfter` / `commitExternalInsert` is the smallest change that seeds the field's subtype at creation. The canvas already stores arbitrary `FieldMeta` fields, so persisting `subtype` is a one-field addition to the constructed object.
- *Why not pass a full `FieldMeta` partial:* keeps the event contract close to its current shape and avoids coupling the palette to the full `FieldMeta` shape. `subtype` is the only creation-time variable.
- *Default subtype:* when `subtype` is omitted (the existing "Text input" entry, and any non-text palette entry), the field is created with no `subtype` and the renderer/inspector default it to `'text'` as today.

**3. Inspector: remove Type and Subtype selectors; show a read-only display name.**
- *Why:* The user's stated goal is that authors shouldn't see HTML-specific types, and we won't show type/subtype in the inspector. Removing the two `<select>` elements and replacing them with a read-only "Field" line (e.g. "Email", "Number", "Dropdown") makes the inspector reflect what the field *is* without offering a mutation path. This also removes the `onTypeChange`/`onSubtypeChange` patch-clearing logic — since type/subtype can no longer change via the inspector, the only way to switch is to delete and re-add.
- *Display-name mapping:* a helper `displayName(type, subtype)` maps to friendly labels: `text`+`text`→"Text input", `text`+`email`→"Email", `text`+`url`→"URL", `text`+`number`→"Number", `text`+`password`→"Password", `text`+`tel`→"Telephone", `select`→"Dropdown", `date`→"Date", `checkbox`→"Checkbox". This keeps the read-only display consistent with the palette labels.
- *Alternatives considered:* (a) Disable the selectors instead of removing — rejected: the user explicitly said "we will not show type and subtype there anymore". (b) Keep subtype selector but hide type — rejected: same instruction, and subtype alone is the HTML-specific concept we're hiding.

**4. Restriction and multiline controls remain gated on the field's (now fixed) subtype.**
- *Why:* The existing conditionals (`isText && subtype === 'number'` for min/max/step, `isText && subtype === 'text'` for maxLength + multiline) already do the right thing once type/subtype are creation-fixed. No gating logic changes — only the mutation entry point (the selectors) is removed.
- *Number subtype keeps min/max/step.* Text-like subtypes (`text`, `email`, `url`, `password`, `tel`) get the `maxLength` input. Multiline stays gated to plain `text` (number/email/url/password/tel are inherently single-line).

**5. Palette label wording.**
- *Labels:* "Text input", "Email", "URL", "Number", "Password" alongside the existing "Dropdown", "Date", "Checkbox". Match the inspector's `displayName` so a field's name is consistent end-to-end.
- *Why short labels:* the palette is a vertical button list; long labels wrap. "Email" is clearer than "Email input" for the audience we're targeting (authors who don't know HTML types).

## Risks / Trade-offs

- **Removing type/subtype editing is a capability reduction** → Mitigation: the palette now offers direct creation for the common cases; switching type still works via delete + re-add. This matches the user's explicit request ("we will not show type and subtype there anymore").
- **Existing serialized forms with `subtype: 'tel'` render unchanged** → Mitigation: `tel` stays in `TextSubtype`; the inspector's display-name helper handles it. No palette entry for `tel` in this change (out of scope), but existing fields with `tel` still render and display correctly.
- **`url`/`password` validity is not enriched** → Mitigation: v1 keeps `sync()` as-is (only `number` gets range validation). The browser's native `typeMismatch` for `url`/`email` is not surfaced through `ElementInternals.setValidity` today for any subtype; enriching that is a separate change. `maxLength` still applies.
- **Palette grows from 4 to 8 entries** → Mitigation: acceptable for v1; the list is still short and the entries are the most common field types. If it grows further, grouping (e.g. a "Text inputs" group) can be added later.
- **`commitExternalInsert` signature change is additive** → Mitigation: `subtype` is an optional third arg; existing callers (none outside the harness, which forwards `e.detail` wholesale) are unaffected.