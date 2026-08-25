# Cost baseline

Records the cost-experiment methodology and results for the marketplace harness, per lab Крок 8
and `docs/specs/marketplace-extraction/architecture.md`'s Cost baseline experiment flow (AC-6).

## Methodology

- Fixed scenario: the two cases in `evals/` that are actually run for real against the
  subscription (see `evals/README.md`'s real-vs-structural table) — the `spec-creator` quality
  case (dark-mode-toggle fixture) and the `AC-9` negative-activation case.
- 3 repeats per case, before and after (one extra `spec-creator` repeat was run while
  investigating a failure — see Before table; included honestly rather than discarded).
- Model: `claude-haiku-4-5` (`evals/src/config.ts`'s `EVAL_MODEL`), held constant across both
  measurements — no model or routing change in this experiment, per the invariant.
- Before: commit `837e545`, clean tree. After: same commit, dirty tree (the optimization edit
  was not committed between measurements — each `records.jsonl` entry carries its own
  `git_sha`/`dirty` field, which is how before/after rows are distinguished below, not by
  clearing `results/` between runs).
- Optimization applied: removed the duplicated diff-artifact-reuse explanation from
  `plugins/sdd-engineering/agents/plan-verifier.md` (Step 0) and
  `plugins/architecture-review/agents/architecture-reviewer.md` (`# Input`), replacing each with
  a short pointer to `plugins/sdd-engineering/skills/run-plan/SKILL.md`, which keeps the one full
  explanation. Neither the model nor any routing/dispatch logic changed — only prompt text
  length in two always-loaded agent files.
- Cost estimate: token counts below are real and verified (from `evals/results/records.jsonl`);
  the dollar figures use the published `claude-haiku-4-5` list rate as understood at the time of
  writing (~$1/M input tokens, ~$5/M output tokens) — treat this rate as approximate and verify
  against Anthropic's current published pricing before treating the dollar column as exact. Token
  counts, not the dollar conversion, are the primary evidence here.

## Before (commit `837e545`, clean tree)

| Case | n | median input tok | median output tok | median latency | pass rate | est. cost/run |
|---|---|---|---|---|---|---|
| `spec-creator` (dark-mode) | 4 | 10 | 4,625 | 46.8s | 3/4 | ~$0.023 |
| `AC-9` negative | 3 | 10 | 470 | 5.8s | 3/3 | ~$0.0024 |

Critical failure observed (1 of 4 `spec-creator` runs, `outcome: false`, score 1/3): the drafted
spec named a concrete storage shape (`` `{ theme: 'light' | 'dark' }` `` framed as a code
snippet) and referenced "standard CSS transitions" as part of the solution — both
implementation-detail leaks the practice checks are designed to catch. This is a real,
pre-existing `spec-creator` quality gap (confirmed reproducible across multiple runs during
Phase 4's own proof-of-concept work too), not something this phase's optimization was expected to
fix — `spec-creator.md` itself was not edited in this phase.

## After (commit `837e545`, dirty tree — `plan-verifier.md` + `architecture-reviewer.md` trimmed)

| Case | n | median input tok | median output tok | median latency | pass rate | est. cost/run |
|---|---|---|---|---|---|---|
| `spec-creator` (dark-mode) | 3 | 10 | 3,022 | 28.0s | 3/3 | ~$0.015 |
| `AC-9` negative | 3 | 10 | 539 | 6.2s | 3/3 | ~$0.0027 |

## Result: **within noise — no attributable effect, honestly**

The raw numbers show `spec-creator`'s median output tokens dropping ~35% and its pass rate
improving from 3/4 to 3/3. **This is not attributable to the optimization and must not be
reported as a saving.** Neither real eval case exercises the two files that were actually
edited:

- `spec-creator`'s case is a content-isolated `agentTask` that injects only
  `spec-creator.md` as the system prompt — it never loads, dispatches, or references
  `plan-verifier.md` or `architecture-reviewer.md` in any way. `spec-creator.md` itself was not
  touched by this phase's edit.
- The `AC-9` case is a `workflowTask` on a plainly unrelated prompt ("a good weeknight recipe
  using chickpeas") that, correctly, dispatches nothing at all (`tools: [], subagents: [],
  skills: []` on every one of the 6 runs) — it never reaches `plan-verifier` or
  `architecture-reviewer` either.

There is no causal path from the edited files to either measured case, so the observed
before/after movement (in both directions — `spec-creator` improved, `AC-9`'s numbers moved
slightly the *other* way, output tokens 470→539) is ordinary model-response variance on an
unmodified prompt path, not a measurable effect of the change. Per the architecture spec's
invariant ("IF a cost-baseline delta falls within run-to-run noise, THEN the system shall record
it as within noise... rather than reporting an invented saving"), this experiment's honest
conclusion is: **the optimization's cost/latency effect could not be measured by this baseline**,
because the fixed scenario this repo currently has real (subscription-verified) coverage for
does not exercise the two trimmed files. The real value of the trim is prompt-length and
maintenance hygiene (removing a divergence risk between three copies of the same rule) for
whichever future case exercises `run-plan`'s review loop (lab Крок 7 checklist items 3-5,
currently structural-only per `evals/README.md`) — not a cost win demonstrated by this
experiment.

**Quality-gate check (independent of the cost question):** pass rate held at or above the before
rate for both cases (3/4→3/3 for `spec-creator`, 3/3→3/3 for `AC-9`) — no regression, so the edit
is safe to keep on its own merits (removes a real 3-way text duplication, `claude plugin
validate` stays green on both edited plugins) even though this phase found no measurable
cost/latency delta to attribute to it.

## Raw data

Full per-run records: `evals/results/records.jsonl` (gitignored — regenerate by re-running
`npm run eval:agents` / the filtered `AC-9` workflow command from `evals/`, per
`evals/README.md`'s Install & run section). This document's tables are a snapshot taken
2026-08-25.
