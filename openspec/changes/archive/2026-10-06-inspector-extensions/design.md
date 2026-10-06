# Design

## Context

See `proposal.md` and the spec deltas under `specs/`. Current constraints that shape the approach:

- `wb-canvas` owns the single `FieldMeta[]`; the inspector clones the selected field into `localField`, renders controls, and emits `wbFieldUpdated({ id, patch })`. The canvas applies patches with `{ ...current, ...patch, id }` (`applyFieldPatch`), so a `metadata` patch is a full-map replacement.
- The inspector already branches on `f.kind === 'design'` and has `isDataElement` / `isDesignElement` helpers. That is the natural seam for per-kind shapes.
- `wb-form-renderer` reads named `FieldMeta` props and ignores unknown ones, so `metadata` is inert there by construction.
- The host wires components through public `@Method()`s and `CustomEvent`s (see `packages/form-components/src/index.html`). Complex object props are set as JS properties, not attributes.

## Goals / Non-Goals

**Goals:**

- A host can declare extra inspector controls as plain data, split by element kind, and have values persist on each element and round-trip through export/import.
- The entry model is open: adding a control kind later is a new union member and a render branch, not a shape change.
- No change to how forms validate or render.

**Non-Goals:**

- Conditional visibility of entries, entry-level validation, required extension fields, or arbitrary host render callbacks.
- Per-`type`/per-`designType` shapes (only per element `kind` for now).
- Runtime schema validation of the host-supplied shape; malformed shapes degrade gracefully.

## Decisions

### Declarative data shape over render callbacks

The host supplies data; the inspector owns rendering. A callback/renderer API would be more flexible but breaks serialization, React-wrapper typing, and the existing event/method composition. The union discriminator (`type`) keeps it open-ended.

### Per-kind map: `{ data?, design? }`

The inspector picks `extension[kind]` where `kind` is `'design'` or `'data'` (`isDesignElement`). A single flat list with an `appliesTo` field was considered; the per-kind map is less error-prone and mirrors the existing render branch.

```
InspectorExtension
  +-- data?:   Section[]   -> rendered when kind is absent or 'data'
  +-- design?: Section[]   -> rendered when kind === 'design'

Section
  +-- title?:  string
  +-- fields:  Entry[]     // always rendered

Entry (discriminated on `type`)
  +-- type: 'checkbox'     // union grows here
  +-- key: string          // -> field.metadata[key]
  +-- label: string
  +-- defaultState?: boolean
```

### Flat `metadata` map on `FieldMeta`

Keys map directly to `FieldMeta.metadata[key]`; section titles are presentation-only and do not nest the storage. Nesting under section ids was rejected as unnecessary coupling — keys are documented unique per kind instead.

### Entry discriminator named `type`

Matches JSON-Forms-style control schemas and reads naturally in the shape. `kind` was rejected because `FieldMeta.kind` already means data/design; `control` was rejected as a new vocabulary word with no reuse elsewhere.

### Option A: seed missing keys on selection

On `setField` (and when the shape changes while selected), the inspector computes the declared entries for the element's kind, seeds any `undefined` key with `defaultState ?? false`, and emits **one** `wbFieldUpdated` with the complete map if anything was written. If nothing was missing, no event is emitted.

```
setField(field):
  localField = { ...field }
  sections   = extension[kindOf(field)] ?? []
  seed       = { ...(field.metadata ?? {}) }
  changed    = false
  for section in sections, entry in section.fields:
      if seed[entry.key] === undefined:
          seed[entry.key] = entry.defaultState ?? false
          changed = true
  if changed:
      localField.metadata = seed
      emit wbFieldUpdated { id, patch: { metadata: seed } }
```

Trade-off accepted: selecting an element can now mark the payload changed on first selection. The alternative (seed on first touch) was rejected per product decision — a selected element always carries a complete metadata map for its kind.

### Full-map patches

Toggles emit `{ metadata: { ...localField.metadata, [key]: checked } }`. The canvas replaces the map wholesale, so the inspector must always include undeclared keys it wants to keep. Building from `localField` (which already contains unknown keys from the selected field) satisfies this.

### Extensibility via a render registry

`render()` switches on `entry.type`; an unrecognized type renders nothing. Adding a kind later means adding a union member, a render branch, and (if needed) a coercion rule for its stored value. No shape or wiring change.

## Risks / Trade-offs

- [Selection emits a change] → Only emitted when a key is actually missing, so it happens at most once per declared key and never for a complete element. Documented as intended behavior.
- [Feedback loop: seeding emits from `setField`] → The host's `wbChange` handler updates payload/renderer only and never calls `setField`; seeding also runs only on selection or shape change. No loop.
- [Stale metadata when the shape drops a key] → Unknown keys are preserved on purpose; unrendered keys stay in the payload for forward compatibility.
- [Changing a default after selection has no effect] → Consequence of Option A persisting values. A host that wants a new default to apply must clear or migrate existing metadata.
- [Complex prop needs property assignment] → Document that `extension` is set as a JS property / via `setExtension()`, not an HTML attribute; generated wrappers expose it as a React prop.
- [Duplicate keys silently overwrite] → Contract documents keys as unique per kind; last declaration wins.
- [External metadata edits not reflected until reselect] → The inspector holds a clone; it refreshes on the next `setField`. Acceptable in the current single-writer model.

## Migration Plan

None. `metadata` and `extension` are optional and additive; existing payloads, hosts, and specs are unchanged. Rollback is removing the host's shape, which leaves already-seeded `metadata` in exported payloads as inert data.

## Open Questions

None blocking. Deferred: additional entry kinds, entry-level validation, and finer shape resolution (per `designType` / field `type`) can be added later without changing this model.
