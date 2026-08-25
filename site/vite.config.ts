import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Single config file for both Vite (dev/build/preview) and Vitest (test),
// per the react-testing-library skill's recommended setup. `base` is left
// at the default ('/') — GitHub Pages base-path wiring is Phase 3.4's job
// (site.yml CI), not this sub-plan's.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
