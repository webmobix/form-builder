## Context

The canvas (`wb-canvas`) keeps an ordered `fields: FieldMeta[]` array and tracks the selected component via `@State() selectedId: number | null`. Palette clicks flow through the host: the palette emits `wbAddField` with `{ type, label }`, and the host calls `canvas.addField(type, label)`, which unconditionally appends to the end.

A separate drag-and-drop flow inserts at an arbitrary index via `commitExternalInsert`, which splices at `hoverIndex`. This change extends the click path so the insertion position follows the current selection.

## Goals / Non-Goals

**Goals:**
- A palette click inserts the new field immediately after the currently selected component.
- With nothing selected, a palette click appends to the end (unchanged).
- The newly added field becomes the newly selected component.
- Keep the `wbAddField` event contract unchanged; the palette stays position-agnostic.

**Non-Goals:**
- No change to the drag-and-drop flow, `commitExternalInsert`, or `setExternalHoverIndex`.
- No change to `wbAddField` payload or the palette component's responsibilities.
- No reordering of existing fields (that remains the drag handle's job).

## Decisions

### D1: Add an insertion method on the canvas rather than overloading `addField`
A new `@Method()` `addFieldAfter(type, label)` on `WbCanvas` inserts at the computed position. `addField` stays append-only to preserve its existing public contract and the "stable-key discipline" documented in the source. The host calls the new method from the existing `wbAddField` listener.

Rationale: Keeps `addField` behavior predictable and avoids changing the meaning of an existing public method. Alternative (passing an optional index to `addField`) was rejected because it changes the method signature and risks breaking existing callers.

### D2: Compute insertion index from `selectedId`
Inside `addFieldAfter`, if `selectedId !== null`, find its index in `fields` and insert at `index + 1`. Otherwise append (index = `fields.length`).

```ts
const idx = this.selectedId !== null
  ? this.fields.findIndex((f) => f.id === this.selectedId) + 1
  : this.fields.length;
const next = [...this.fields];
const field = { id: ++uid, type, label };
next.splice(idx, 0, field);
this.fields = next;
```

Rationale: Reuses the existing splice pattern already proven in `commitExternalInsert`, and the selection state is already authoritative and maintained by the canvas. The new field's id comes from the shared `++uid` source.

### D3: Select the newly added field
After updating `fields`, set `this.selectedId = field.id` and emit `wbFieldSelected` with the new field so the inspector updates.

Rationale: After inserting "after the selected component", the new component is the natural thing to continue editing. This mirrors the inspector flow already wired to `wbFieldSelected` in the host. Alternative (leaving the original selection) was rejected because the user just acted on the new field.

### D4: Host wiring change only
The palette is unchanged. In `index.html`, the `wbAddField` listener switches from `canvas.addField(...)` to `canvas.addFieldAfter(...)`. No new events, no palette changes.

Rationale: Keeps the palette's "emit, don't position" contract intact, and the canvas owns all state (selection + list), so it is the correct place to decide position.

## Risks / Trade-offs

- [Inserting after a deselected-then-imported state] If `selectedId` points to a field no longer present after `importState`, `findIndex` returns `-1`, so `index + 1` = `0`, inserting at the front unexpectedly. → Mitigation: when `selectedId` is `null` or its field is not found, fall back to appending at the end.
- [Selection semantics change for the whole app] Click-to-add now mutates selection, which is a new behavior the inspector reacts to. → Mitigation: this is desired; update unit tests and the dev-harness smoke instructions accordingly.
- [Test coverage of the modified `palette-drag` requirement] The archived spec previously mandated append-only click behavior. → Mitigation: the delta spec (MODIFIED) documents the new selection-aware behavior; update `wb-canvas.unit.test.tsx` and `wb-palette.unit.test.tsx`.

## Migration Plan

1. Add `addFieldAfter` method to `wb-canvas.tsx`.
2. Update `index.html` `wbAddField` listener to call `addFieldAfter`.
3. Add/adjust unit tests in `wb-canvas.unit.test.tsx` and update the dev-harness instructions in `index.html`.
4. Regenerate `components.d.ts` (via the project's Stencil build) so the new public method is reflected.

Rollback: revert the `index.html` listener to call `addField`; the append behavior is fully restored with no state changes.

## Open Questions

- None blocking. Whether `addFieldAfter` should be a separate method vs. replacing `addField` is settled (D1). Selection-on-add behavior is defined by the spec (new field becomes selected).
