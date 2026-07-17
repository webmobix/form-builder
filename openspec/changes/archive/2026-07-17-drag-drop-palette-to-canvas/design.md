## Context

`form-builder` is a StencilJS Web Components monorepo. The form authoring surface is two custom elements wired together by the dev harness `packages/form-components/src/index.html`:

- `wb-palette` (`wb-palette.tsx`): a vertical list of field-type buttons. The only add path is a click that emits `wbAddField` (`wb-palette.tsx:34,40`).
- `wb-canvas` (`wb-canvas.tsx`): holds `fields: FieldMeta[]`, exposes `@Method() addField(type, label)` which is **append-only** (`wb-canvas.tsx:43-47`), and already implements a full pointer-based reorder drag with `setPointerCapture`, a `position:fixed` ghost on `document.body`, an insertion-index calculator (`getInsertionIndex`, `:49-57`), a drop indicator driven by `hoverIndex` (`:32`), and edge auto-scroll (`:90-103`).

No drag-and-drop library is used; all DnD is custom Pointer Events code. There is no mobile/desktop detection in the runtime today — tap-to-add works identically on both, and mobile/desktop shells are deferred (unbuilt).

Two hard constraints from the codebase README and `wb-canvas.tsx` comments:
1. Rows are keyed by stable `f.id` (`wb-canvas.tsx:132`) because a full re-render destroys pointer-captured DOM mid-drag. Any new insertion path must preserve this.
2. A drag from the palette starts in `wb-palette`'s shadow DOM and must locate canvas rows across two shadow boundaries.

## Goals / Non-Goals

**Goals:**
- A desktop user can press a palette item and drag it onto the canvas, releasing to insert the field at the position indicated by the existing drop indicator.
- The drag shows a floating ghost preview following the pointer, consistent with the existing reorder ghost.
- The live drop indicator (`hoverIndex`) is driven during a palette drag so the user sees where the field will land.
- Tap/click-to-add on mobile (coarse pointers) is unchanged — drag initiation is gated to desktop-class pointers.
- No new third-party dependency.

**Non-Goals:**
- Dragging existing canvas rows *from the palette* (palette is a source of new fields only).
- Cross-shell responsive behavior (the mobile FAB-and-sheet shell and desktop three-pane shell remain unbuilt).
- Multi-select or multi-field drag.
- Dropping outside the canvas (dropped elsewhere = cancel, no field added).
- Changing the `wbAddField` event contract or the click-to-add append behavior.
- Touch drag from the palette on mobile (tap-to-add remains the mobile path).

## Decisions

### Decision 1: Reuse the canvas's pointer-ghost pattern, initiated from the palette
**Choice:** `wb-palette` starts the drag on `pointerdown` (desktop only — see Decision 3), creates a `position:fixed` ghost on `document.body` (same technique as `wb-canvas.tsx:64-71`), and tracks `pointermove`/`pointerup` on `window`.

**Why:** The canvas already proves this pattern works across shadow boundaries (the ghost lives in light DOM). Reusing it keeps one DnD mental model and one ghost styling language. `setPointerCapture` on the palette button captures the pointer so moves are delivered even if the cursor leaves the button.

**Alternatives considered:**
- *HTML5 drag-and-drop (`draggable`/`dragstart`/`drop`):* Rejected — DnD API is unreliable across shadow boundaries, has poor mobile support, and the codebase already committed to Pointer Events for reorder.
- *A shared "drag controller" module imported by both components:* Tempting for reuse, but the two drags have different initiators (palette item vs. canvas grip) and different commit semantics (insert new vs. move existing). Premature to abstract now; instead keep the cross-component coordination via events/methods (Decision 2) and extract a shared helper later if duplication grows.

### Decision 2: Coordinate palette→canvas via new public `@Method`s on `wb-canvas`, not a shared store
**Choice:** Add two public methods to `wb-canvas`:
- `beginExternalDrag()` — sets a flag that an external drag is active; the canvas uses its existing `getInsertionIndex` to update `hoverIndex` on demand.
- `setExternalHoverIndex(y: number)` — given a viewport `y`, computes and sets `hoverIndex` (and runs `autoScrollCheck`).
- `commitExternalInsert(type, label)` — inserts the new field at the current `hoverIndex` (or appends if `hoverIndex` is null), emits `wbChange`, clears the external-drag flag and `hoverIndex`.
- `cancelExternalDrag()` — clears the flag and `hoverIndex` without inserting.

`addField(type, label)` stays append-only for the click path.

**Why:** The canvas already owns `hoverIndex`, `getInsertionIndex`, and `autoScrollCheck`. Exposing them through methods keeps the insertion logic in one place, avoids duplicating row-geometry hit-testing in the palette, and respects the shadow-DOM encapsulation of `wb-canvas`. The host (`index.html`) wires palette drag events to these methods — same wiring pattern already used for `wbAddField` → `addField`.

**Alternatives considered:**
- *Palette drives `hoverIndex` directly by reaching into the canvas's shadow DOM:* Violates encapsulation and couples to row CSS (`[data-row]`).
- *Palette emits a `wbDragOver` event with `y` and the host computes the index:* Duplicates `getInsertionIndex` in the host. Worse, not reusable.
- *Generalize `addField` to take an optional `index`:* Keeps one method but mixes the click (append) and drag (indexed) semantics; click callers must consciously pass "end". The dedicated `commitExternalInsert` keeps each path explicit.

