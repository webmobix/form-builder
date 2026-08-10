# form-builder monorepo

npm workspaces monorepo, scaffolded and verified building/testing end to end.

## Packages

- **`packages/form-components`** — Stencil project, tag prefix `wb-`. The framework-agnostic
  engine (JSON Schema + UI Schema parsing, `ajv` validation, conditional
  `SHOW`/`HIDE`/`ENABLE`/`DISABLE` rule evaluation) lives in `src/core` as an internal module
  (types + `FormValidator` + `evaluateRule`). It is not a separate npm package, so a single
  publish of `@webmobix/form-components` is all that's needed. Components:
  - `wb-form-field` — single field, `formAssociated: true` + `@AttachInternals()`. Confirmed
    working: native `FormData` participation, validation-bubble anchored inside shadow DOM,
    reset/disabled callbacks.
  - `wb-canvas` — reorderable field list, pointer-based drag ported from the touch-tested
    spike. Uses `key={f.id}` on each row so Stencil's VDOM diff reuses the dragged DOM node
    across state updates — this is what the raw-DOM version got wrong (a full re-render
    destroyed the pointer-captured element mid-drag).
  - `wb-palette` — tap-to-add field types (the mobile-proven pattern; desktop drag-from-palette
    is a documented follow-up, not yet wired here).

  Builds clean via `npm run build -w packages/form-components` (`stencil build`). Output
  targets configured: `dist` (lazy, for plain-HTML script-tag use) and `dist-custom-elements`
  (tree-shakeable, for bundler-based consumers — this is what the React wrapper package
  imports from).

- **`packages/form-components-react`** — React wrappers for `@webmobix/form-components`.
  A standalone, publishable React library package that compiles and re-exports the
  Stencil-generated wrappers as typed PascalCase React components
  (`WbCanvas`, `WbFormField`, `WbFormRenderer`, `WbInspector`, `WbPalette`) with idiomatic
  `on<Event>` handler props. `react`/`react-dom` are peer deps (`>=18`); Preact can consume
  the same wrappers via `react`/`react-dom` → `preact/compat` aliasing. The generated
  `src/components/components.ts` is produced by the Stencil build and gitignored.
  Builds clean via `npm run build -w packages/form-components-react` (ESM + `.d.ts`).

## API

### Core engine (`@webmobix/form-components/src/core`)

The framework-agnostic engine is imported from the public entry
`packages/form-components/src/core/index.ts`, which re-exports everything below.

#### Types

| Type | Shape | Notes |
| --- | --- | --- |
| `JsonSchema` | `{ type?, title?, properties?, required?, enum? }` + any JSON Schema keyword | Minimal surface form-core reads directly; `ajv` handles all other keywords. |
| `UiEffect` | `'SHOW' \| 'HIDE' \| 'ENABLE' \| 'DISABLE'` | Conditional rule effect. |
| `UiRule` | `{ effect, condition: { scope, schema } }` | `scope` is a JSON Pointer into the data (e.g. `/personal/country`); `schema` is the condition to match. |
| `UiControl` | `{ type: 'Control', scope, label?, rule? }` | Renders the schema node at `scope` (e.g. `/personal/email`). |
| `UiLayout` | `{ type: 'VerticalLayout' \| 'HorizontalLayout', elements, rule? }` | Nestable layout container. |
| `FormDefinition` | `{ dataSchema: JsonSchema, uiSchema: UiSchemaElement }` | The JSON Schema + UI Schema pair that drives rendering. |
| `FieldMeta` | see below | Builder/canvas field descriptor. |
| `FieldType` | `'text' \| 'select' \| 'date' \| 'checkbox'` | |
| `FieldSubtype` / `TextSubtype` | `'text' \| 'number' \| 'email' \| 'tel' \| 'url' \| 'password'` | |
| `Restrictions` | `{ number?: { min?, max?, step? }, text?: { maxLength? } }` | Validation bounds applied by `wb-form-field`. |
| `ElementKind` | `'data' \| 'design'` | |
| `DesignType` | `'heading' \| 'paragraph' \| 'row'` | Non-input design elements. |

`FieldMeta` is the descriptor used across the builder components (canvas, palette,
inspector, renderer):

