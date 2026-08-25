# Changelog

## 1.1.0 — Require an acceptance criterion per mandatory requirement

`spec-creator` no longer reports a feature spec complete while any
Goal/User story requirement lacks a corresponding `AC-N` — it either
adds the missing criterion or raises it under `Open questions` first.
Backward-compatible: a spec that already had full AC coverage is
unaffected.

## 1.0.0 — Initial extraction

Four agents (`spec-creator`, `implementation-planner`, `implementer`,
`plan-verifier`) and three skills (`run-plan`, `workflow-retro`,
`engineering-insights`) extracted and generalized from the DevDigest
engineering harness. `sdd-implement` was renamed to `run-plan`, matching the
lab's own canonical name. `doc-writer`/`test-writer` support is dropped for
this release (deferred to a possible 1.1.0+). Hardcoded DevDigest module
names, do-not-touch lists, and language mandates were replaced with
generic instructions that discover or ask for the consuming project's own
equivalents instead of assuming DevDigest's.

Trimmed `plan-verifier.md`'s Step 0 diff-artifact-reuse explanation from a
full restatement to a short pointer at `run-plan`'s existing full
explanation, removing duplicated always-loaded prompt text (cost-
optimization pass, Phase 5).
