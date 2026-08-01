## ADDED Requirements

### Requirement: React wrapper components SHALL be generated from web components
The package SHALL produce typed React wrapper components for every Stencil component declared in the library, generated via `@stencil/react-output-target` from the `dist-custom-elements` build.

#### Scenario: Build emits React wrappers
- **WHEN** `npm run build` is run in `packages/form-components`
- **THEN** a `react/` directory is emitted containing generated wrapper source, an `index.js` entry, and `index.d.ts` type declarations

#### Scenario: Each component has a typed wrapper
- **WHEN** a Stencil component `wb-foo` with public props and events is built
- **THEN** the generated React output exposes a `Foo` PascalCase wrapper component whose props reflect the Stencil component's public props, and whose `onFooBar` handlers map to the component's emitted events

### Requirement: React wrappers SHALL be consumable via a subpath export
The package SHALL expose a `./react` export mapping to the generated wrapper entry, with corresponding TypeScript types, so React consumers can import wrappers without pulling React into the main entry's module graph.

#### Scenario: React consumer imports a wrapper
- **WHEN** a React app does `import { Foo } from '@webmobix/form-components/react'`
- **THEN** the wrapper component resolves, is typed, and renders the underlying `wb-foo` custom element

#### Scenario: Plain-HTML consumer unaffected
- **WHEN** a non-React consumer imports `@webmobix/form-components` (main entry) or the loader
- **THEN** no React code is required or transitively loaded

### Requirement: React and React-DOM SHALL be peer dependencies
The package SHALL declare `react` and `react-dom` as peer dependencies (React 18+) so wrappers use the consumer's React instance and avoid duplicate React copies.

#### Scenario: Peer dependency declared
- **WHEN** the published `package.json` is inspected
- **THEN** `react` and `react-dom` are listed under `peerDependencies` with a `>=18.0.0` range, and are NOT bundled into the generated React output

### Requirement: Existing output targets SHALL remain unchanged
Adding the React output target SHALL NOT alter the existing `dist`, `dist-custom-elements`, `loader`, or `docs-readme` outputs or their public entry points.

#### Scenario: Existing consumer behavior preserved
- **WHEN** a consumer using the `dist-custom-elements` build upgrades to a version that includes the React target
- **THEN** their existing imports and custom element behavior continue to work without code changes

### Requirement: Generated React output SHALL be included in published files
The package `files` array SHALL include the generated `react/` directory so wrappers ship when the package is published.

#### Scenario: Published package contains wrappers
- **WHEN** the package is packed/published
- **THEN** the `react/` directory (with `index.js`, `index.d.ts`, and component wrappers) is present in the tarball