import { Config } from '@stencil/core';

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
    // Next step, once form-core's field types stabilize: add the React
    // output target here (`@stencil/react-output-target`), which generates
    // typed React wrapper components with correct prop/event bindings.
    // Preact consumers can then alias react/react-dom -> preact/compat in
    // their bundler and use the same generated wrappers, rather than us
    // hand-rolling a separate Preact output target.
  ],
  testing: {
    browserHeadless: 'new',
  },
};
