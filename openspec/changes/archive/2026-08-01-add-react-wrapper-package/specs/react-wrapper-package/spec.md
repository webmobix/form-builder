## ADDED Requirements

### Requirement: Dedicated React wrapper package exists in the workspace
The repository SHALL contain a workspace package named `@webmobix/form-components-react` located at `packages/form-components-react/` that compiles and re-exports the Stencil-generated React wrapper components. The package SHALL declare `@webmobix/form-components` as a workspace dependency (`workspace:*`) so the underlying custom-element classes resolve at runtime.

#### Scenario: Package is a pnpm workspace member
- **WHEN** the root `pnpm-workspace.yaml` globs `packages/*`
- **THEN** `packages/form-components-react/` is recognized as a workspace package and `pnpm install` links `@webmobix/form-components` into it

#### Scenario: Package depends on the Stencil package
- **WHEN** the React package's `package.json` `dependencies` is inspected
- **THEN** it lists `"@webmobix/form-components": "workspace:*"` so the custom-element classes the wrappers import are resolvable

### Requirement: React wrapper package build compiles to JS and type declarations
The `@webmobix/form-components-react` package SHALL provide a `build` script that runs `tsc` and emits ESM JavaScript and `.d.ts` type declarations into a `dist/` directory (and a CommonJS build). After `npm run build --workspace @webmobix/form-components-react` completes, `dist/` SHALL contain compiled `.js` and `.d.ts` files for the entry and the generated wrapper components.

#### Scenario: Build produces ESM output and declarations
- **WHEN** `npm run build --workspace @webmobix/form-components-react` is run after the Stencil package has been built
- **THEN** the package's `dist/` directory contains `index.js` and `index.d.ts` (ESM) and a CommonJS build, plus per-component compiled files

#### Scenario: Build fails if the generated source is missing
- **WHEN** `npm run build --workspace @webmobix/form-components-react` is run before the Stencil package has generated `src/components/components.ts`
- **THEN** the build SHALL produce the generated source first (via a `prebuild` step that builds the Stencil package) so a fresh clone can build the React package standalone

### Requirement: Generated wrapper source lives inside the React package source tree
The Stencil React output target's `outDir` SHALL point at `packages/form-components-react/src/components/` so the generated `components.ts` is located within the React package's source tree and is consumed by that package's `tsc` build. The generated file SHALL be regenerated on every `@webmobix/form-components` build.

#### Scenario: Stencil build writes the generated file into the React package
- **WHEN** `npm run build --workspace @webmobix/form-components` completes
- **THEN** `packages/form-components-react/src/components/components.ts` exists and contains `createComponent`-based React wrapper exports for every Stencil component

#### Scenario: React package entry re-exports the generated wrappers
- **WHEN** the React package's `src/index.ts` is inspected
- **THEN** it re-exports everything from `./components/components` so `import { WbCanvas } from '@webmobix/form-components-react'` resolves

### Requirement: React wrapper package declares React as a peer dependency
The `@webmobix/form-components-react` package SHALL declare `react` and `react-dom` as peer dependencies (`>=18.0.0`) so consumers provide their own React instance. The package SHALL declare `@stencil/react-output-target` as a runtime `dependency` because the generated wrappers import its runtime at module load.

#### Scenario: Peer dependencies encode the React contract
- **WHEN** the React package's `package.json` `peerDependencies` is inspected
- **THEN** it contains `"react": ">=18.0.0"` and `"react-dom": ">=18.0.0"`

#### Scenario: Runtime dependency on the Stencil React runtime
- **WHEN** the React package's `package.json` `dependencies` is inspected
- **THEN** it contains `@stencil/react-output-target` (not only in `devDependencies`) so it ships on install

### Requirement: React wrapper package exposes typed component exports
The `@webmobix/form-components-react` package SHALL export one PascalCase React component per Stencil web component (e.g. `WbCanvas`, `WbFormField`, `WbFormRenderer`, `WbInspector`, `WbPalette`) with props typed from the Stencil `Components.*` interfaces and `on<Event>` handlers for each emitted custom event. The exports SHALL be available from the package root.

#### Scenario: Importing a wrapper from the package root resolves with types
- **WHEN** a consumer writes `import { WbCanvas } from '@webmobix/form-components-react'`
- **THEN** TypeScript resolves the import to a typed React component whose props include the `WbCanvas` Stencil props and `onWbChange`, `onWbFieldSelected`, `onWbFieldDeselected`, `onWbFieldUpdated` event handlers

#### Scenario: Each Stencil component has a corresponding React wrapper export
- **WHEN** the React package's compiled `dist/index.js` exports are enumerated
- **THEN** there is one PascalCase export per Stencil component in the `form-components` package

### Requirement: Stencil package exposes component subpath exports for wrapper imports
The `@webmobix/form-components` package SHALL expose `./dist/*` and `./components/*` subpath exports so the generated React wrappers (in the separate React package) can import the per-component custom-element classes and the `Components` types. The Stencil package SHALL NOT expose a `./react` subpath export and SHALL NOT include `react/` in its `files` array.

#### Scenario: Component subpath export resolves a custom-element class
- **WHEN** a module imports `@webmobix/form-components/components/wb-canvas.js` (or the equivalent `./dist/components/wb-canvas.js` path the generated wrapper uses)
- **THEN** the import resolves to the compiled custom-element class for `wb-canvas`

#### Scenario: No React subpath remains on the Stencil package
- **WHEN** the `exports` map of `packages/form-components/package.json` is inspected
- **THEN** there is no `./react` key and the `files` array does not include `react/`

### Requirement: Root build produces both packages in correct order
Running `npm run build` at the repository root SHALL build `@webmobix/form-components` before `@webmobix/form-components-react` so the generated `components.ts` and the `dist/components/*` outputs exist before the React package's `tsc` build runs.

#### Scenario: Root build emits both Stencil and React outputs
- **WHEN** `npm run build` is run at the repository root
- **THEN** both `packages/form-components/dist/` and `packages/form-components-react/dist/` are populated and the React package build succeeds without a missing-generated-source error

#### Scenario: Standalone React package build works on a fresh clone
- **WHEN** `npm run build --workspace @webmobix/form-components-react` is run on a clone where no prior build has run
- **THEN** the build succeeds because a `prebuild` step regenerates `src/components/components.ts` via the Stencil build