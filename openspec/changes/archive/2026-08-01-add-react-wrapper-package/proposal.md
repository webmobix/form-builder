## Why

The previous change (`enable-react-output-target`) wired `@stencil/react-output-target` into `stencil.config.ts` and generated `packages/form-components/react/components.ts`, but that file ships as raw TypeScript source and the package's `./react` export points directly at `./react/components.ts`. React consumers (Next.js, Vite) cannot reliably build `.ts` files imported from `node_modules`, so the wrappers are not consumable today. The Stencil React docs recommend a dedicated React library package in the monorepo that compiles the generated wrappers to JS + `.d.ts` and re-exports them as a typed entry point. This change establishes that package so the wrappers are actually usable.

## What Changes

- Add a new workspace package `@webmobix/form-components-react` under `packages/form-components-react/` that re-exports the Stencil-generated React wrapper components, compiled to ESM/CJS with type declarations.
- Retarget the Stencil React output (`reactOutputTarget` `outDir`) from `packages/form-components/react/` to `packages/form-components-react/src/components/` so the generated `components.ts` lands inside the new package's source tree.
- Remove the `./react` subpath export and `react/` entry from `packages/form-components/package.json` `exports`/`files`; the Stencil package no longer ships React wrappers directly. Add `dist/*` and `./components/*` subpath exports to `packages/form-components/package.json` so the generated wrappers can resolve the custom-element classes and types they import.
- Add a build pipeline to the new React package (TypeScript-only build via `tsc` producing `dist/`, with `react`/`react-dom` peer deps and `@stencil/react-output-target` as a runtime dependency) and wire it into the root `build` script through the existing workspace build.
- Add a `@webmobix/form-components-react` workspace dependency on `@webmobix/form-components` (workspace:*) so the built wrappers resolve the underlying custom-element classes at runtime.
- Update the `@webmobix/form-components` build ordering so the React package builds after the Stencil package (Stencil emits the generated `components.ts` during its build; the React package compiles it).

## Capabilities

### New Capabilities
- `react-wrapper-package`: A standalone, publishable React component library package that compiles and re-exports the Stencil-generated React wrappers for the form-components web components, exposing typed PascalCase React components with idiomatic prop/event bindings.

### Modified Capabilities
<!-- None. The web component behavior and existing specs are unchanged; this change only affects the React consumer surface and packaging. -->

## Impact

- **Code**: New `packages/form-components-react/` package (`package.json`, `tsconfig.json`, `src/index.ts`, build output `dist/`). `packages/form-components/stencil.config.ts` (retarget `outDir`). `packages/form-components/package.json` (remove `./react` export, add `dist/*` and `./components/*` subpath exports, drop `react/` from `files`).
- **Dependencies**: New package `@webmobix/form-components-react` with `react`/`react-dom` peer deps, `@stencil/react-output-target` runtime dep, `typescript`/`@types/react` dev deps, and a workspace dependency on `@webmobix/form-components`.
- **Build**: Root `npm run build` now also builds the React package; ordering requires the Stencil package to build first so `components.ts` is regenerated before `tsc` runs in the React package.
- **Consumers**: React/Preact apps import from `@webmobix/form-components-react` instead of the `./react` subpath. Existing `dist`, `dist-custom-elements`, and `loader` consumers of `@webmobix/form-components` are unaffected.
- **No breaking changes** for web-component consumers; the `./react` subpath on `@webmobix/form-components` was never effectively usable (raw `.ts`), so removing it formalizes the corrected surface.