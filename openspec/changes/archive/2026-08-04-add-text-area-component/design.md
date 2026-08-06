## Context

The form-builder currently models text input as a single `text` `FieldType` rendered via a native `<input>` element in `wb-form-field`. Field metadata lives in `packages/form-core/src/types.ts` as `FieldMeta`, with a `subtype` discriminator (`text | number | email | tel`) and `restrictions` for min/max/step/maxLength. The inspector (`wb-inspector`) edits these props and emits patches; the renderer (`wb-form-renderer` → `wb-form-field`) consumes them.

We need multi-line text input without introducing a brand-new palette field type (which would fragment submission semantics, validation, and the data model). The user wants a `<textarea>` that auto-grows to fit content, surfaced by flipping a "multiline" property on the existing text field.

## Goals / Non-Goals

**Goals:**
- Render a `<textarea>` for text fields when `multiline` is enabled, keeping it the same `text` field type (no new `FieldType`, no new palette entry, unchanged form submission).
- Auto-grow height to fit content using CSS `field-sizing: content` (the user's reference snippet uses this).
- Let the author set `initialLines` (rows shown before content grows) and `maxHeight` (pixel cap before scrolling).
- Show multiline + initialLines + maxHeight controls in the inspector only when relevant (text field, plain `text` subtype).

**Non-Goals:**
- No new palette entry — multiline is a property of the existing text field.
- No change to JSON Schema data validation, form submission, or the `restrictions` model (maxLength still applies and is reused).
- No JS-based auto-grow measurement logic — rely on CSS `field-sizing: content` (graceful fallback: a default `rows` attribute keeps the textarea usable in browsers without support).
- No rich-text/markdown — plain textarea only.

## Decisions

**1. Extend `FieldMeta` with an optional `multiline` group rather than a new `FieldType`.**
- *Why:* A textarea is still a string field with the same submission/validation path. Adding a `textarea` type would duplicate subtype handling, inspector branches, and renderer branches, and would force form authors to delete + re-add a field to switch between single/multi-line.
- *Alternatives considered:* (a) New `FieldType = 'textarea'` — rejected for the above fragmentation. (b) Reuse `subtype` and add `multiline` as a subtype value — rejected because `subtype` already drives the HTML `type` attribute and validation rules (number/email/tel), which a textarea does not use.

**2. Add a new `TextAreaOptions` interface on `FieldMeta` instead of overloading `restrictions`.**
- Shape: `FieldMeta.multiline?: { enabled: boolean; initialLines?: number; maxHeight?: number }` — or a flat `multiline?: boolean` + `initialLines?` + `maxHeight?` trio.
- *Why:* `restrictions` models JSON-Schema-style value constraints (maxLength, min/max/step) that participate in validation. `initialLines` and `maxHeight` are pure presentation concerns and don't belong there. Grouping them under a `multiline` object keeps the model tidy and makes the inspector's conditional block a single null-check.
- *Chosen shape:* flat fields (`multiline?: boolean`, `initialLines?: number`, `maxHeight?: number`) on `FieldMeta`, because the renderer/inspector each only need one or two of them and a flat shape matches how the existing `required`, `subtype`, etc. are modeled. Defaults: `multiline=false`, `initialLines=3`, `maxHeight` unset (unbounded growth).

**3. Use CSS `field-sizing: content` for auto-grow, with `rows` as the floor and `max-height` as the cap.**
- *Why:* The user's reference snippet uses `field-sizing: content` and it's the simplest, framework-agnostic approach (no JS resize observers, no character-counting heuristics). Setting the textarea's `rows` attribute to `initialLines` gives the empty/short state; `max-height: <maxHeight>px` makes it scroll once content exceeds the cap.
- *Alternatives considered:* (a) JS `autoResize` on input measuring `scrollHeight` — more code, reflows per keystroke, harder to keep in sync with shadow DOM; (b) a fixed `rows` attribute with no auto-grow — doesn't meet the requirement.
- *Fallback:* `field-sizing` is relatively new (Chromium 123+, Safari 18.4+ / behind support). Where unsupported, the textarea still renders with the `rows` attribute and behaves as a normal non-growing textarea — acceptable graceful degradation, no JS polyfill.

**4. Single render branch in `wb-form-field`: if `type==='text' && subtype!=='number' && multiline` render `<textarea>`, else current `<input>`.**
- *Why:* Keeps the diff small and the existing input path untouched. Number subtype stays single-line even if someone sets `multiline` (inspector hides the toggle for non-plain-text subtypes, so this is defensive).
- The `<textarea>` reuses the same `name`, `required`, `maxLength`, `onInput` → `value` flow and the same ElementInternals validity sync. The `inputEl` ref is typed as `HTMLInputElement | HTMLTextAreaElement` so `setValidity` anchoring still works.

**5. Inspector: show `multiline` toggle only for `type==='text' && subtype==='text'`; show `initialLines` + `maxHeight` only when `multiline` is on.**
- *Why:* Number/email/tel subtypes are inherently single-line; multiline doesn't make sense there. Keeps the inspector focused.
- Toggling `multiline` off clears `initialLines`/`maxHeight` in the emitted patch so the renderer can ignore them.

## Risks / Trade-offs

- **`field-sizing: content` browser support is recent** → Mitigation: `rows` attribute provides a sane default; non-supporting browsers get a normal scrolling textarea. Document the fallback in the spec.
- **`max-height` in `px` is resolution/zoom-sensitive** → Mitigation: accept px for v1 (matches the user's request); could add a `rem` option later. Out of scope for now.
- **Existing serialized forms have no `multiline` field** → Mitigation: all new props are optional with `false`/`undefined` defaults; existing `FieldMeta` objects render unchanged as single-line inputs.
- **Switching `multiline` on an already-populated field** → Mitigation: `value` is preserved across the render switch since it lives in component `@State`, not in the DOM element.