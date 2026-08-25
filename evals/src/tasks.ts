/**
 * The three ways to run a case. Each composes runtime + artifacts; nothing here talks to the
 * SDK directly.
 *
 *   skillTask / agentTask — inject the artifact's content as system prompt, load NO on-disk
 *     plugin config → measures the artifact's CONTENT in isolation. Every artifact is identified
 *     by a (plugin, name) pair since there is no single-namespace `.claude/` here.
 *   workflowTask — load the plugins the real harness would load, via the SDK's `Options.plugins`
 *     (the in-process equivalent of `--plugin-dir` x4) → measures the SYSTEMIC effect: does a
 *     skill activate, does a subagent dispatch, do namespaced cross-plugin references resolve.
 */

import { IS_BASELINE, WORKFLOW_ALLOWED_TOOLS } from "./config.js";
import { runClaude, type RunOptions } from "./runtime/run-claude.js";
import { skillContent, agentContent, agentTools } from "./artifacts/load.js";
import { ALL_PLUGIN_CONFIGS } from "./artifacts/paths.js";

/**
 * Run a prompt with a skill's content injected (the 'candidate' condition). Under
 * EVAL_CONFIG=baseline the artifact is NOT injected — that is the benchmark's without-skill
 * baseline, i.e. the raw model, used to measure the skill's lift.
 */
export function skillTask(prompt: string, plugin: string, skillName: string, opts: RunOptions = {}) {
  const systemPrompt = IS_BASELINE ? undefined : skillContent(plugin, skillName);
  return runClaude(prompt, { ...opts, systemPrompt });
}

/**
 * Run a prompt with a subagent's definition injected as the system prompt (baseline: none).
 *
 * A subagent is a TOOL-USING artifact — its whole method is "read the docs, grep the imports".
 * Running it content-only (no tools) both contradicts its own body ("you have Read/Glob/Grep")
 * and trips runClaude's "you have NO tools" directive, which makes a doc-grounded reviewer refuse
 * or downgrade every finding to `cannot-verify`. So we hand it exactly the tools it declares in
 * frontmatter and let it run from REPO_ROOT (runClaude's default cwd), the way production does.
 * Both conditions (candidate + baseline) get the same tools so the measured lift stays fair.
 */
export function agentTask(prompt: string, plugin: string, agentName: string, opts: RunOptions = {}) {
  const systemPrompt = IS_BASELINE ? undefined : agentContent(plugin, agentName);
  const allowedTools = agentTools(plugin, agentName);
  return runClaude(prompt, { allowedTools, ...opts, systemPrompt });
}

/**
 * Run a prompt against the plugin tree loaded the way `claude --plugin-dir` (x4) would load it.
 * Use for workflow-level evals: skill activation, subagent dispatch, namespaced cross-plugin
 * skill references. Ignores EVAL_CONFIG — the workflow tier has its own control-vs-treatment
 * design (see `kind: "contrast"` in dsl/case.ts).
 *
 * Safety: keep allowedTools a read-only allow-list (no Bash/Write/Edit) — a fresh session
 * with bypassPermissions could otherwise take real actions in the repo.
 */
export function workflowTask(prompt: string, opts: RunOptions = {}) {
  return runClaude(prompt, {
    allowedTools: WORKFLOW_ALLOWED_TOOLS,
    ...opts,
    plugins: ALL_PLUGIN_CONFIGS,
    settingSources: [],
  });
}
