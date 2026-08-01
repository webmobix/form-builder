# @webmobix/form-components-react

React wrappers for the [`@webmobix/form-components`](../form-components) Stencil web components. Each Stencil component is exposed as a typed PascalCase React component with idiomatic prop/event bindings.

## Install

```bash
npm install @webmobix/form-components-react @webmobix/form-components react react-dom
```

`react` and `react-dom` are peer dependencies (`>=18.0.0`) — consumers provide their own React instance.

## Usage

```tsx
import { WbCanvas, WbFormRenderer } from '@webmobix/form-components-react';
import { useState } from 'react';

function FormBuilder() {
  const [fields, setFields] = useState([]);

  return (
    <WbCanvas
      onWbChange={(e) => setFields(e.detail)}
      onWbFieldSelected={(e) => console.log('selected', e.detail)}
    />
  );
}
```

- Props are typed from the Stencil `Components.*` interfaces.
- Emitted custom events are exposed as `on<Event>` handler props (e.g. `onWbChange`, `onWbSubmit`, `onWbFieldSelected`, `onWbPaletteDragEnd`). The handler receives a `CustomEvent` with the Stencil event `detail`.
- Custom elements self-register on first use (no manual `defineCustomElement` call required).

Available components: `WbCanvas`, `WbFormField`, `WbFormRenderer`, `WbInspector`, `WbPalette`.

## Peer dependency contract

- `react` and `react-dom` must be `>=18.0.0`. The wrappers use a single shared React instance to avoid duplicate hook state.
- **Preact compatibility (best-effort):** alias `react` and `react-dom` to `preact/compat` in your bundler config. The wrappers rely only on the `compat`-compatible React API surface.

## Build ordering (for contributors)

The React package's `src/components/components.ts` is **generated** by the Stencil build (`@webmobix/form-components`). It is gitignored and regenerated on every Stencil build.

- The React package's `prebuild` script runs the Stencil build first, so `npm run build --workspace @webmobix/form-components-react` works standalone on a fresh clone.
- The root `npm run build` builds workspaces alphabetically, so `form-components` builds before `form-components-react` — the generated `components.ts` and `dist/components/*` outputs exist before the React `tsc` build runs.

If you build the React package standalone, the `prebuild` step ensures the generated source exists first.