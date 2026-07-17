# form-builder monorepo

npm workspaces monorepo, scaffolded and verified building/testing end to end.

## Packages

- **`packages/form-core`** — framework-agnostic engine. JSON Schema (validated via `ajv`)
  + UI Schema (JSONForms-style `VerticalLayout`/`Control`/`rule` convention) + conditional
  `SHOW`/`HIDE`/`ENABLE`/`DISABLE` rule evaluation. No DOM, no Stencil — pure TS.
  6 unit tests passing (`npm test -w packages/form-core`).

- **`packages/form-components`** — Stencil project, tag prefix `wb-`. Three real components,
  ported from the standalone spikes:
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
  (tree-shakeable, for bundler-based consumers — this is what a future React/Preact wrapper
  package would import from).

## Running locally

```bash
npm install
npm test -w packages/form-core          # 6 passing tests
npm run build -w packages/form-core
npm run build -w packages/form-components
npm start -w packages/form-components   # dev server, opens src/index.html
```

`src/index.html` in `form-components` wires palette + canvas + a standalone field together
in one page — closest thing to a working end-to-end smoke test right now.

## Deliberately not done yet

- **React output target** (`@stencil/react-output-target`) — noted as a comment in
  `stencil.config.ts`. Add once the field-type set stabilizes; Preact can likely consume the
  same generated wrappers via `react`/`react-dom` → `preact/compat` aliasing rather than a
  separate output target.
- **Desktop drag-from-palette onto the canvas** — proven working in the original spike
  (cross-shadow-boundary `elementFromPoint` drilling), not yet ported into `wb-palette`.
- **`form-builder-core`** (palette registry, selection state, schema serialization from
  canvas state) and the three-pane desktop / FAB-and-sheet mobile shells — not started.
- **GitHub Packages publishing** — `publishConfig` is set on both package.json files and
  root `.npmrc` routes the `@webmobix` scope there, but nothing has been published yet; needs
  a `GITHUB_PACKAGES_TOKEN` and a CI workflow (Changesets recommended for version bumps
  across the multi-package split).
- **Unique field keys from schema path** — `wb-form-field`'s `name` prop is currently just
  whatever string you pass it; nothing yet derives it automatically from the JSON Pointer
  path in the UI Schema, which is what avoids the naming-collision risk noted earlier.
