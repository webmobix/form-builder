import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      // Spec tests - stencil environment for component logic
      {
        plugins: [stencilVitestPlugin()],
        test: {
          name: 'unit',
          include: ['src/**/*.unit.test.{ts,tsx}'],
          environment: 'stencil',
          setupFiles: ['./vitest-unit-setup.ts'],
          globals: true,
        },
      },
      // Component browser tests - real browser via Playwright
      {
        test: {
          name: 'browser',
          include: ['src/**/*.cmp.test.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          optimizeDeps: {
            // Pre-bundle these so vite doesn't reload the iframe mid-run
            // (which wipes custom elements and flaky-fails mounting tests).
            include: ['@stencil/core', '@tiptap/core', '@tiptap/extension-placeholder', '@tiptap/starter-kit', '@tiptap/pm', 'dompurify'],
          },
        },
      },
    ],
  },
});
