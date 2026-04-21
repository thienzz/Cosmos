import { fileURLToPath, URL } from 'node:url';

import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
    setupFiles: ['src/engine/__tests__/setup.ts'],
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    server: {
      // Tone.js' ESM build uses extensionless intra-package imports that
      // vite-node's default Node resolver chokes on. Pre-bundling forces
      // Vite to rewrite them through its own resolver, matching the
      // browser/build behaviour. T31 — required by the audio backend tests.
      deps: {
        inline: ['tone'],
      },
    },
  },
});
