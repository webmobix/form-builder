# Design

## Context

See proposal.md — Why. Relevant current state:

- `wb-form-renderer` renders `FieldMeta[]` → `wb-form-field` children inside its shadow `<form>`,
  derives each data field's name as `field.<id>`, and emits `wbSubmit` by reading `FormData`
  from that form. It already exposes `setFields` and uses a `@State` counter to force a
  re-render after prop mutation. See `specs/form-renderer/spec.md` for the current contract.
- `wb-form-field` owns its value internally: `@State() value` / `@State() checked` are mutated by
  `onInput`, then `sync()` pushes the value through `ElementInternals.setFormValue`. There is no
  way for a parent to seed those states today.
- `richtext` fields are an exception: the value is derived from the live Tiptap editor
  (`editor.getJSON()`), and the editor is constructed in `componentDidLoad()` with no `content`.
  Setting a value prop alone would not populate the editor.
- `select` fields carry `selectHasChoice` so the disabled sentinel hint option (which may share an
  empty key with a real option) is only shown while no real choice has been made.
- The dev harness (`packages/form-components/src/index.html`) already pushes `wbChange` payloads
  into the renderer via `setFields`, so it has a natural place for a prefill control.

## Goals / Non-Goals

**Goals:**

- Let a host pass back the exact object `wbSubmit` emitted and get a filled form, with no key
  translation and no host-side per-field plumbing.
- Keep prefill declarative and diff-friendly: unchanged prefill strings never reset user input.
- Keep field encapsulation: the renderer never reaches into a field's shadow DOM.
- Make the round trip manually verifiable in the dev harness.

**Non-Goals:**

- No persistence, fetch, or schema/`FormDefinition` integration; the prefill object is plain
  `Record<string, string>`.
- No change to `wbSubmit`, `FieldMeta`, or the canvas/inspector.
- No "reset to prefill" semantics: native form reset still clears to empty.
- No validation of prefilled values (the existing rules run on sync and submit as today).

## Decisions

### 1. Prefill input: `values` prop + `setValues` method, keyed `field.<id>`

The renderer accepts `values?: Record<string, string>` and exposes
`setValues(values): Promise<void>` mirroring `fields` / `setFields`. Keys are submission names
(`field.<id>`), the shape `wbSubmit` emits, so a saved payload is passed back verbatim.

Alternatives considered:

- `data` — collides with the "data field vs design element" vocabulary used throughout the
  project.
- `initialData` / `initialValues` — misleads, because a *changed* prefill value is applied later
  too (see decision 4).
- A separate `setPrefill`/event-based API — more surface for the same behavior; the existing
  `setFields` precedent makes a prop/method pair the consistent choice.

### 2. Values reach fields as a new `initialValue` prop on `wb-form-field`

`wb-form-field` gains `@Prop() initialValue?: string`, applied in `componentWillLoad()` and via
`@Watch('initialValue')` to seed the field's internal `value` / `checked` / `selectHasChoice`
state. The renderer forwards `this.values?.['field.' + id]` for every rendered data field,
including children inside row containers.

Alternatives considered:

- **Imperative assignment** (`el.value = …` after render, or `querySelector` into the shadow
  root): races with Stencil's async render, duplicates renderer knowledge of field internals, and
  is invisible to the vdom diff.
- **Make `value` a mutable `@Prop`**: would put user typing and host prefill into one channel,
  so any parent re-render that re-sets the prop can clobber what the user typed. `initialValue`
  is a distinct channel ("what the host last asked for") from `value` ("what the user has now").

`initialValue` values are raw strings from the prefill object; the field interprets them per
control type:

| Control | Prefill application |
| --- | --- |
| `text` (any subtype), `date`, multiline `text` | `value = initialValue` |
| `select` | select the option whose `key === initialValue` (`selectHasChoice = true`); no match → stay in the hint/empty state, value `''` |
| `checkbox` | `checked = initialValue === 'on'`; any other value → unchecked |
| `richtext` | parse as Tiptap JSON doc and load into the editor (see decision 5) |

`undefined` means "no prefill for this field" and is a no-op — which is why the prop type is
`string | undefined`, not `string` defaulting to `''`.

