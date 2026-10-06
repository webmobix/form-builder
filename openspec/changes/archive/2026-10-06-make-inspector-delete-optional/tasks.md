# Tasks

## 1. Inspector `showDeleteFieldButton` prop

- [x] 1.1 In `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`, add `@Prop() showDeleteFieldButton: boolean = true;` and guard both Delete-button render sites (the `designType` design-element panel and the data-field panel) so the button renders only when `showDeleteFieldButton !== false`. Verify `pnpm --filter @webmobix/form-components test` passes and the type checks.
- [x] 1.2 Add unit tests to `packages/form-components/src/components/wb-inspector/wb-inspector.unit.test.tsx` covering: the Delete button renders in both the data-field and design-element panels when the prop is unset/default; the button is absent in both panels when `showDeleteFieldButton={false}`; and clicking the visible Delete button still emits `wbInspectDelete` with the selected id. Verify `pnpm --filter @webmobix/form-components test` passes.

## 2. Dev harness demonstration

- [x] 2.1 In `packages/form-components/src/index.html`, add a checkbox (e.g. "Inspector delete button") that toggles `inspector.showDeleteFieldButton`, next to the existing builder/export controls. Verify with `pnpm --filter @webmobix/form-components start` (a Stencil dev server; Stencil's `build --serve` opens the default browser unless `--no-open` is passed, so the `start` script SHALL include `--no-open` and no browser window may be opened) that unchecking hides the Delete button for the selected element in both panels and re-checking restores it, with the canvas "×" delete still working.

## 3. Generated docs and wrapper types

- [x] 3.1 Run `pnpm --filter @webmobix/form-components build` to regenerate Stencil outputs. It SHALL NOT open a browser window: the plain `stencil build` (no dev server) opens nothing, and any serving variant used for inspection SHALL pass `--no-open` (Stencil's `build --serve` defaults `devServer.openBrowser` to `true`). Confirm `packages/form-components/src/components/wb-inspector/readme.md`, `packages/form-components/src/components.d.ts`, and the `packages/form-components-react` generated wrapper listings/types include the new `showDeleteFieldButton` prop.

## 4. Repair target spec structure

- [x] 4.1 Repair the pre-existing malformed target spec `openspec/specs/element-deletion/spec.md`: it currently starts with the leftover delta header `## ADDED Requirements` instead of a main-spec header, so its requirements are unparsed and archive would refuse to apply this change's delta. Convert it to the proper main-spec structure (a `# element-deletion Specification` title, a `## Purpose` of 50+ characters, and a `## Requirements` section containing the existing requirement blocks). Verify with `openspec validate make-inspector-delete-optional` that the "target spec is structurally invalid" info is gone and `openspec list --specs` reports a non-zero requirement count for `element-deletion`.

## 5. Integration verification

- [x] 5.1 Run `pnpm test` and `pnpm lint` from the repo root and confirm both pass with no regressions.
