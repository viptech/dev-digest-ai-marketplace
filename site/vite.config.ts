import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Single config file for both Vite (dev/build/preview) and Vitest (test),
// per the react-testing-library skill's recommended setup.
//
// `base` defaults to '/' for local dev/build/preview (asset URLs resolve
// against the server root). GitHub Pages serves this site from a project
// subpath (https://viptech.github.io/dev-digest-ai-marketplace/), not the
// domain root, so a build meant for Pages must set VITE_BASE_PATH — see
// the `env:` block on the "Build site" step in
// .github/workflows/pages.yml. Without this, the built index.html
// references /assets/... instead of /dev-digest-ai-marketplace/assets/...
// and the deployed page loads blank (confirmed live: both paths 404/200
// respectively on the real deployment before this fix).
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
