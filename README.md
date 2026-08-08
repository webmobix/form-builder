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
