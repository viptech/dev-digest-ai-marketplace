# evals

Behavior evals for the extracted plugin marketplace: `engineering-paved-path`, `research-tools`,
`architecture-review`, `sdd-engineering`. This proves the extracted `sdd-engineering` composition
— loaded purely from `plugins/**` via the Claude Agent SDK's local-plugin config, no `.claude/`
folder anywhere in this repo, no DevDigest file ever read — behaves per the lab Крок 7 behavior
checklist (`L08/04-hands-on-lab.md:234-266`), including the negative case (AC-9).

Plain **vitest + the Claude Agent SDK**, npm (this repo's package manager throughout, per
`docs/specs/marketplace-extraction/architecture.md`'s Stack decision — never pnpm here, even
though the source engine below is pnpm). Runs on the Claude Code **subscription** — the API key
is stripped from spawned processes. No API token, no external services.

## What this is (and is not)

This is **not** a re-run of `dev-digest/evals`. It is a small, purpose-built copy of the parts of
that engine needed for this repo's scenario:

- Source engine: [`dev-digest/evals`](https://github.com/viptech/dev-digest/tree/main/evals) —
  see its own `README.md` for the full statistics/repeat/delta/benchmark tooling and the
  OpenRouter/LiteLLM-proxy backend, both deliberately **not** copied here.
- What changed in the copy: the source engine loads the real on-disk harness via
  `settingSources: ["project"]` and hardcodes `.claude/skills` / `.claude/agents` paths — neither
  applies here (there is no root `CLAUDE.md` or `.claude/` folder in this repo). This subset's
  `workflowTask` instead passes `plugins: ALL_PLUGIN_CONFIGS` (the SDK's `Options.plugins` field,
  the in-process equivalent of stacking four `--plugin-dir` flags) with `settingSources: []`.
  Every skill/agent artifact is identified by a `(plugin, name)` pair, not a single namespace.
- What was dropped entirely: the OpenRouter/LiteLLM-proxy backend (`runtime/dispatch.ts`,
  `runtime/run-openrouter.ts`, `proxy/`), and all statistics/CLI tooling (`stats.ts`, `repeat.ts`,
  `delta.ts`, `benchmark.ts`, `compare.ts`, `trend-reporter.ts`, `scaffold.ts`,
  `skill-quality.ts`) — this eval set is small enough not to need it yet (mirrors the source
  README's own "convert once you approach ~15-20 cases" guidance).

## Per-plugin `evals/` — intentionally unused

Every `plugins/<name>/evals/` directory is empty for v1.0.0 by design. This root `evals/` package
is the **single source of behavior coverage** across all four plugins; per-plugin `evals/` stays
unpopulated until a future release decides otherwise.

## Install & run

```bash
cd evals
npm ci
npm run typecheck        # tsc --noEmit — no LLM call
npm run eval:workflow    # the sdd-workflow suite (model-backed, real subscription calls)
npm run eval:agents      # the spec-creator quality case
```

## Real vs structural — which cases actually ran

Per the confirmed scope for this phase, only **two** cases were actually executed against the
subscription; every other case in `evals/workflow/sdd-workflow/` is structurally valid only
(compiles, follows the `WorkflowCase`/`QualityCase` shape, matches the `run*Cases` DSL) but was
not run for real in this phase. Do not read "compiles" as "passed" for the structural-only rows.

| Case | File | Checklist item | Status |
|---|---|---|---|
| `does not activate on an unrelated prompt (AC-9)` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 8 (negative eval) | **Ran for real — passed** |
| `produces a dark-mode-toggle feature spec without implementation details` | `agents/spec-creator/spec-creator.cases.ts` | 1 | **Ran for real — passed (2/3), with a real finding** (see `CHANGELOG.md`: the draft names `localStorage` as the persistence mechanism, an implementation detail leaking into a feature spec) |
| `implementation-planner reads the given spec` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 2 | Structural only |
| `run-plan dispatches the implementer subagent` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 3 | Structural only |
| `run-plan's review gate dispatches plan-verifier and architecture-review:architecture-reviewer` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 4, 5 | Structural only |
| `workflow-retro activates on an explicit request` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 6 (positive) | Structural only |
| `workflow-retro does NOT activate on a near-miss outcome question` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 6 (negative) | Structural only |
| `the namespaced sdd-engineering:run-plan skill loads and engages cleanly` | `workflow/sdd-workflow/sdd-workflow.cases.ts` | 7 | Structural only |

See `CHANGELOG.md` for the run log (dates, commands, outcomes, and one framework-level fix the
first proof-of-concept run surfaced).

## Module layout — `src/` (this subset's engine)

```
src/
  config.ts             # tunables: EVAL_MODEL, EVAL_JUDGE_MODEL, MAX_TURNS, thresholds, tool allow-lists
  ansi.ts               # color constants (log.ts only)
  git.ts                # gitInfo() — short sha + dirty flag, used by record.ts
  runtime/
    env.ts              # subscriptionEnv() — strips ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN
    run-claude.ts        # runClaude() — headless turn-loop; Result/RunOptions/Metrics; RunOptions.plugins
  artifacts/
    paths.ts             # REPO_ROOT / PLUGIN_DIRS / ALL_PLUGIN_CONFIGS / RESULTS_DIR
    load.ts               # skillContent(plugin, name), agentContent(plugin, name), agentTools(plugin, name)
    fixture.ts            # fixtureReader(import.meta.url)
  tasks.ts                # skillTask(prompt, plugin, name) / agentTask(...) / workflowTask(prompt)
  scoring/
    pattern-match.ts       # patternMatch() — deterministic substring coverage
    llm-judge.ts            # llmJudge() — binary PASS/FAIL per practice, verbatim evidence required
  logging/
    log.ts                  # logTrace(), logVerdict()
  records/
    record.ts                # record() → results/records.jsonl + results/outputs/<run>/<slug>.md
  dsl/
    describe.ts               # describeSkill / describeAgent / describeWorkflow
    case.ts                    # SkillCase / AgentCase / WorkflowCase; runSkillCases / runAgentCases / runWorkflowCases
  index.ts                     # barrel — the only import surface for eval files
```

## Case layout

```
evals/
  agents/spec-creator/
    spec-creator.eval.ts    # describeAgent("spec-creator", () => runAgentCases("sdd-engineering", "spec-creator", cases))
    spec-creator.cases.ts
  workflow/sdd-workflow/
    sdd-workflow.eval.ts     # describeWorkflow("sdd", () => runWorkflowCases(cases))
    sdd-workflow.cases.ts
    fixtures/dark-mode-request.ts
```

`skills/` is not populated in this phase (no case needed one yet) but follows the same shape as
`agents/` — `describeSkill(name, () => runSkillCases(plugin, name, cases))`.

## Safety

Sessions run with `permissionMode: "bypassPermissions"`, so `workflowTask` keeps a **read-only
allow-list** (`Read, Grep, Glob, Task, Agent, Skill` — no `Bash`/`Write`/`Edit`). `agentTask`
strips `Write`/`Edit`/`NotebookEdit`/`Bash` from whatever tools an agent declares in frontmatter,
even when the agent (e.g. `spec-creator`) declares them for production use.

This allow-list is enforced via `Options.tools` (the field the SDK docs name for actually
restricting which built-in tools exist), not `Options.allowedTools` alone — the latter only
auto-approves tools without a permission prompt and does **not** remove anything from the
model's available tools on its own. `run-claude.ts` sets both. See `CHANGELOG.md` for the real
proof-of-concept run that caught this gap in the originally-copied `allowedTools`-only version.

`results/` is gitignored and append-only — deleting it is always safe.

## Out of scope for this phase

- `.github/workflows/validate.yml` — CI wiring, deferred to a separate initiative.
- The full behavior checklist run for real — capped at one negative + one representative
  positive case (see the table above).
- OpenRouter / LiteLLM proxy backend — not copied.
- Statistics tooling (`repeat`/`delta`/`benchmark`/`compare`/`scaffold`) — not copied.
