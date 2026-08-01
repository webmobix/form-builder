## Why

The builder canvas currently only builds from an empty state — fields are added one-by-one via the palette. To support editing existing forms, restoring previous sessions, or loading templates, the builder must be able to accept a previously-saved `FieldMeta[]` JSON payload and hydrate its state from it. Without this, every form has to be reconstructed from scratch every time the page reloads or a user returns to a form.

## What Changes

- Add a `fields` prop and `setFields(fields: FieldMeta[])` public method to `wb-canvas` so a host page can load an existing field configuration into the canvas.
- Add an `importState(payload: FieldMeta[])` public method to `wb-canvas` (alias/extension of `setFields`) that hydrates the canvas from a JSON payload, resetting selection and emitting `wbChange`.
- The canvas SHALL sync its internal `uid` counter to `max(field.id) + 1` from the imported payload so subsequent `addField` calls do not collide with existing ids.
- The canvas SHALL clear any current selection on import (emit `wbFieldDeselected` if a field was selected).
- Extend the dev harness (`src/index.html`) with an import affordance: a file input + textarea + "Load" button that parses JSON and calls `canvas.importState(...)`.
- The dev harness SHALL also include a "Export" button that dumps the current builder payload as downloadable JSON (mirrors "Dump builder payload" but as a file), so users can round-trip save → reload.

## Capabilities

### New Capabilities
- `builder-state-import`: Loading an existing `FieldMeta[]` JSON payload into the `wb-canvas` builder to hydrate/restore a prior builder state, including id-counter sync, selection reset, and malformed-input guarding.

### Modified Capabilities
<!-- None. There is no existing wb-canvas spec in openspec/specs/; the canvas's new hydration behavior is captured entirely under the new builder-state-import capability. -->

## Impact

- **Code**: `packages/form-components/src/components/wb-canvas/wb-canvas.tsx` — add `@Prop() fields`, `@Method() setFields`, `@Method() importState`, internal `uid` resync, selection-clear logic.
- **Dev harness**: `packages/form-components/src/index.html` — add import/export UI and wiring.
- **Tests**: New unit/browser tests in `form-components` covering import of a payload, uid continuity, and selection reset.
- **APIs**: New public methods on `wb-canvas` (`setFields`, `importState`) — additive, no breaking changes.
- **Dependencies**: None added.