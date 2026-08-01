## Why

The form-components package ships web components via `dist-custom-elements`, which React consumers can import directly, but this requires host apps to manually wire custom element registration, attributes, and events. There is no first-class, typed React binding. The existing `stencil.config.ts` already calls out this gap with a TODO comment. Enabling Stencil's official React output target gives React apps typed, idiomatic wrapper components with correct prop/event bindings, and Preact apps can reuse them via `preact/compat` aliasing.

## What Changes

- Add `@stencil/react-output-target` as a dev dependency of `packages/form-components`.
- Register a `react` output target in `stencil.config.ts`, generating wrapper components into `packages/form-components/react/` (or a chosen path) and exporting them from a new package entry point.
- Add `react`/`react-dom` peer dependencies to `packages/form-components/package.json` so consumers provide their own React instance.
- Add a new `exports` entry (e.g., `./react`) mapping to the generated wrappers, with corresponding `types` entries.
- Remove the placeholder TODO comment in `stencil.config.ts`.
- Update the package `files` list to include the generated React output directory so it ships on publish.

## Capabilities

### New Capabilities
- `react-wrapper`: Typed React wrapper components generated from Stencil web components via `@stencil/react-output-target`, exposing props/events as idiomatic React APIs.

### Modified Capabilities
<!-- None. The existing web component behavior is unchanged; this adds a new consumer surface on top. -->

## Impact

- **Code**: `packages/form-components/stencil.config.ts` (add output target), `packages/form-components/package.json` (peer deps, exports, files).
- **Dependencies**: New dev dependency `@stencil/react-output-target`; new peer dependencies `react` and `react-dom`.
- **Build**: `npm run build` in `form-components` now also emits the React wrapper bundle; build time increases slightly.
- **Consumers**: React/Preact host apps gain a typed import path; existing `dist` and `dist-custom-elements` consumers are unaffected.
- **No breaking changes** — all existing output targets and entry points remain intact.