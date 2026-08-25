# research-tools

Ships the `researcher` agent — a generic, read-only research agent for
repository and web research.

## What `researcher` does

- Conducts repository research (code, configs, docs, git history) and
  external research (the web), producing evidence-cited findings — every
  claim in its report is backed by a `file:line`, quote, or URL.
- Asks clarifying questions first when a request is vague or lacks a
  concrete question to investigate.
- Has no `Write` or `Edit` tools — it never makes code changes, only
  reports findings.

## Install

Standalone, no dependencies:

```
/plugin install research-tools@dev-digest-ai-marketplace
```

## Dependencies

None. `research-tools` has no dependencies of its own, and is depended on
by `sdd-engineering`.
