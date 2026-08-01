## Context

`packages/form-components` builds Stencil web components and emits `dist`, `dist-custom-elements`, `loader`, and `docs-readme` outputs. The archived `enable-react-output-target` change added `@stencil/react-output-target` to `stencil.config.ts` with `outDir: 'react/'` and `includeImportSymbols: true`, generating `packages/form-components/react/components.ts`. That file imports the custom-element classes and types directly from `@webmobix/form-components/dist/components/*` and re-exports PascalCase React wrapper components built with `createComponent` from `@stencil/react-output-target/runtime`.

The problem: `packages/form-components/package.json` exposes the wrappers via a `./react` subpath export that points at `./react/components.ts` — raw TypeScript source. React bundlers (Next.js, Vite) generally do not compile `.ts` files inside `node_modules`, so consumers cannot import the wrappers today. The Stencil React integration docs recommend a separate React library package in the monorepo whose build compiles the generated `components.ts` to JS + declarations and re-exports it. This change adopts that structure.

The monorepo already uses pnpm workspaces (`packages/*`) and an npm-style `workspaces` field in the root `package.json`. Root `build` runs `npm run build --workspaces --if-present`, which iterates workspaces in directory order — `form-components` before a new `form-components-react` package (alphabetical), so ordering is naturally correct.

## Goals / Non-Goals

**Goals:**
- Establish a dedicated, publishable `@webmobix/form-components-react` workspace package that compiles the Stencil-generated wrappers to ESM + CJS + `.d.ts` and re-exports them as typed React components.
- Retarget the Stencil React output so the generated `components.ts` lands inside the new package's source tree, keeping it a build-generated artifact.
- Make the underlying Stencil package resolve the custom-element classes/types the wrappers import by adding `dist/*` and `./components/*` subpath exports.
- Keep the Stencil package's existing `dist`, `dist-custom-elements`, and `loader` outputs and consumers unchanged.
- Preserve the generated wrapper semantics: PascalCase components, `on<Event>` handlers for emitted events, prop typing from `Components.*`, and `defineCustomElement` auto-registration.

**Non-Goals:**
- Changing the web component source or their public APIs.
- Hand-rolling React wrappers; the Stencil-generated `components.ts` remains the source of truth.
- SSR/hydrate support (`hydrateModule` / `dist-hydrate-script`) — deferred until an SSR consumer exists.
- Splitting the React wrappers into their own versioned release cycle independent of the Stencil package.
- Adding a Preact-specific output target; Preact consumers alias `react`/`react-dom` to `preact/compat`.

## Decisions

### Decision 1: New workspace package `@webmobix/form-components-react` rather than compiling in place
**Rationale:** The Stencil React docs prescribe a separate React library package that owns its own `tsc` build and `dist/`. Co-locating compiled output inside `packages/form-components` would require a secondary `tsc` step in a Stencil project and would mix Stencil's build artifacts with a React build pipeline, which is fragile. A dedicated package gives a clean `package.json` with correct `react`/`react-dom` peer deps, a single `tsc` build, and a clear public name.
**Alternatives considered:** (a) Keep `./react` subpath on `@webmobix/form-components` and add a `tsc` build step there — rejected because Stencil owns the package build and adding a parallel TS build is awkward and the raw `.ts` export is not consumable. (b) Ship the generated `components.ts` as-is and require consumers to configure their bundler to compile `node_modules` — rejected; hostile to Next.js/Vite defaults.

### Decision 2: Generated `components.ts` lives in `packages/form-components-react/src/components/`
**Rationale:** The React output target's `outDir` is relative to the Stencil project root. Pointing it at `../form-components-react/src/components/` places the generated file inside the React package's source tree, where the package's `tsc` build picks it up. The file is regenerated on every Stencil build, so it should not be hand-edited; it should be gitignored (the Stencil build regenerates it before the React build runs).
**Alternatives considered:** (a) Generate into `packages/form-components/react/` and copy into the React package on build — rejected; adds a copy step and a second source of truth. (b) Generate into the React package's `src/` root (not a `components/` subdir) — rejected; matches the docs' recommended structure and keeps the hand-written `index.ts` separate from generated code.

### Decision 3: `tsc`-only build for the React package (no bundler)
**Rationale:** The generated wrappers are thin runtime shims around `@stencil/react-output-target/runtime`'s `createComponent` and the underlying custom-element classes. There is no JSX or runtime transformation needed beyond what `tsc` provides, so a bundler (Rollup/tsup) adds complexity without benefit. `tsc -p . --outDir ./dist` with `declaration: true`, `module: esnext`, and `moduleResolution: bundler` emits ESM + `.d.ts`; a second pass (or `tsc` with `module: commonjs`) emits CJS. Use `tsc` with two `module` outputs via a small build script, or a single `tsc` build emitting ESM plus a CJS fallback via `tsc --module commonjs --outDir dist/cjs`.
**Alternatives considered:** (a) `tsup`/`rollup` for a single bundled file — rejected as unnecessary for thin wrappers; tree-shaking per-component imports is better preserved with `tsc`'s per-file output. (b) `swc` — rejected; `tsc` is already a dev dependency and gives declarations for free.

