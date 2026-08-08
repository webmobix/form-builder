import type { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';

// Tag prefix for every component in this collection is "wb-" (see each
// @Component({ tag: 'wb-...' }) below). Keep it globally unique to avoid
// custom-element name collisions in host apps.
export const config: Config = {
  namespace: 'wb-form',
  outputTargets: [
    {
      // Lazy-loaded build for plain-HTML / script-tag consumption.
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      // Tree-shakeable custom elements build for bundler-based consumers
      // (this is what a React or Preact wrapper package would import from).
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      // Dev server for `npm start` only — not shipped.
      type: 'www',
      serviceWorker: null,
    },
    reactOutputTarget({
      outDir: '../form-components-react/src/components/',
      excludeComponents: [],
      includeImportSymbols: true,
    }),
  ],
  testing: {
    browserHeadless: 'new',
  },
};
