## 1. Data Model

- [x] 1.1 Add `required?: boolean` to the `FieldMeta` interface in `packages/form-core/src/types.ts`

## 2. Inspector UI

- [x] 2.1 Add a "Required" checkbox to the inspector render method in `packages/form-components/src/components/wb-inspector/wb-inspector.tsx`, visible for all field types
- [x] 2.2 Add `onRequiredChange` handler that emits `wbFieldUpdated` with `{ required: true/false }` in the patch

## 3. Form Renderer

- [x] 3.1 Forward `required` prop from `FieldMeta` to `wb-form-field` in `packages/form-components/src/components/wb-form-renderer/wb-form-renderer.tsx`

## 4. Verify

- [x] 4.1 Run existing tests to confirm no regressions: `pnpm -r test`
- [x] 4.2 Build the project to confirm no type errors: `pnpm -r build`
