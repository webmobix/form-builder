## 1. Create the React wrapper package scaffold

- [x] 1.1 Create `packages/form-components-react/` directory with `src/` and `src/components/` subdirectories
- [x] 1.2 Add `packages/form-components-react/package.json` with name `@webmobix/form-components-react`, version `0.0.1`, `main`/`module`/`types` pointing at `dist/`, `exports` mapping `.` to ESM/CJS/types, `peerDependencies` (`react`/`react-dom` `>=18.0.0`), `dependencies` (`@stencil/react-output-target`, `@webmobix/form-components` `workspace:*`), `devDependencies` (`typescript` `^5.9.0`, `@types/react`), `files: ["dist/"]`, `scripts.build`, `scripts.prebuild`, and `publishConfig` matching the Stencil package
- [x] 1.3 Add `packages/form-components-react/tsconfig.json` extending the Stencil package's compiler options where useful, with `outDir: "./dist"`, `declaration: true`, `module: "esnext"`, `moduleResolution: "bundler"`, `jsx: "react"`, `jsxFactory: "h"`, `jsxFragmentFactory: "h.Fragment`, `lib: ["es2022", "dom", "dom.iterable"]`, `target: "es2022"`, `skipLibCheck: true`, `include: ["src"]`, `exclude: ["node_modules", "dist"]`
- [x] 1.4 Add `packages/form-components-react/src/index.ts` that re-exports the generated wrappers: `export * from './components/components';`
- [x] 1.5 Add `packages/form-components-react/.gitignore` (and/or update root `.gitignore`) to ignore `dist/` and the generated `src/components/components.ts`

## 2. Retarget the Stencil React output

- [x] 2.1 In `packages/form-components/stencil.config.ts`, change `reactOutputTarget({ outDir: 'react/', ... })` to `outDir: '../form-components-react/src/components/'`
- [x] 2.2 Keep `excludeComponents: []` and `includeImportSymbols: true` unchanged; confirm the `dist-custom-elements` target remains declared before the `react` target
- [x] 2.3 Delete the now-stale `packages/form-components/react/` directory (the generated `components.ts` will no longer be written there)

## 3. Update the Stencil package exports

- [x] 3.1 In `packages/form-components/package.json`, remove the `./react` entry from `exports`
- [x] 3.2 Remove `react/` from the `files` array
- [x] 3.3 Add `./dist/*` and `./components/*` subpath exports to `exports` (mapping `import` to `./dist/*` / `./dist/components/*.js` with `types` to `./dist/components/*.d.ts`) so the generated wrappers can deep-import custom-element classes and the `Components` types
- [x] 3.4 Update the package `description` to drop the "React wrappers" claim (now shipped by `@webmobix/form-components-react`); keep the plain-HTML / Preact-via-custom-elements note

## 4. Wire the build

- [x] 4.1 Define the React package `build` script as a `tsc` build producing ESM + declarations into `dist/`, plus a second `tsc` pass (or `tsc --module commonjs --outDir dist/cjs`) for CommonJS; verify `dist/index.js`, `dist/index.d.ts`, and the CJS build are emitted
- [x] 4.2 Add a `prebuild` script to the React package that runs `npm run build --workspace @webmobix/form-components` (or a guard) so `src/components/components.ts` is regenerated before `tsc` runs on a fresh clone
- [x] 4.3 Confirm the root `npm run build` iterates workspaces with `form-components` before `form-components-react` (alphabetical `packages/*`); if not, adjust ordering via an explicit root `build` script or a `turbo`/`pnpm -r` ordering mechanism
- [x] 4.4 Run `pnpm install` at the repo root to register the new workspace and link `@webmobix/form-components` into `@webmobix/form-components-react`

## 5. Build and verify

- [x] 5.1 Run `npm run build --workspace @webmobix/form-components` and confirm `packages/form-components-react/src/components/components.ts` is regenerated with `createComponent`-based exports for `WbCanvas`, `WbFormField`, `WbFormRenderer`, `WbInspector`, `WbPalette`
- [x] 5.2 Run `npm run build --workspace @webmobix/form-components-react` and confirm `dist/` contains `index.js`, `index.d.ts`, per-component files, and a CommonJS build
- [x] 5.3 Run `npm run build` at the repo root and confirm both `packages/form-components/dist/` and `packages/form-components-react/dist/` are populated without errors
- [x] 5.4 Smoke-test the typed import: in a scratch `.tsx` file, `import { WbCanvas, WbFormRenderer } from '@webmobix/form-components-react'` and run `tsc --noEmit` to confirm types resolve and event handler props (`onWbChange`, `onWbSubmit`, etc.) are present
- [x] 5.5 Smoke-test runtime resolution: `node --input-type=module -e "import('@webmobix/form-components-react').then(m => console.log(Object.keys(m)))"` and confirm the PascalCase component names are exported
- [x] 5.6 Confirm existing Stencil outputs (`dist`, `dist-custom-elements`, `loader`, `docs-readme`) are unchanged and existing web-component consumers are unaffected

## 6. Documentation

- [x] 6.1 Add a short README section (or new `packages/form-components-react/README.md`) documenting the `@webmobix/form-components-react` import path with a React usage snippet (importing a wrapper, passing props, wiring an `on<Event>` handler)
- [x] 6.2 Note the peer-dependency contract (`react`/`react-dom` `>=18`) and Preact compatibility via `preact/compat` aliasing (best-effort)
- [x] 6.3 Note the build ordering requirement (Stencil package builds first) for contributors running standalone React package builds