/**
 * Barrel — the single import surface for eval files (`*.eval.ts` / `*.cases.ts`).
 * Trimmed to what this subset's engine actually provides — see README.md for what the source
 * engine (dev-digest/evals) has that this package deliberately drops.
 */

// Case DSL — what eval files actually use.
export { describeSkill, describeAgent, describeWorkflow } from "./dsl/describe.js";
export {
  runSkillCases,
  runAgentCases,
  runWorkflowCases,
  activated,
  type SkillCase,
  type AgentCase,
  type WorkflowCase,
  type QualityCase,
} from "./dsl/case.js";

// Lower-level pieces, exported for the occasional bespoke test.
export { skillTask, agentTask, workflowTask } from "./tasks.js";
export { runClaude, type Result, type RunOptions, type Metrics } from "./runtime/run-claude.js";
export { patternMatch } from "./scoring/pattern-match.js";
export { llmJudge, type Verdict } from "./scoring/llm-judge.js";
export { logTrace, logVerdict } from "./logging/log.js";
export { skillContent, agentContent } from "./artifacts/load.js";
export { fixtureReader } from "./artifacts/fixture.js";
export * from "./artifacts/paths.js";
