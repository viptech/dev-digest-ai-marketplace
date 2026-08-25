/**
 * WorkflowCase[] covering the lab Крок 7 behavior checklist (L08/04-hands-on-lab.md:255-264,
 * architecture.md:131-145). Every case loads the four marketplace plugins purely via
 * `Options.plugins` (see tasks.ts's workflowTask / paths.ts's ALL_PLUGIN_CONFIGS) — no
 * `.claude/skills` or `.claude/agents` path is read anywhere in this repo.
 *
 * Checklist-item → case mapping (each case's comment repeats which item it covers so the
 * mapping is never implicit):
 *
 *   1. spec-creator produces a spec without implementation details
 *        → NOT here — see evals/agents/spec-creator/spec-creator.cases.ts (QualityCase, judged).
 *   2. implementation-planner reads the given spec rather than inventing requirements
 *        → "implementation-planner reads the given spec" (kind: trace)
 *   3. run-plan dispatches implementer
 *        → "run-plan dispatches the implementer subagent" (kind: dispatch)
 *   4. the review gate invokes architecture-review:architecture-reviewer
 *   5. plan-verifier checks acceptance criteria
 *        → 4 and 5 combined into one session: "run-plan's review gate dispatches plan-verifier
 *          and architecture-review:architecture-reviewer" (kind: trace) — cheaper than two
 *          separate dispatch cases per the DSL comment's own tradeoff note.
 *   6. workflow-retro runs only on an explicit request (negative: does NOT run unprompted)
 *        → two activation cases, positive + near-miss negative.
 *   7. namespaced skills load without warnings
 *        → "the run-plan skill (namespaced sdd-engineering:run-plan) loads and engages
 *          cleanly" (kind: trace, asserts isError === false alongside skill engagement)
 *   8. negative eval: the SDD workflow does not activate on an unrelated prompt (AC-9)
 *        → "does not activate on an unrelated prompt (AC-9)" (kind: activation, shouldActivate:
 *          false) — this is the negative proof-of-concept case required to actually run for
 *          real against the subscription (see README.md's real-vs-structural table).
 */

import type { WorkflowCase } from "../../src/index.js";
import { DARK_MODE_REQUEST } from "./fixtures/dark-mode-request.js";

// A minimal, already-approved-looking plan doc reference for the run-plan / implementer cases —
// no product-specific path, table, or module name; a generic plan-file shape only.
const PLAN_PROMPT =
  `There is an already-approved Development Plan at .claude/plans/dark-mode-toggle.md that ` +
  `implements: ${DARK_MODE_REQUEST} Use the sdd-engineering:run-plan skill to execute it.`;

const PLANNER_PROMPT =
  `There is an approved feature spec at docs/specs/settings/SPEC-01-dark-mode-toggle.md ` +
  `describing: ${DARK_MODE_REQUEST} Use the implementation-planner subagent to read that spec ` +
  `and turn it into a Development Plan. Do not invent requirements beyond what the spec says — ` +
  `read the spec file first.`;

export const cases: WorkflowCase[] = [
  // Checklist item 2 — implementation-planner reads the given spec rather than inventing
  // requirements. Structurally valid only in this phase (not part of the two real runs).
  {
    kind: "trace",
    name: "implementation-planner reads the given spec",
    prompt: PLANNER_PROMPT,
    expectSubagents: ["implementation-planner"],
    expectFilesRead: ["docs/specs/settings/SPEC-01-dark-mode-toggle.md"],
    maxTurns: 6,
  },

  // Checklist item 3 — run-plan dispatches implementer. Structurally valid only.
  {
    kind: "dispatch",
    name: "run-plan dispatches the implementer subagent",
    prompt: PLAN_PROMPT,
    expectSubagent: "implementer",
    maxTurns: 6,
  },

  // Checklist items 4 + 5 — the review gate invokes architecture-review:architecture-reviewer
  // and plan-verifier checks acceptance criteria. One session, both asserted (see run-plan's own
  // SKILL.md, which names the loop as "plan-verifier / architecture-review:architecture-reviewer").
  // Structurally valid only.
  {
    kind: "trace",
    name: "run-plan's review gate dispatches plan-verifier and architecture-review:architecture-reviewer",
    prompt: PLAN_PROMPT,
    expectSubagents: ["implementer", "plan-verifier", "architecture-review:architecture-reviewer"],
    maxTurns: 10,
  },

  // Checklist item 6 (positive) — workflow-retro runs on an explicit request.
  // Structurally valid only.
  {
    kind: "activation",
    name: "workflow-retro activates on an explicit request",
    prompt: "The dark-mode-toggle plan just finished. /workflow-retro",
    skill: "workflow-retro",
    shouldActivate: true,
    maxTurns: 4,
  },

  // Checklist item 6 (negative, near-miss) — a prompt about the same workflow's OUTCOME must
  // NOT trigger a retro on its own. Structurally valid only.
  {
    kind: "activation",
    name: "workflow-retro does NOT activate on a near-miss outcome question",
    prompt: "Did the dark-mode-toggle plan finish? How many rounds did the review loop take?",
    skill: "workflow-retro",
    shouldActivate: false,
    maxTurns: 4,
  },

  // Checklist item 7 — namespaced skills load without warnings. Asserts the sdd-engineering
  // plugin's run-plan skill actually engages and the session completes without error.
  // Structurally valid only.
  {
    kind: "trace",
    name: "the namespaced sdd-engineering:run-plan skill loads and engages cleanly",
    prompt: PLAN_PROMPT,
    expectSkills: ["run-plan"],
    maxTurns: 6,
  },

  // Checklist item 8 — negative eval (AC-9): the SDD workflow must NOT activate on a plainly
  // unrelated prompt. This is one of the two cases required to actually run for real against
  // the subscription in this phase (see README.md).
  {
    kind: "activation",
    name: "does not activate on an unrelated prompt (AC-9)",
    prompt: "What's a good weeknight dinner recipe that uses chickpeas?",
    skill: "spec-creator",
    shouldActivate: false,
    maxTurns: 4,
  },
];
