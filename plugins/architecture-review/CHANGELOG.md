# Changelog

## 1.0.0 — Initial extraction

The `architecture-reviewer` agent extracted and generalized from the
DevDigest engineering harness; hardcoded DevDigest-specific rule sources
were replaced with runtime discovery of the consuming project's own
conventions.

Trimmed `architecture-reviewer.md`'s `# Input` section's diff-artifact-
reuse explanation from a full restatement to a short pointer, using the
namespaced `sdd-engineering:run-plan` cross-plugin form since the
canonical explanation lives in a different plugin (cost-optimization
pass, Phase 5).
