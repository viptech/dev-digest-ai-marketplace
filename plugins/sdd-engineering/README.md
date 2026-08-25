# sdd-engineering

Ships the spec-driven-development (SDD) workflow: four agents
(`spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`)
and three skills (`run-plan`, `workflow-retro`, `engineering-insights`).

## The workflow

```
spec-creator → implementation-planner → run-plan
                                            │
                                            ├─ implementer
                                            └─ plan-verifier /
                                               architecture-review:architecture-reviewer
                                               (review gate, up to 3 fix rounds)
```

- **`spec-creator`** (agent) — turns a request into a written spec with
  EARS-style acceptance criteria.
- **`implementation-planner`** (agent) — turns an approved spec into an
  ordered Development Plan.
- **`run-plan`** (skill) — executes an already-approved plan: dispatches
  `implementer`, then loops `plan-verifier` and
  `architecture-review:architecture-reviewer` against the diff, feeding any
  failing/critical findings back to `implementer` for up to 3 rounds before
  escalating to the user.
- **`implementer`** (agent) — does the actual code changes for one plan
  step at a time, applying whatever architecture/framework skills the plan
  or the codebase calls for (including `engineering-paved-path`'s skills,
  invoked by their namespaced name when relevant).
- **`plan-verifier`** (agent) — checks a diff or working tree against the
  plan/spec's stated requirements, item by item.
- **`workflow-retro`** (skill) — manual-only retrospective of a finished
  multi-agent run: tokens, cache reads, tool calls, duration, and
  parallelism, turned into concrete process changes.
- **`engineering-insights`** (skill) — captures non-obvious findings from a
  session (a confirmed fix, a gotcha, a measured number) into the
  `INSIGHTS.md` of whichever module the work touched.

**Not included in this release**: `doc-writer` and `test-writer`. Both were
present in the source harness this workflow was extracted from, but are
deliberately out of scope for `1.0.0` — a documentation pass or a
test-writing pass is left to the consuming project's own workflow, if it
has one. This may be revisited in a future `1.1.0+`.

## Where this workflow creates files

- **Specs** — `docs/specs/<module>/SPEC-NN-*.md` (or the consuming
  project's own equivalent location, if `spec-creator` discovers one
  already in use).
- **Plans** — `.claude/plans/<slug>.md`.

Neither location is created if it doesn't already fit the target project's
conventions — both agents ask rather than assume when the project's own
layout is unclear.

## Dependency on `engineering-paved-path`, `research-tools`, `architecture-review`

`sdd-engineering` depends on all three other plugins in this marketplace:

- **`engineering-paved-path@^1.0.0`** — `implementer` invokes this
  plugin's shared engineering-practice skills (e.g.
  `engineering-paved-path:onion-architecture`) by namespaced reference
  whenever a plan or the codebase calls for one, instead of re-implementing
  that guidance locally.
- **`research-tools@^1.0.0`** — `spec-creator` and `implementation-planner`
  can delegate read-only research (repository or web) to this plugin's
  `researcher` agent instead of doing ad hoc investigation themselves.
- **`architecture-review@^1.0.0`** — `run-plan`'s review loop uses this
  plugin's `architecture-reviewer` agent as its independent architecture
  check, alongside `plan-verifier`'s own plan/spec-conformance check.

## Install

```
/plugin install sdd-engineering@dev-digest-ai-marketplace
```

The installer resolves the three dependencies above automatically — you
don't need to install `engineering-paved-path`, `research-tools`, or
`architecture-review` separately first.

## Dependencies

Depends on `engineering-paved-path@^1.0.0`, `research-tools@^1.0.0`, and
`architecture-review@^1.0.0`. `sdd-engineering` is the top-level plugin in
this marketplace — nothing else depends on it.