```ts
interface FieldMeta {
  id: number;
  kind?: ElementKind;          // 'data' (default) | 'design'
  type: FieldType;             // unused when kind === 'design'
  label: string;
  subtype?: FieldSubtype;
  required?: boolean;
  restrictions?: Restrictions;
  multiline?: boolean;
  initialLines?: number;       // textarea rows
  maxHeight?: number;          // textarea max height (px)
  designType?: DesignType;     // set when kind === 'design'
  text?: string;               // paragraph body
  columns?: number;            // row column count (default 2, clamped 1-4)
  children?: FieldMeta[][];    // row children, one array per column
}
```

Helpers `isDesignElement(f)` and `isDataElement(f)` narrow `kind`. The default column
count is exported as `defaultColumns = 2`.

#### `FormValidator`

Compiles a `JsonSchema` with `ajv` (+ `ajv-formats`) and validates data objects.

```ts
class FormValidator {
  constructor(dataSchema: JsonSchema);
  validate(data: unknown): FieldError[];
}
```

Returns `[]` when valid, otherwise a list of `FieldError`:
`{ path: string, message: string }` where `path` is the JSON Pointer to the offending
field (e.g. `/personal/email`) and missing `required` properties produce
`"<prop> is required"`.

#### `evaluateRule(rule, data): boolean`

Resolves `rule.condition.scope` (a JSON Pointer) against `data`, compiles
`rule.condition.schema` with `ajv`, and returns whether the ruled element should be
shown/enabled:

- `SHOW` / `ENABLE` — returns the condition's match result.
- `HIDE` / `DISABLE` — returns the inverse.
- No rule — always `true`.

### Components (`@webmobix/form-components`)

All custom elements live in shadow DOM and use the `wb-` tag prefix.

#### `<wb-form-field>`

Single form field; `formAssociated: true` so it participates natively in an ancestor
`<form>` via `ElementInternals` (submission, reset, disable, and validation bubble).

**Props**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` (required) | — | JSON Pointer path used as the form-submission key (e.g. `personal.email`). |
| `type` | `FieldType` | `'text'` | |
| `label` | `string` (required) | — | |
| `required` | `boolean` | `false` | Sets `valueMissing` validity. |
| `subtype` | `FieldSubtype` | — | Used when `type === 'text'`. |
| `restrictions` | `Restrictions` | — | Number min/max/step and text maxLength. |
| `multiline` | `boolean` | `false` | Renders a `<textarea>` for `type === 'text'`. |
| `initialLines` | `number` | — | Textarea `rows` (default 3). |
| `maxHeight` | `number` | — | Textarea `max-height` in px. |

For checkboxes the submitted value is `'on'` when checked, `''` otherwise. Number
subtypes apply `rangeUnderflow` / `rangeOverflow` validity from `restrictions.number`.

#### `<wb-canvas>`

Reorderable field list with pointer-based drag (keyed by `FieldMeta.id` to preserve
the dragged DOM node), nested row containers, auto-scroll, and selection.

**Events**

| Event | `detail` | Fired when |
| --- | --- | --- |
| `wbChange` | `FieldMeta[]` | Fields added, reordered, or updated; also on load. |
| `wbFieldSelected` | `FieldMeta` | A field/row is selected. |
| `wbFieldDeselected` | `void` | Empty area clears the selection. |
| `wbFieldUpdated` | `{ id: number, patch: Partial<FieldMeta> }` | A field patch is applied (incl. nested). |

**Methods** (all `async`)

| Method | Args | Behavior |
| --- | --- | --- |
| `addField` | `type, label, subtype?, design?` | Appends a field. |
| `addFieldAfter` | `type, label, subtype?, design?` | Inserts after the selected field; appends to a selected row's first column if the selection is a row. |
| `importState` | `fields: FieldMeta[]` | Normalizes and replaces the field list; emits `wbChange`. |
| `selectField` | `id: number \| null` | Sets the current selection. |
| `updateField` | `id, patch` | Applies a patch anywhere in the tree; emits `wbFieldUpdated` + `wbChange`. |
| `beginExternalDrag` | — | Starts cross-shadow drag mode (for palette drops). |
| `setExternalHoverIndex` | `x, y` | Positions the external drop target from coordinates. |
| `commitExternalInsert` | `type, label, subtype?, design?` | Commits an external drop at the current target. |
| `cancelExternalDrag` | — | Ends external drag mode and cleans up. |

`design` is `{ kind: 'design', designType: 'heading' \| 'paragraph' \| 'row' }`.

#### `<wb-palette>`

Tap-to-add palette (mobile-proven pattern); fine-pointer devices can also drag from it
across the shadow boundary. Emits a `FieldTypeDef` per entry:
`{ type?, label, subtype?, kind?, designType? }`.

**Events**

| Event | `detail` | Fired when |
| --- | --- | --- |
| `wbAddField` | `FieldTypeDef` | An entry is clicked/added. |
| `wbPaletteDragStart` | `FieldTypeDef` | A drag begins. |
| `wbPaletteDragMove` | `{ clientX, clientY }` | The drag moves. |
| `wbPaletteDragEnd` | `FieldTypeDef \| null` | A drag ends (`null` if it was just a click, not a move). |

Built-in `FieldTypeDef` entries: text, email, URL, number, password, dropdown, date,
checkbox, plus heading / paragraph / row design elements.

#### `<wb-inspector>`

Edits the selected field's settings and emits patches for the canvas to apply.

**Props**

| Prop | Type | Default |
| --- | --- | --- |
| `field` | `FieldMeta \| null` (mutable) | `null` |

**Events**

| Event | `detail` |
| --- | --- |
| `wbFieldUpdated` | `{ id: number, patch: Partial<FieldMeta> }` |

**Methods**

| Method | Args |
| --- | --- |
| `setField` | `field: FieldMeta \| null` |

Emits patches for label (with empty-label validation), required, number min/max/step,
text maxLength, multiline + initialLines + maxHeight, paragraph text, and row columns.

#### `<wb-form-renderer>`

Renders a form from `FieldMeta[]` (data fields + design elements) and submits via
`FormData`.

**Props**

| Prop | Type | Default |
| --- | --- | --- |
| `fields` | `FieldMeta[]` (mutable) | `[]` |

**Events**

| Event | `detail` |
| --- | --- |
| `wbSubmit` | `Record<string, string>` (field name → value) |

**Methods**

| Method | Args |
| --- | --- |
| `setFields` | `fields: FieldMeta[]` |

### React wrappers (`@webmobix/form-components-react`)

Re-exports the Stencil-generated wrappers as typed PascalCase React components:
`WbCanvas`, `WbFormField`, `WbFormRenderer`, `WbInspector`, `WbPalette`. Props map to
the web-component attributes; Stencil `wb-` events surface as idiomatic `onWb*` React
handlers carrying the `CustomEvent` (use `e.detail`).

```tsx
import { WbCanvas, WbFormRenderer } from '@webmobix/form-components-react';

