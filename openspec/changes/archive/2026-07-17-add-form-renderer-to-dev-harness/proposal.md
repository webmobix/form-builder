## Why

The dev harness at `packages/form-components/src/index.html` is the manual smoke-test page for the form builder, but it only renders the **builder** (palette + canvas + inspector). There is no live preview of the form the canvas is actually producing: the `wbChange` payload is dumped as raw JSON into a `<pre>` block, and the only rendered input is a single hardcoded standalone `wb-form-field`. Users cannot see how the fields they configured on the canvas will render as an actual form (labels + inputs) that someone filling the form out would see. We need a renderer so the configured fields can be previewed and submitted end-to-end from JSON config.

## What Changes

- Add a **form renderer** to the dev harness that takes the `wbChange` field list (the `FieldMeta[]` JSON config produced by `wb-canvas`) and renders an actual `<form>` with a label + input for each field, re-rendering whenever the canvas changes.
- Render one `wb-form-field` per `FieldMeta` entry, forwarding `name`, `label`, `type`, `subtype`, `required`, and `restrictions` from the JSON config to the field component.
- Assign each rendered field a stable `name` derived from its field id (e.g. `field.<id>`) so submitted FormData keys are unambiguous and round-trippable.
- Wire the renderer into the existing `wbChange` listener in `index.html` so the rendered form updates live as the user adds/edits/reorders fields on the canvas.
- On form submit, the renderer form produces a FormData payload keyed by the configured field names, surfaced in the existing `#out` dump (or a dedicated preview-output block).
- No new Stencil component is strictly required for the renderer: it can be a small host-page renderer that stamps `wb-form-field` elements from the JSON config. If a dedicated `wb-form-renderer` component is added, it lives in `packages/form-components/src/components/wb-form-renderer/` and exposes a `setFields(fields: FieldMeta[])` method plus a `wbSubmit` event.
- The standalone hardcoded `wb-form-field` in the harness is replaced by the renderer so the page shows exactly the configured form.

## Capabilities

### New Capabilities
- `form-renderer`: A renderer that consumes a `FieldMeta[]` JSON config (the same payload `wb-canvas` emits via `wbChange`) and renders an actual fillable `<form>` with a label + input per field, re-rendering on config changes and emitting a submit payload keyed by the configured field names.

### Modified Capabilities
<!-- No existing spec-level capability changes; palette-drag and field-properties cover the builder side. The renderer is a new capability that consumes the builder's output. -->

## Impact

- **New component (optional but recommended)**: `wb-form-renderer` in `packages/form-components/src/components/wb-form-renderer/` — a Stencil component that accepts `fields: FieldMeta[]`, renders `wb-form-field` children inside a `<form>`, and emits `wbSubmit` with the collected FormData.
- **Modified host page**: `packages/form-components/src/index.html` — replace the standalone `wb-form-field` block with `<wb-form-renderer id="renderer"></wb-form-renderer>`, wire `wbChange` → `renderer.setFields(...)`, and surface submit output.
- **Reused component**: `wb-form-field` already supports `name`, `label`, `type`, `subtype`, `required`, `restrictions` and form-association; the renderer forwards these props from the `FieldMeta` JSON config without modifying `wb-form-field`.
- **Core types**: No change to `form-core/src/types.ts` — the renderer consumes the existing `FieldMeta[]` shape.
- **Tests**: new unit tests for `wb-form-renderer` (renders N fields from config, forwards props, emits submit payload keyed by name); extend harness smoke checks if any.