### Decision 3: Gate drag initiation on fine-pointer / mouse input
**Choice:** In `wb-palette`, only start a drag when `pointerdown` has `pointerType === 'mouse'` OR `matchMedia('(pointer: fine)')` matches. Otherwise, let the event fall through to the existing click→`wbAddField` path.

**Why:** Mobile users get tap-to-add (already proven). A touch-initiated palette drag would conflict with page scroll/zoom gestures and would require `touch-action: none` on the whole palette item, harming mobile usability. Gating at initiation avoids needing a full responsive shell.

**Alternatives considered:**
- *Always allow drag on any pointer type with `touch-action: none` on items:* Harms mobile scroll; not the goal.
- *Feature-detect only via `pointer: fine`:* Misses desktop-with-touchscreen cases where the user uses a finger. Acceptable: such users can still tap-to-add.

### Decision 4: Cross-shadow hit-testing is delegated to the canvas
**Choice:** The palette does not perform `elementFromPoint` to find canvas rows. It sends viewport coordinates (`clientX`, `clientY`) to `wb-canvas.setExternalHoverIndex(y)`. The canvas reads its own `[data-row]` children (inside its shadow DOM) via its existing `listEl` ref and `getBoundingClientRect`.

**Why:** Keeps shadow encapsulation. The canvas already has `getInsertionIndex(y)` operating on its own rows (`wb-canvas.tsx:49-57`); we reuse it. The palette only needs to know "is the pointer over the canvas region?" to decide whether to forward coordinates — and even that can be delegated by simply always calling `setExternalHoverIndex`, with the canvas clamping `hoverIndex` to `null` when `y` is outside its list bounds.

### Decision 5: Ghost lives in light DOM, styled to match the reorder ghost
**Choice:** The palette appends its ghost to `document.body` and removes it on `pointerup`/`pointercancel`, mirroring `wb-canvas.tsx:64-71`/`105-121`. Ghost shows the field `label`.

### Decision 6: Stable id generation is owned by the canvas
**Choice:** `commitExternalInsert(type, label)` allocates `++uid` inside `wb-canvas` (same `uid` source as `addField`), so stable-key discipline and id uniqueness stay in one place.

## Risks / Trade-offs

- **[Risk] Pointer capture on a button that re-renders mid-drag could drop moves.** → Mitigation: capture on the palette item, and the palette's `FIELD_TYPES` list is static, so the item DOM is stable; additionally we listen on `window` for move/up as a fallback (matching the canvas approach).
- **[Risk] Cross-shadow drop indicator fails if canvas rows change under a palette drag (e.g. concurrent `addField`).** → Mitigation: `beginExternalDrag` sets a flag; while set, the canvas can ignore/defer `addField` appends from the click path, or simply recompute `hoverIndex` on each `setExternalHoverIndex` call (which reads current rows). Choose recomputation — simplest and correct.
- **[Risk] Desktop-with-touch users who drag with a finger get no drag affordance.** → Mitigation: accepted; they retain tap-to-add. `pointer: fine` gate is a deliberate scope choice (Non-Goals).
- **[Risk] Two ghosts (palette ghost + reorder ghost) could coexist if a reorder is in flight when a palette drag starts.** → Mitigation: palette's `pointerdown` only fires from a palette item; a canvas reorder's `pointerdown` is on a canvas grip and captures its own pointer — only one drag at a time is physically possible. No extra guard needed, but `beginExternalDrag` should assert/clear `draggingId === null` defensively.
- **[Trade-off] Adding four `@Method`s to `wb-canvas` grows its public surface.** → Accepted for encapsulation. If a shared drag-controller emerges later, these can become thin delegators.
- **[Trade-off] The host (`index.html`) wiring grows.** → Minimal: the existing `wbAddField` listener stays; we add listeners for the new palette drag events that call the new canvas methods. Same pattern.

## Migration Plan

No persisted state, storage, or API consumers outside the dev harness. Deployment is a component-library version bump.

1. Implement canvas methods (`beginExternalDrag`, `setExternalHoverIndex`, `commitExternalInsert`, `cancelExternalDrag`) behind the existing `addField` — no behavior change for current click callers.
2. Implement palette drag initiation gated by Decision 3; the click path still emits `wbAddField` on `click`.
3. Wire the host: on palette drag-start → `canvas.beginExternalDrag()`; on palette drag-move → `canvas.setExternalHoverIndex(clientY)`; on palette drag-end → `canvas.commitExternalInsert(type, label)`; on cancel → `canvas.cancelExternalDrag()`.
4. Verify existing click-to-add and reorder tests still pass; add Playwright browser tests for the new drag path (desktop viewport).

**Rollback:** Revert the component changes; `addField` and `wbAddField` are untouched, so the click path continues to work on rollback.

## Open Questions

- Should `commitExternalInsert` emit a distinct event (e.g. `wbInsert`) so hosts can distinguish click-add from drag-add, or is the existing `wbChange` enough? **Proposed:** keep `wbChange` only (the host already reacts to it); revisit if analytics need the distinction.
- Should the palette ghost show a generic "Field" label or the specific field `label`? **Proposed:** the specific `label`, matching the canvas reorder ghost's content.