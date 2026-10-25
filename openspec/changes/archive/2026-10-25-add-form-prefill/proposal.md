# Proposal

## Why

Hosts that re-open a saved submission or load a record currently get an empty rendered form:
`wb-form-renderer` only renders controls from `fields` and offers no way to seed values. The
renderer's own `wbSubmit` payload (`{ "field.<id>": value }`) is the natural shape for that
data, so a host should be able to hand the saved object straight back and get a filled form.

## What Changes

- `wb-form-renderer` gains a prefill input: a `values` prop (`Record<string, string>`, optional)
  and a matching `setValues(values)` public method, mirroring the existing `fields` /
  `setFields` pair. The accepted object is the same shape `wbSubmit` emits, so a saved payload
  can be passed back verbatim (no key translation).
- The renderer maps each prefill key to the rendered data field with that submission name and
  forwards the value to the field. Keys that match no rendered data field (unknown ids, design
  elements, stale fields) are ignored and reported with a `console.warn`; they never throw and
  never enter the form.
- `wb-form-field` gains an initial-value prop that seeds its control according to type:
  text/textarea/date/number inputs get the value, `select` selects the matching option (falling
  back to its hint/empty state when no option matches), `checkbox` is checked when the prefilled
  value is `'on'`, and `richtext` loads the value as a Tiptap JSON document.
- Prefill is applied on first render and whenever the prefill input changes; an ordinary
  re-render with unchanged prefill values SHALL NOT overwrite values the user has already typed.
- The dev harness gains a prefill control (JSON object + button) that calls `setValues`, so the
  submit → prefill round trip can be smoke tested in the browser.
- README documents the new prop/method and the round-trip contract.

Non-goals: no data import endpoint, no persistence, no per-field "dirty" tracking or reset-to-
prefill semantics beyond the existing native form reset (which still clears to empty), and no
change to the `wbSubmit` payload shape.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `form-renderer`: renderer accepts a `values` prefill object (prop + `setValues`), applies it
  per control type, ignores and warns about unknown keys, preserves user edits across
  re-renders, and exposes the round trip in the dev harness.
- `richtext-field`: richtext fields accept a prefilled JSON document string and render it in the
  Tiptap editor, both on mount and when a new prefill value arrives.

## Impact

- `packages/form-components/src/components/wb-form-renderer/` (component + unit tests + CSS
  untouched).
- `packages/form-components/src/components/wb-form-field/` (new initial-value prop, richtext
  editor seeding, unit/cmp tests).
- `packages/form-components/src/core/types.ts` — only if a shared prefill type alias is added
  (`Record<string, string>` stays the wire shape).
- `packages/form-components/src/index.html` (dev harness prefill control).
- Generated Stencil types (`src/components.d.ts`) and the React wrapper package pick up the new
  prop/method through the existing build; no hand edits expected.
- `README.md` renderer API tables and example.