<WbCanvas
  fields={myFields}
  onWbChange={(e) => console.log(e.detail)}
  ref={(el) => el?.addField('text', 'Nickname')}
/>
<WbFormRenderer fields={myFields} onWbSubmit={(e) => console.log(e.detail)} />
```

## Running locally

```bash
npm install
npm test -w packages/form-components      # includes the ajv core engine tests
npm run build -w packages/form-components
npm run build -w packages/form-components-react
npm start -w packages/form-components   # dev server, opens src/index.html
```

Consuming the React wrappers from a React app:

```tsx
import { WbCanvas, WbFormRenderer } from '@webmobix/form-components-react';

<WbCanvas onWbChange={(e) => console.log(e.detail)} />
<WbFormRenderer onWbSubmit={(e) => console.log(e.detail)} />
```

`src/index.html` in `form-components` wires palette + canvas + a standalone field together
in one page — closest thing to a working end-to-end smoke test right now.

## Deliberately not done yet

- **React output target consumers in-app** — `@stencil/react-output-target` is wired and the
  `@webmobix/form-components-react` package ships typed wrappers (see above), but no in-repo
  React demo app consumes them yet. Preact can consume the same wrappers via
  `react`/`react-dom` → `preact/compat` aliasing rather than a separate output target.
- **Desktop drag-from-palette onto the canvas** — proven working in the original spike
  (cross-shadow-boundary `elementFromPoint` drilling), not yet ported into `wb-palette`.
- **`form-builder-core`** (palette registry, selection state, schema serialization from
  canvas state) and the three-pane desktop / FAB-and-sheet mobile shells — not started.
- **GitHub Packages publishing** — `publishConfig` is set on all three package.json files
  and root `.npmrc` routes the `@webmobix` scope there, but nothing has been published yet; needs
  a `GITHUB_PACKAGES_TOKEN` and a CI workflow (Changesets recommended for version bumps
  across the multi-package split).
- **Unique field keys from schema path** — `wb-form-field`'s `name` prop is currently just
  whatever string you pass it; nothing yet derives it automatically from the JSON Pointer
  path in the UI Schema, which is what avoids the naming-collision risk noted earlier.
