# Changelog — evals

Tracks which cases were actually executed against the Claude Code subscription vs. which are
structurally valid only (typechecked, not run for real). See `README.md`'s real-vs-structural
table for the full case-by-case breakdown.

## Unreleased

- Scaffolded the `evals/` package: engine subset adapted from `dev-digest/evals/src/` (see
  `README.md` for what changed and what was dropped), the `sdd-workflow` workflow case suite
  (8 checklist items from lab Крок 7 / `architecture.md:131-145`), and the `spec-creator`
  quality case, all against the shared dark-mode-toggle fixture.
- Real proof-of-concept runs (per the confirmed phase scope), executed by the orchestrating
  session on 2026-08-25 against the subscription:
  - [x] `workflow/sdd-workflow` → `does not activate on an unrelated prompt (AC-9)` — negative
        case, checklist item 8. **Passed**, both before and after the `tools:` fix below (0 tool
        calls either way — an unrelated prompt never gave the model a reason to reach for one).
  - [x] `agents/spec-creator` → `produces a dark-mode-toggle feature spec without implementation
        details` — representative positive case, checklist item 1. **Passed** (2/3 practices,
        threshold 0.6) after two fixes below. Reproduced twice with the same real finding: the
        drafted spec's EARS section is genuinely good, but it names `localStorage` as the
        persistence mechanism — a real, repeatable spec-creator quality gap (implementation
        detail leaking into a feature spec), not a fluke of one run.
- **Fix — `spec-creator.cases.ts` prompt**: the first proof-of-concept run spent its entire
  10-turn budget exploring this repo's actual filesystem (`Read` on root `README.md`,
  `INSIGHTS.md`, unrelated `site/src/**` files) instead of drafting the spec, so the judge scored
  the model's opening "I'll start by exploring..." sentence rather than a real draft — a
  false-passing case, not a caught defect. Fixed by telling the prompt explicitly not to explore
  the repo (all four clarification-gate answers are already given) and raising `maxTurns` to 15
  as a margin. Re-run: 1 turn, 0 tool calls, a complete real draft judged.
- **Fix — `src/runtime/run-claude.ts` (framework-level, affects every case, not just this one)**:
  the first run's trace showed `spec-creator` calling `Bash` even though `agentTools()` correctly
  computed an allow-list with `Bash`/`Write`/`Edit` already stripped. Root cause: the SDK's
  `Options.allowedTools` only auto-approves tools *without a permission prompt* — its own doc
  comment says "To restrict which tools are available, use the `tools` option instead"
  (`sdk.d.ts`). `run-claude.ts` was only ever setting `allowedTools`, inherited as-is from
  `dev-digest/evals`, so the "mutating tools stripped" safety property this package's own
  `README.md` claims was not actually enforced — under `permissionMode: "bypassPermissions"`,
  every built-in tool remained silently available and auto-executing regardless of the computed
  allow-list. Fixed by also passing `tools: allowedTools` (the field that actually restricts).
  Re-verified: both proof-of-concept cases still pass after the fix, and the `spec-creator` case's
  tool trace is now genuinely empty rather than merely reporting a list that wasn't enforced.
  **This same gap likely exists in the source `dev-digest/evals` engine this package was copied
  from** (`dev-digest/evals/src/runtime/run-claude.ts` uses the identical pattern) — worth a
  separate look there, outside this phase's scope.