### 3. Renderer normalization and unknown-key reporting

- Normalization: primitive non-string values are coerced with `String()`; `null`/`undefined`
  entries are treated as absent (never `"null"`).
- Known names: the renderer walks its rendered data fields (including row-container children) to
  build the set of valid `field.<id>` names.
- Unknown keys: ignored, then reported with `console.warn('<wb-form-renderer>: ignoring prefill
  value for unknown field "<key>"'). Warnings are deduplicated per prefill application (reset
  when `values` changes) and are skipped while `fields` is empty, so a host that sets `values`
  before `fields` does not get a burst of spurious warnings. `componentDidLoad` covers the
  "props set before first render" ordering; `@Watch('values')` covers later changes.
- There is deliberately no warning channel beyond the console: the renderer is framework-agnostic
  and adding an event would expand the public API for a diagnostic.

### 4. Application timing (no clobbering)

Prefill is applied when the field node is created (`componentWillLoad`) or when the
`initialValue` prop actually changes (`@Watch` compares strings, so Stencil's `!==` check is
enough). Consequences:

- Ordinary re-renders (`setFields`, canvas edits) recompute the same strings → watcher does not
  fire → user edits survive.
- A *changed* prefill entry replaces the field's current value — that is the point of a prefill
  input the host controls.
- Removing a key from the prefill object leaves the field's current value untouched (absence is
  not a signal to clear); native form reset remains the way to empty the form.

### 5. Rich text prefill

- `initialValue` is the already-submitted JSON document string, so no host-side serialization is
  needed.
- In `componentDidLoad()`, the parsed doc is passed as Tiptap's `content` when constructing the
  editor, avoiding a second transaction.
- On a later `initialValue` change, `editor.commands.setContent(doc, { emitUpdate: false })` runs,
  followed by an explicit `sync()` so `setFormValue` reflects the new doc without a redundant
  update cycle.
- Document validation: reuse the existing `parseStoredValue` helper (returns `null` for malformed
  or non-doc JSON); a `null` result leaves the current content as-is, logs a warning, and never
  throws. Structurally empty docs (`isEmptyDoc`) keep `''` as the form value, consistent with
  existing serialization.

### 6. Harness round trip

Add a "Prefill from JSON" textarea + button bound to `renderer.setValues(...)`; `JSON.parse` in a
try/catch reports failures into the existing `#out` block without touching the form. The button
reuses the same visual pattern as the existing "Load into canvas" import control.

## Risks / Trade-offs

- **Richtext editor readiness** — prefill for richtext only exists after `componentDidLoad`; unit
  tests must await the editor mount. Mitigation: apply at editor construction and assert through
  the submitted `FormData`/editor state rather than assuming synchronous content.
- **`setContent(..., { emitUpdate: false })` desync** — skipping the update cycle means `sync()`
  must be called explicitly; forgetting it leaves a stale form value. Mitigation: a unit test that
  prefills, then reads the submitted JSON string.
- **Unmatched `select` prefill silently empties** — a stale key in the saved payload renders as
  "no selection" rather than an error. Trade-off accepted to keep the unknown-key rule narrow
  (it is a valid field key, just an unknown option); hosts that change options must clean their
  data. Documented in README.
- **External prefill overwrites user input by design** — a host that re-sends a changed `values`
  object wins over the user's edits. Mitigation: documented contract; hosts control when they
  call `setValues`.
- **Warning noise** — a large stale payload logs one warning per unknown key. Mitigation:
  deduplicated per application and skipped while `fields` is empty.
- **Checkbox truthiness surprises** — only the serialized `'on'` checks the box; `true`/`1`/
  `'yes'` do not. Trade-off chosen for exact round-trip fidelity; documented in README.

## Migration Plan

Purely additive: new optional prop/method and a new optional field prop, no behavior change for
existing consumers. Stencil build regenerates `src/components.d.ts` and the React wrapper's
`components.ts`, so `WbFormRenderer` gains `values`/`setValues` without hand edits. Both packages
get a changeset (minor bump). Rollback is deleting the prop/method usage — saved payload shapes
stay the same.

## Open Questions

None.
