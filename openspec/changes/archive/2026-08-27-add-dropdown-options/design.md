## Context

See `proposal.md - Why` for motivation. The `select` field is a `FieldMeta` with `type: 'select'`; today it flows through the palette → canvas → inspector → renderer pipeline and falls through to a text `<input>` in `wb-form-field` because the render path has no `select` branch. Fields are owned by `wb-canvas`, edited through `wb-inspector` patches (`wbFieldUpdated` → `updateField`), and rendered by `wb-form-field` (form-associated, value pushed via `ElementInternals.setFormValue`). The submission contract is a flat `Record<string, string>` from `FormData`.

## Goals / Non-Goals

**Goals:**
- Add an `options?: { key: string; label: string }[]` property to `FieldMeta` for `select` fields, with the editor UI using the same value for `key` and `label`.
- Render a native `<select>` with `<option>` children in `wb-form-field` and submit the chosen option's key through the existing FormData flow.
- Provide an inspector Options editor (add / remove / edit options) that patches the canvas via the existing `wbFieldUpdated` mechanism.
- Forward `options` through `wb-form-renderer` and the `wb-canvas` preview.

**Non-Goals:**
- Multi-select, optgroups, or option keys that differ from their labels.
- Wiring `dataSchema`/`FormDefinition` or generating a JSON Schema `enum`.
- A placeholder/"choose one" option; required-dropdown semantics come from existing `required` validation.
- Reordering options via drag; options are edited in place and appended.

## Decisions

### D1: `options` is an array of `{ key, label }` objects on `FieldMeta`
Each option carries a `key` (the submitted value) and a `label` (the displayed text). In the editor UI both are set to the same string so the builder edits a single value per option.
*Why:* matches the JSON Schema `enum`/value concept while being forward-compatible — a later change can let builders set a display label that differs from the submitted key without reshaping the data.
*Alternatives considered:* flat `string[]` — rejected because changing the shape later would be a breaking change; a `{ value, label }` shape from the start avoids that.

### D2: `wb-form-field` renders a native `<select>` for `type === 'select'`
A dedicated render branch that emits `<select>` + mapped `<option>` elements, bound to the existing `@State() value` and the `onInput` handler, with the same required/disabled handling as inputs.
*Why:* reuses the existing form-associated plumbing and `sync()`; the `<select>` participates in `FormData` natively, so `setFormValue` and required validation work unchanged. The option's `value` attribute is set to its `key`, so the submitted value is the key. A native element avoids a dependency and accessibility work.
*Alternatives considered:* a custom dropdown primitive — rejected (no UI library exists in the repo and native select satisfies the spec).

### D3: `wb-inspector` manages options as a local array patched wholesale
The inspector keeps an editable list of option inputs; any add/remove/edit recomputes the full ordered `options` array and emits a single `wbFieldUpdated` patch with `{ options: [...] }`. Canvas `applyFieldPatch` already merges the patch wholesale.
*Why:* reuses the existing patch contract (`{ id, patch }`) without a new event or a diff of individual option indexes.
*Alternatives considered:* per-option events — rejected, more surface area with no benefit over whole-array patches.

## Risks / Trade-offs

- **Empty options produce an empty dropdown** → acceptable; builder adds options via the inspector, and an empty required dropdown fails validation as expected.
- **Inspector must keep a local copy in sync with `setField`** → the inspector already snapshots `field` into `localField`; options are edited against `localField` and patched out, matching the existing label/restrictions pattern.
