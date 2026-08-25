import { defineConfig } from "vitest/config";

// This subset drops the statistics/trend-reporting tooling from the source engine
// (dev-digest/evals) — no custom reporter is wired in here. See README.md.
export default defineConfig({
  test: {
    // *.eval.ts = model-backed evals; src/**/*.test.ts = any pure unit tests, if added later.
    include: ["**/*.eval.ts", "src/**/*.test.ts"],
    // Real Claude sessions (and a subagent dispatch) are slow — give them room.
    testTimeout: 240_000,
    hookTimeout: 240_000,
    // One session per test; a few files can run concurrently. Keep it modest to stay cheap.
    fileParallelism: true,
  },
});
