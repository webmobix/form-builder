# Proposal

## Why

The inspector renders a fixed set of built-in property controls. Hosts that need extra per-element settings (analytics flags, PII markers, layout hints) have no way to add them without forking the component. They need to declare additional controls and have the values travel with each element through export/import.

## What Changes

- Add a host-supplied **extension shape** to `wb-inspector` via a new `extension` prop and `setExtension(shape)` method. The shape declares extra controls, split by element kind (`data` vs `design`), as titled sections of entries.
- Support one built-in entry kind today: `checkbox` (`type: 'checkbox'`) with `key`, `label`, and optional `defaultState` (absent means unchecked). The entry `type` is a discriminated union so more kinds can be added later without changing the shape.
- Render every declared entry at the end of the inspector form (after built-in controls, before Delete), for the selected element's kind.
- Persist each entry's state under a new `FieldMeta.metadata` map, keyed by the entry's `key`. Values are read from `metadata[key]` when present, otherwise from `defaultState`.
- On selection, seed any declared key that is missing from `metadata` with its `defaultState` (Option A), so a selected element always carries a complete metadata map for its kind.
- Preserve unknown `metadata` keys on patch and round-trip; metadata is presentation-only and never affects validation or form rendering.

## Capabilities

### New Capabilities
- `inspector-extensions`: host-declared, per-element-kind extension sections that `wb-inspector` renders after its built-in controls and that read/write per-element `metadata`.

### Modified Capabilities
- `field-properties`: `FieldMeta` gains an optional `metadata` map for host/extension-owned per-element values; it is preserved across updates and export/import and does not participate in validation or rendering.

## Impact

- `packages/form-components/src/core/types.ts` — add `metadata?: Record<string, unknown>` to `FieldMeta`; add the `InspectorExtension` shape types.
- `packages/form-components/src/components/wb-inspector/` — new `extension` prop + `setExtension()` method, seeding on selection, and extension-section rendering.
- Generated Stencil wrapper types (`components.d.ts`, `packages/form-components-react/src/components/components.ts`) pick up the new prop/event surface on build.
- `wb-canvas` patch path already spreads `Partial<FieldMeta>`, so `metadata` patches need no canvas change beyond relying on full-map patches.
- `wb-form-renderer` reads named props only, so `metadata` is ignored there.
- No dependency or breaking changes; the feature is inert until a host supplies an extension shape.
