/**
 * Filesystem anchors. This repo has no root `CLAUDE.md` / `.claude/` folder — the four
 * marketplace plugins live under `plugins/<name>/{skills,agents}` and are loaded the same way
 * `claude --plugin-dir` loads them. PLUGIN_DIRS/ALL_PLUGIN_CONFIGS are the single source of that
 * mapping, consumed by workflowTask (via the SDK's `Options.plugins`) and by artifacts/load.ts.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { SdkPluginConfig } from "@anthropic-ai/claude-agent-sdk";

const HERE = dirname(fileURLToPath(import.meta.url));
export const EVALS_DIR = join(HERE, "..", "..");
export const REPO_ROOT = join(EVALS_DIR, "..");
export const RESULTS_DIR = join(EVALS_DIR, "results");

/** The four marketplace plugins, by name, each a `plugins/<name>` directory. */
export const PLUGIN_DIRS: Record<string, string> = {
  "engineering-paved-path": join(REPO_ROOT, "plugins", "engineering-paved-path"),
  "research-tools": join(REPO_ROOT, "plugins", "research-tools"),
  "architecture-review": join(REPO_ROOT, "plugins", "architecture-review"),
  "sdd-engineering": join(REPO_ROOT, "plugins", "sdd-engineering"),
};

/**
 * `{ type: "local", path }` per plugin — the in-process equivalent of stacking four
 * `--plugin-dir` flags. workflowTask passes this straight through as `Options.plugins`.
 */
export const ALL_PLUGIN_CONFIGS: SdkPluginConfig[] = Object.values(PLUGIN_DIRS).map((path) => ({
  type: "local",
  path,
}));
