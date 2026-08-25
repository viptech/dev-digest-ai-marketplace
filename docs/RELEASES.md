# Releases

This document covers this marketplace's SemVer policy, tag convention,
update flow, release channels, and rollback procedure. It applies to every
plugin under `plugins/` (`engineering-paved-path`, `research-tools`,
`architecture-review`, `sdd-engineering`).

## SemVer policy

Each plugin's `.claude-plugin/plugin.json` `"version"` field follows
[SemVer](https://semver.org): `MAJOR.MINOR.PATCH`.

- **Patch** (`1.0.0` → `1.0.1`) — a fix that changes no consumer-visible
  contract: wording/prompt-trim edits, a corrected typo, a doc-only
  clarification, an internal refactor of a skill/agent's instructions that
  doesn't add or remove required inputs or change behavior a consumer
  depends on.
- **Minor** (`1.0.0` → `1.1.0`) — a backward-compatible addition: a new
  agent, a new skill, an optional new field/flag, or a new agent-prompt
  requirement that doesn't break an existing consumer's usage (e.g. a
  planned `doc-writer`/`test-writer` addition to `sdd-engineering`).
- **Major** (`1.0.0` → `2.0.0`) — a breaking change: removing or renaming a
  skill/agent a consumer already depends on, changing a required input's
  shape, or dropping support for a dependency version range a consumer
  relies on.

A plugin's declared `dependencies` field (in its own `plugin.json`) states
the caret range it needs from each dependency, e.g. `^1.0.0` — meaning "any
`1.x.y` at or above `1.0.0`, but not `2.0.0`." Bumping a dependency's major
version is a breaking change for every consumer that declares a `^1.x.x`
range against it; those consumers must bump their own declared range (and
usually their own version) in the same change.

## Tag convention

Every release is a git tag of the exact shape:

```
<plugin>--v<version>
```

for example `engineering-paved-path--v1.0.0`, `sdd-engineering--v1.0.0`.
This is also exactly what the real `claude plugin tag` command creates and
validates against `plugin.json` and the enclosing marketplace entry.

**Tags are immutable once pushed.** A tag never gets force-moved to a new
commit — a fix ships as a new version (new tag), not a rewritten one.
`scripts/release.sh` (see below) never passes `--force` to `claude plugin
tag`; that flag exists for a human to invoke directly, deliberately, when
they intend to override the dirty-tree/tag-exists checks — it is never a
script default.

**Dependencies release before consumers, always.** Because `sdd-engineering`
depends on `engineering-paved-path`, `research-tools`, and
`architecture-review`, and `architecture-review` depends on
`engineering-paved-path`, the release order for a coordinated set of changes
is:

```
engineering-paved-path--v<version>
research-tools--v<version>
architecture-review--v<version>
sdd-engineering--v<version>
```

`scripts/release.sh` enforces this by checking, before it touches git in any
way, that every dependency declared in the target plugin's `plugin.json`
already has a pushed tag whose version satisfies the declared range.

## Update flow

To pick up a new plugin release as a consumer:

```sh
claude plugin marketplace update
claude plugin update <plugin-name>@dev-digest-ai-marketplace
```

A restart of Claude Code (or `/reload-plugins`) is required afterward for
the updated agents/skills to take effect in the current session.

## Release channels

- **`latest`** — the marketplace's default branch/ref (`main`). Consumers
  who add the marketplace source without pinning a ref (`claude plugin
  marketplace add viptech/dev-digest-ai-marketplace`) always resolve to
  whatever is on `main`, which tracks the newest pushed tags.
- **`stable`** — pinned directly to one specific `<plugin>--v<version>` tag,
  using Claude Code's `<owner>/<repo>@<ref>` marketplace-source form, e.g.:

  ```sh
  claude plugin marketplace add viptech/dev-digest-ai-marketplace@sdd-engineering--v1.0.0 --scope project
  ```

  There is no separate maintained `stable` git branch — the immutable-tag
  invariant above already guarantees a pinned ref never moves out from
  under a consumer, so pinning straight to a tag is sufficient.

## Rollback procedure

Use `scripts/rollback.sh <plugin-name> <tag> [--scope project|user|local]
[--execute]` to roll an installed plugin back to a prior tagged release. By
default (no `--execute`) it only prints the exact three-command sequence
(marketplace remove → marketplace add pinned to the target tag → plugin
install) for a human to review before running; pass `--execute` to have it
run the sequence itself, stopping immediately if any command fails.

The script always removes the current marketplace source before re-adding
the pinned one — this repo's `marketplace.json` `"name"` field
(`dev-digest-ai-marketplace`) is fixed regardless of which git ref is
checked out, and adding a second source that resolves to the same name
silently overwrites the first entry instead of erroring (a confirmed Claude
Code bug), so `remove` before `add` is not optional.

See `scripts/rollback.sh` itself for the exact command sequence it emits.
