## Context

`form-components` is a Stencil component library exposing `wb-palette`, `wb-canvas`, and `wb-form-field`. The canvas keeps an in-memory list of `FieldMeta = { id: number; type: FieldType; label: string }` and already emits `wbFieldSelected` with the full `FieldMeta` when a row is clicked (`wb-canvas.tsx`). The palette and canvas communicate via `wbAddField` / `wbChange`; the host page (`src/index.html`) wires events to methods. `form-core` defines the JSON Schema / UI Schema types the builder targets. `FieldType` today is `'text' | 'select' | 'date' | 'checkbox'` — there is no subtype or restrictions concept, and `wb-form-field` renders a plain text input for `text`.

The canvas is a Stencil web component with shadow DOM; rows are keyed by `id` (stable across re-renders — this discipline must be preserved when adding properties). Edits flow host-side via events, mirroring the existing `wbAddField`/`wbChange` pattern, so the settings panel follows the same host-wired convention rather than reaching directly into canvas internals.

## Goals / Non-Goals

**Goals:**
- Add a `wb-inspector` Stencil component (right-hand panel) that renders editable properties for the currently selected canvas field.
- Drive the inspector from the existing `wbFieldSelected` event; empty state when nothing is selected.
- Editable: label, type, subtype (for `text`), and type/subtype-specific restrictions.
- Propagate edits back to the canvas via a new `wbFieldUpdated` event (host wires `wb-inspector` → `canvas.updateField`), preserving the stable `id`.
- `wb-form-field` honors subtype and restrictions for rendering and validation.
- Extend `FieldMeta` / `FieldType` in `form-core` and `wb-canvas` to carry subtype and restrictions, aligned with the JSON Schema surface form-core already reads (so restrictions map to `minimum`/`maximum`/`multipleOf`/`maxLength`).

**Non-Goals:**
- Full JSON Schema editor (this change introduces the property primitives the inspector edits; arbitrary nested schema editing is out of scope).
- Validation-rule UI beyond the first set of type/subtype restrictions (min/max/step for number, maxLength for text). Conditional rules / `UiRule` editing is out of scope.
- Persisting field definitions to a backend (the canvas remains in-memory, same as today).
- Selection of multiple fields / batch editing.

## Decisions

### 1. Inspector is a peer Stencil component wired by the host (not a canvas child)
**Decision:** Add `wb-inspector` as a standalone component next to `wb-canvas`; the host page listens to `wbFieldSelected`, passes the field to the inspector via a `field` prop/method, and listens to the inspector's `wbFieldUpdated` event to call `canvas.updateField(id, patch)`.
**Rationale:** Mirrors the existing `wb-palette` ↔ `wb-canvas` host-wired pattern; keeps components decoupled and independently testable; avoids cross-shadow-DOM reach.
**Alternatives considered:** Render the inspector inside `wb-canvas`'s shadow DOM — rejected because it couples layout to the canvas and breaks the existing single-column canvas model; host composition gives flexibility in placement.

### 2. Reuse the stable `id` for updates; add a `wbFieldUpdated` event and `updateField` method
**Decision:** Add `@Method updateField(id, patch: Partial<FieldMeta>)` to `wb-canvas` that merges `patch` into the matching field (found by `id`) and emits a new `wbFieldUpdated: EventEmitter<{ id: number; patch: Partial<FieldMeta> }>` plus the existing `wbChange` with the full updated list. The keyed-by-`id` render stays unchanged so the row DOM is reused.
**Rationale:** Preserves the stable-key discipline documented in `wb-canvas.tsx`; reuses the existing `wbChange` contract consumers already rely on; `wbFieldUpdated` gives granular signal for the inspector to refresh.
**Alternatives considered:** Replace the whole `fields` array prop on canvas from the host — rejected, it breaks the encapsulation where the canvas owns the list and the palette appends via methods.

### 3. Model: extend `FieldMeta` with `subtype` and `restrictions`
**Decision:** In `form-core`:
```
type TextSubtype = 'text' | 'number' | 'email' | 'tel';
type FieldSubtype = TextSubtype; // expandable to other types later
interface NumberRestrictions { min?: number; max?: number; step?: number; }
interface TextRestrictions { maxLength?: number; }
type Restrictions = { number?: NumberRestrictions; text?: TextRestrictions };
interface FieldMeta { id: number; type: FieldType; label: string; subtype?: FieldSubtype; restrictions?: Restrictions; }
```
The canvas and inspector import this `FieldMeta` from `form-core` (shared type source). `subtype` only applies to `type: 'text'` for now; other types ignore it. Restriction keys are keyed by subtype to keep the model explicit and aligned with JSON Schema (`min`/`max`/`step` ↔ `minimum`/`maximum`/`multipleOf`; `maxLength` ↔ `maxLength`).
**Rationale:** Single source of truth for the field model; aligns with the JSON Schema keywords `form-core` already reads so the field renderer/validator can consume the same restrictions.
**Alternatives considered:** Store restrictions as a flat `Record<string, unknown>` — rejected as lossy and untyped; store subtype as part of `type` (e.g. `'number'` as a new `FieldType`) — rejected because it muddies the palette's four base types and JSON Schema's `type` field.

### 4. Inspector shows restriction fields conditionally on type/subtype
**Decision:** The inspector renders a small schema-driven form: `label` (text input, always), `type` (select of the four base types), `subtype` (select of `TextSubtype` — shown only when `type === 'text'`), and restriction inputs shown only for the matching subtype (number → min/max/step number inputs; text → maxLength number input). Switching type/subtype clears/defaults restrictions that no longer apply (e.g. text → number clears `text.maxLength` and seeds empty `number` restrictions).
**Rationale:** Keeps the panel compact and prevents invalid restriction combos; the conditional reset avoids carrying stale restrictions across type changes.
**Alternatives considered:** Show all restriction inputs always — rejected as confusing and error-prone.

### 5. `wb-form-field` consumes subtype + restrictions
**Decision:** Extend `wb-form-field` with optional `subtype` and `restrictions` props. For `type === 'text'`: render `<input type={subtype ?? 'text'}>` and apply `maxLength` when set. For `subtype === 'number'`: render `<input type="number">` with `min`/`max`/`step` attributes, and validate against them in `sync()` using `ElementInternals.setValidity`. Existing `select`/`date`/`checkbox` rendering is unchanged.
**Rationale:** Reuses the form-associated `ElementInternals` validation path already in `wb-form-field.tsx`; keeps the rendering switch centralized.
**Alternatives considered:** Move validation entirely into `form-core`'s `validator.ts` — deferred; this change wires the DOM attributes the validator can later leverage.

## Risks / Trade-offs

- **[Selection state ownership]** The canvas owns `fields`; selection state (which field is selected) lives in the host to keep canvas/inspector decoupled. → Mitigation: host stores `selectedId`; clearing selection on canvas needs a `wbFieldDeselected` path (clicking empty canvas area) — covered in specs.
- **[Type-switch data loss]** Changing a field's type after data has been entered could invalidate existing values. → Mitigation: this change targets the builder's field *definition* phase (no submitted data yet); runtime data-migration on type change is a Non-Goal and documented as such.
- **[Model duplication]** `FieldMeta` currently lives in both `wb-canvas.tsx` (local interface) and `form-core`. → Mitigation: this change makes `form-core` the single source and `wb-canvas` imports it; a small refactor task is included.
- **[Shadow DOM + form internals]** Adding `min`/`max`/`step` on a number input inside shadow DOM must still anchor validation bubbles — already confirmed working in the existing spike for text fields. → Mitigation: number input reuses the same `ElementInternals` path; add a unit test for number validation messaging.