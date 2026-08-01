## Context

`wb-canvas` holds the builder's field list as `@State() fields: FieldMeta[]` and emits `wbChange` on every mutation. Today it only ever grows from a hardcoded two-field seed (`Name`, `Email`) via `addField` / palette drops / reorder. A module-level `let uid = 0` monotonically assigns ids (`++uid`); the canvas never receives an external field list.

The renderer (`wb-form-renderer`) already accepts a `fields` prop and a `setFields()` method, proving the hydration pattern in this codebase. The canvas has no equivalent. To support edit-existing-form, restore-session, and template-loading flows, the canvas needs the same hydration capability.

Stakeholders: form-builder host pages (dev harness today, future React/Preact wrappers), end users returning to a saved form.

## Goals / Non-Goals

**Goals:**
- Hydrate `wb-canvas` from a `FieldMeta[]` JSON payload via a public method.
- Keep id stability: imported ids preserved as-is, no remapping.
- Keep the module-level `uid` counter collision-free after import (next `addField` must not reuse an imported id).
- Reset selection on import and emit the appropriate deselect/change events so host page state stays consistent.
- Add import + export affordances to the dev harness for round-trip testing.
- Additive only — no breaking changes to existing add/update/reorder/select behavior.

**Non-Goals:**
- Versioned/migration payloads (no schema version field, no `v1`→`v2` transforms). Payload is a raw `FieldMeta[]` matching the current type.
- Server-side persistence / autosave. Import/export is client-side JSON only.
- Validating the imported payload against JSON Schema beyond structural `FieldMeta` shape checks (the existing `form-core` validator is for rendered form values, not builder payloads).
- Importing UI-schema-only or partial payloads; the payload is the full field list and replaces the canvas contents wholesale.

## Decisions

### Decision 1: `importState(fields)` replaces canvas contents wholesale
**Choice**: `importState(fields: FieldMeta[])` sets `this.fields = fields` (after a shallow structural check), resets `selectedId` to `null`, resyncs `uid`, and emits `wbChange` + (if something was selected) `wbFieldDeselected`.

**Alternatives considered**:
- *Merge/append import* — rejected; ambiguous id collision semantics and complicates the common "load this form" case. Wholesale replace matches the renderer's `setFields` semantics and is the simplest correct behavior. A future `appendFields` can be added if needed.
- *Two methods (`setFields` imperative + `fields` prop reactive)* — the renderer has both, but the canvas's `fields` is `@State` (internal), not `@Prop`. Promoting it to `@Prop` would create prop/state conflict and break the existing mutation flow. We expose `importState` as the single hydration entry point and leave `@State fields` internal. (We do NOT add a `fields` `@Prop` despite the proposal mentioning one — on inspection `@State` + `@Prop` on the same name is invalid in Stencil. The proposal's "fields prop" is realized as the `importState` method instead.)

### Decision 2: Resync `uid` to `max(imported ids) + 1`
**Choice**: After assignment, compute `uid = Math.max(...fields.map(f => f.id), uid)` so the module counter never goes backwards and never collides with imported ids.

**Rationale**: `uid` is module-level (shared across all `wb-canvas` instances in a page). Lowering it would risk reuse; `Math.max` with the current value guarantees monotonic increase across multiple canvases/imports. Using `Math.max(...ids, uid)` (not just `Math.max(...ids)`) preserves counter continuity if a host imports into a canvas that already has high-id fields.

**Alternatives**:
- *Per-instance counter* — would require refactoring `uid` from module-level to instance state and threading it through every `++uid` site. Larger change, and the current module-level design is intentional (single global id space for a page). Rejected for this change.
- *Remap imported ids to fresh sequential ids* — breaks the "ids stable" goal and the renderer's `field.<id>` name mapping. Rejected.

### Decision 3: Lightweight structural validation in `importState`
**Choice**: `importState` SHALL guard against non-array input and entries missing `id`/`type`/`label`, returning early (no-op) on failure. No deep JSON-Schema validation.

**Rationale**: Host pages may paste arbitrary JSON in the dev harness; a silent no-op is safer than a half-hydrated canvas. Full validation belongs in `form-core` if anywhere and is a Non-Goal here. A no-op on bad input is testable and predictable.

### Decision 4: Dev harness uses a textarea + Load button (not just file input)
**Choice**: Add a `<textarea>` for pasting JSON, a file `<input type="file">` for loading a `.json`, and a "Load into canvas" button. Also add "Export JSON" (downloads current payload) alongside the existing "Dump builder payload".

**Rationale**: Textarea enables quick paste-and-load during dev; file input enables round-trip with saved files. Both feed the same `canvas.importState(JSON.parse(...))` path.

### Decision 5: Export is a separate button, not a replacement of "Dump"
**Choice**: Keep "Dump builder payload" (writes to `#out` `<pre>`). Add "Export JSON" that triggers a `Blob` download of `lastBuilderPayload`.

**Rationale**: Dump is for inline inspection; export is for persistence. Different intents, both useful in the harness.

## Risks / Trade-offs

- **[Module-level `uid` shared across canvas instances]** → `Math.max(...ids, uid)` keeps it monotonic globally; documented as intentional. If multi-canvas independent id spaces ever become a requirement, refactor to per-instance counter in a follow-up.
- **[Import of malformed JSON throws in the harness]** → Wrap `JSON.parse` in try/catch in the harness; show an error message in `#out` instead of silently failing. `importState` itself guards against non-array input.
- **[Large payloads]** → No virtualization today; canvas renders all rows. Out of scope for this change (existing limitation). Import doesn't make it worse than adding the same fields manually.
- **[Id gaps / non-numeric ids]** → `FieldMeta.id` is `number`; `importState` trusts the payload's numeric ids. Non-numeric or negative ids would produce `NaN` in the `Math.max` resync — guarded by the structural check (entries must have a numeric `id`).