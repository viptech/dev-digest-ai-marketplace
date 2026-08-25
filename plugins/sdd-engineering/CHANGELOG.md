# Changelog

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
