## Context

The form builder (`packages/form-components`) is a Stencil component library. Its dev harness at `packages/form-components/src/index.html` renders three components — `wb-palette`, `wb-canvas`, `wb-inspector` — that let a user compose a list of fields. The canvas emits the resulting `FieldMeta[]` config via its `wbChange` event. Today that JSON is shown only as text in a `<pre>`, and the only rendered input is a single hardcoded `wb-form-field` ("A standalone form-associated field"). There is no way to see the configured form as someone filling it out would.

`wb-form-field` already exists and is form-associated via ElementInternals: it accepts `name`, `label`, `type`, `subtype`, `required`, and `restrictions` props, renders a `<label>` + `<input>`, participates in an ancestor `<form>` (submit/reset/disabled), and enforces validation. The `FieldMeta` shape in `form-core/src/types.ts` carries exactly the props `wb-form-field` needs (`id`, `type`, `label`, `subtype`, `restrictions`).

So the missing piece is small: a thing that takes `FieldMeta[]` and stamps out one `wb-form-field` per entry inside a `<form>`, and re-renders when the config changes. Two viable shapes: (a) a host-page renderer in `index.html`, or (b) a dedicated `wb-form-renderer` Stencil component. We pick (b) because it keeps the rendering logic testable, reusable outside the harness, and consistent with the rest of the library (everything else is a Stencil component). The harness then just wires `wbChange → renderer.setFields(...)`.

## Goals / Non-Goals

**Goals:**
- Render a fillable form (label + input per field) from the `FieldMeta[]` JSON config emitted by `wb-canvas`.
- Keep the rendered form in sync with the canvas as the user adds, edits, reorders, and removes fields — re-render on every `wbChange`.
- Forward every relevant prop from each `FieldMeta` to its `wb-form-field` (`name`, `label`, `type`, `subtype`, `required`, `restrictions`) so validation and input behavior match the configuration.
- Produce a submit payload keyed by the configured field names so the form is usable end-to-end.
- Make the renderer a first-class, unit-tested Stencil component so it can be reused outside the dev harness.

**Non-Goals:**
- No change to `form-core` types or to `wb-form-field`'s rendering/validation behavior — the renderer only forwards props the field already supports.
- No change to the builder UI (`wb-palette`, `wb-canvas`, `wb-inspector`) beyond adding a wiring line in the harness.
- No persistence/loading of saved form configs — this is live preview of the in-progress canvas config only.
- No JSON Schema / UI Schema (`FormDefinition`) rendering yet — `wb-form-renderer` consumes the builder's flat `FieldMeta[]`. Translating a full `FormDefinition` to rendered fields is a separate future change.
- No styling overhaul — the renderer uses the existing `wb-form-field` styles plus minimal wrapper styling for spacing.

## Decisions

### 1. Dedicated `wb-form-renderer` Stencil component (vs. host-page stamping)

**Decision:** Add `wb-form-renderer` in `packages/form-components/src/components/wb-form-renderer/`.

**Rationale:** Keeps render logic testable and reusable, matches the library's existing component pattern, and avoids a tangle of imperative DOM code in `index.html`. The harness stays declarative: `<wb-renderer id="renderer"></wb-renderer>` + one `setFields` call.

**Alternatives considered:**
- *Host-page renderer in `index.html`* — simpler, but untestable and not reusable; imperative DOM diffing would be error-prone on reorder.
- *Render inside `wb-canvas`* — couples builder and preview; violates the canvas's single responsibility (editing config).

### 2. Renderer owns the `<form>` element

**Decision:** `wb-form-renderer` renders a `<form>` in its shadow DOM containing one `wb-form-field` per `FieldMeta`, plus a submit button.

**Rationale:** `wb-form-field` is `formAssociated` and needs an ancestor `<form>` for ElementInternals to participate in submit/reset/disabled. Owning the form lets the renderer emit a `wbSubmit` event with the collected FormData and handle reset cleanly.

**Alternatives considered:**
- *Renderer renders bare fields, harness owns the `<form>`* — would split responsibilities and make the component unusable standalone; rejected.

### 3. Field `name` derived from `FieldMeta.id`

**Decision:** Each rendered field's form-submission key is `field.<id>` (e.g. `field.3`). Required flag and other props come from the `FieldMeta`.

**Rationale:** `FieldMeta` has no natural name/path; using the stable `id` gives round-trippable, collision-free keys that survive reorders without remapping. The id is already the stable key used by `wb-canvas`'s keyed VDOM diff.

**Alternatives considered:**
- *Slugify `label`* — labels are user-editable and can collide/contain non-identifier chars; rejected.
- *Use JSON Pointer from a `FormDefinition`* — out of scope for the flat `FieldMeta[]` model.

### 4. `setFields(fields: FieldMeta[])` public method + reactive `@Prop() fields`

**Decision:** Expose both a mutable `@Prop() fields: FieldMeta[] = []` (so it can be set declaratively) and a `@Method() setFields(fields)` for ergonomic imperative wiring from the harness's `wbChange` listener.

**Rationale:** Matches the pattern used by `wb-inspector.setField` and `wb-canvas.updateField`, so the harness wiring is consistent. Stencil will re-render on prop change.

### 5. `wbSubmit` event carries a plain object of `{ name: value }`

**Decision:** On form submit, the renderer emits `wbSubmit` with `detail = { <fieldName>: <value>, ... }` derived from `FormData`.

**Rationale:** Easy to dump into the existing `#out` `<pre>` block and to assert in tests. Checkbox fields serialize to `on`/`''` consistent with `wb-form-field`'s `setFormValue`.

## Risks / Trade-offs

- **[ElementInternals in nested shadow DOM]** `wb-form-field` is inside `wb-form-renderer`'s shadow DOM, which is itself inside the page. ElementInternals resolves the form-association to the nearest ancestor `<form>` in *any* root — confirmed working in the prior standalone spike, so this is low risk. → Mitigation: keep a unit test that submits the renderer form and asserts the payload includes all field values.
- **[Re-render on reorder could reset in-progress input]** When the user is typing in a preview field and the canvas reorders, the renderer re-renders and may wipe the typed value. → Mitigation: keyed VDOM diff by `field.id` (Stencil reuses the `wb-form-field` node across reorders), and `wb-form-field` keeps its own `value` state; acceptable for a preview. Not in scope to preserve preview input across structural edits.
- **[Adding a component increases build size slightly]** One more Stencil component. Negligible and acceptable for a library.
- **[No `select` rendering in `wb-form-field` yet]** `FieldMeta.type` includes `'select'` but `wb-form-field` currently has no select branch in `render()` — it would fall through to a text input. → Mitigation: note this as a known gap; rendering select correctly is a separate change to `wb-form-field`. The renderer forwards `type` faithfully and the field handles what it can.