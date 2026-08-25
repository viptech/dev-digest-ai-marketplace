# architecture-review

Ships the `architecture-reviewer` agent — a generalized, read-only
architectural-review agent extracted and generalized from the DevDigest
engineering harness.

## What `architecture-reviewer` does

- Checks a project's code against its own already-codified architectural
  boundaries — it never invents new architecture opinions the codebase
  hasn't already chosen.
- Discovers its rubric at runtime from the project being reviewed: if
  `engineering-paved-path:onion-architecture` is installed (or another
  architecture-pattern skill), it applies that as the primary rubric via
  its namespaced name; otherwise, or in addition, it reads the target
  project's own architecture-level instructions (root/module-level
  project-instructions files, `ARCHITECTURE.md`, `docs/architecture*.md`,
  etc.).
- Reports findings as severity + `file:line` evidence + verification
  reasoning — never vague or generic advice — and separates out anything
  that looks like a style/quality/security/plan-conformance concern into a
  "Not architecture (out of scope)" section instead of folding it into
  findings.
- Has no `Write` or `Edit` tools — it is read-only and cannot change code.

## Dependency on `engineering-paved-path`

`architecture-review` depends on `engineering-paved-path@^1.0.0` because
`architecture-reviewer` uses that plugin's `onion-architecture` skill as
one possible rule source (when installed) — not because it requires it
unconditionally; the agent also falls back to reading the target project's
own codified conventions when no architecture-pattern skill is present.

## Install

Standalone:

```
/plugin install architecture-review@dev-digest-ai-marketplace
```

This will also install its `engineering-paved-path` dependency.

## Dependencies

Depends on `engineering-paved-path@^1.0.0`. `architecture-review` is in
turn depended on by `sdd-engineering`.
