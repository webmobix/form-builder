## 1. Dependencies

- [x] 1.1 Add `@stencil/react-output-target` to `packages/form-components` devDependencies (range compatible with `@stencil/core` ^4.27 || ^5)
- [x] 1.2 Add `react` and `react-dom` to `packages/form-components` peerDependencies (`>=18.0.0`); add `@types/react` to devDependencies for type generation
- [x] 1.3 Run `npm install` at the repo root to update lockfile

## 2. Stencil Config

- [x] 2.1 Import `reactOutputTarget` from `@stencil/react-output-target` in `stencil.config.ts`
- [x] 2.2 Add the `react` output target to `outputTargets`, pointing `outDir` to `react/`, with `excludeComponents: []`, `includeImportSymbols: true`, and `customElementsExportBehavior` left to the existing `dist-custom-elements` target
- [x] 2.3 Remove the placeholder TODO comment about the React output target from `stencil.config.ts`
- [x] 2.4 Ensure the `react` target is declared AFTER the `dist-custom-elements` target so the custom-elements build is available for wrapper generation

## 3. Package Exports & Files

- [x] 3.1 Add a `./react` entry to `packages/form-components/package.json` `exports` mapping to `./react/index.js` (import), `./react/index.cjs.js` (require), `./react/index.d.ts` (types)
- [x] 3.2 Add `react/` to the `files` array so generated wrappers ship on publish
- [x] 3.3 Update the package `description` to mention React wrapper availability

## 4. Build & Verification

- [x] 4.1 Run `npm run build --workspace @webmobix/form-components` and confirm the `react/` directory is emitted with `index.js`, `index.d.ts`, and component wrapper files
- [x] 4.2 Verify generated wrappers expose PascalCase component exports whose props reflect each Stencil component's public props and `on<Event>` handlers for emitted events
- [x] 4.3 Confirm existing `dist`, `dist-custom-elements`, `loader`, and `docs-readme` outputs are unchanged (diff `dist/` before/after if needed)
- [x] 4.4 Smoke-test the `./react` export resolves with TypeScript: `node -e "require('./packages/form-components/react/index.js')"` and a quick `tsc --noEmit` import check in a scratch file

## 5. Documentation

- [x] 5.1 Add a short section to `packages/form-components/README.md` (or create one) documenting the `@webmobix/form-components/react` import path and an example React usage snippet
- [x] 5.2 Note Preact compatibility via `preact/compat` aliasing, with the caveat that it is best-effort