### Decision 4: `react`/`react-dom` as peer deps; `@stencil/react-output-target` as a runtime dependency
**Rationale:** The generated `components.ts` imports `createComponent` and the runtime types from `@stencil/react-output-target/runtime` at runtime, so that package must be a `dependency` (not `devDependency`) of the React package so it ships on install. React itself must be a peer dependency to avoid duplicate React instances and hook-state bugs, matching the prior change's contract.
**Alternatives considered:** (a) Bundle `@stencil/react-output-target` into the React package output — rejected; consumers benefit from version deduplication and Stencil runtime upgrades.

### Decision 5: Add `dist/*` and `./components/*` subpath exports to `@webmobix/form-components`
**Rationale:** The generated `components.ts` imports the custom-element classes and `Components` types from `@webmobix/form-components/dist/components/wb-*.js` and `@webmobix/form-components/dist/components` (types). For these imports to resolve from a separate package, the Stencil package's `exports` map must expose `./dist/*` and `./components/*` subpaths (the docs' "Component Imports" note shows this exact pattern). Without these exports, Node's ESM resolution will reject deep imports into `dist/`.
**Alternatives considered:** (a) Import via the package root only — rejected; the root export points at the lazy-loaded `wb-form.esm.js`, not the per-component custom-element classes the wrappers need.

### Decision 6: Drop the `./react` subpath export and `react/` from `files` on `@webmobix/form-components`
**Rationale:** The wrappers now live in and are published from `@webmobix/form-components-react`. Keeping a stale `./react` export on the Stencil package would create two competing React surfaces and risk consumers importing the uncompiled `.ts`. Removing it formalizes the single, correct import path.
**Alternatives considered:** (a) Keep `./react` as a deprecated alias — rejected; the export points at `.ts` source that is not buildable by consumers, so it cannot work; deprecation without a working path adds noise.

## Risks / Trade-offs

- **[Risk] Build ordering** — the React package's `tsc` build requires the Stencil build to have run first (so `components.ts` is regenerated and `dist/components/*` exists). Mitigation: pnpm workspaces iterate `packages/*` alphabetically (`form-components` before `form-components-react`), so the default root `build` orders correctly; document the dependency and consider a `prebuild` step in the React package that runs the Stencil build if `src/components/components.ts` is missing.
- **[Risk] Generated `components.ts` committed vs. gitignored** — if gitignored, a fresh clone has no `src/components/components.ts` until the Stencil build runs. Mitigation: add a `prebuild` script in the React package (`stencil build --workspace @webmobix/form-components` or a guard) so a standalone `npm run build --workspace @webmobix/form-components-react` still produces the generated file. Alternatively commit the generated file for first-install resilience; decide in tasks.
- **[Risk] `tsc` dual ESM/CJS emission** — a single `tsc` invocation emits one module kind. Mitigation: use two `tsc` invocations (one `--module esnext --outDir dist`, one `--module commonjs --outDir dist/cjs`) in the build script, or emit ESM only and ship `cjs` via a tiny `tsc` pass. Keep it simple; the wrappers are small.
- **[Risk] `@types/react` version mismatch across workspace** — Mitigation: pin `@types/react` to the same version range in both packages.
- **[Trade-off] Two publishable packages instead of one** — consumers install both `@webmobix/form-components` (runtime custom elements) and `@webmobix/form-components-react` (wrappers). Accepted; this matches the Stencil-recommended monorepo layout and keeps the React surface opt-in.
- **[Risk] Deep import paths into `@webmobix/form-components/dist/components/*` break on future Stencil output restructure** — Mitigation: pin Stencil major; the `./components/*` subpath export abstracts the exact path so consumers import `@webmobix/form-components/components/wb-canvas`, not the raw `dist` path.

## Migration Plan

1. Create `packages/form-components-react/` with `package.json`, `tsconfig.json`, `src/index.ts` (re-exporting the generated `components.ts`).
2. Update `packages/form-components/stencil.config.ts` `reactOutputTarget.outDir` to `'../form-components-react/src/components/'`.
3. Update `packages/form-components/package.json`: remove `./react` export and `react/` from `files`; add `./dist/*` and `./components/*` subpath exports.
4. Run `pnpm install` at the root to register the new workspace and link `@webmobix/form-components` into the React package.
5. Run `npm run build --workspace @webmobix/form-components` to regenerate `components.ts` into the new location.
6. Run `npm run build --workspace @webmobix/form-components-react` to compile `dist/`.
7. Smoke-test: in a scratch file, `import { WbCanvas } from '@webmobix/form-components-react'` and verify types resolve and the module loads under Node ESM.
8. Rollback: revert `stencil.config.ts` `outDir`, restore the `./react` export, remove the new package directory. No existing consumer is affected because the prior `./react` path was not effectively consumable.

## Open Questions

- Should the generated `src/components/components.ts` be committed (first-install resilience, reviewable diffs) or gitignored (single source of truth = the Stencil build)? Lean: gitignore + `prebuild` guard, but confirm in tasks.
- Does the React package need a `www`/dev harness to render the wrappers, or is the existing Stencil `www` harness sufficient for now? Deferred.
- CJS support: do any consumers need CommonJS, or is ESM-only acceptable for v1? Lean: ship both via two `tsc` passes; cheap to add.