# dev-digest-ai-marketplace

A standalone Claude Code plugin marketplace that extracts the reusable half
of DevDigest's `.claude/` engineering harness into four installable plugins
— `engineering-paved-path`, `research-tools`, `architecture-review`, and
`sdd-engineering` — published through a `.claude-plugin/marketplace.json`
manifest, with a static discovery catalog served on GitHub Pages.

**Status: scaffolding only, Phase 1 of the extraction** — the top-level
directory structure and root tooling files exist, but no plugin content,
manifest, or site code has landed yet. See the
[`viptech/dev-digest` architecture spec](https://github.com/viptech/dev-digest/blob/main/docs/specs/marketplace-extraction/architecture.md)
for the full multi-phase plan.

## Plugin dependency graph (target)

```mermaid
flowchart TD
    subgraph deps["Dependency plugins (release first)"]
        EPP["engineering-paved-path\n(11 skills, no agents)"]
        RT["research-tools\n(researcher agent)"]
        AR["architecture-review\n(architecture-reviewer agent)"]
    end
    SDD["sdd-engineering\n(spec-creator, implementation-planner,\nimplementer, plan-verifier agents +\nrun-plan, workflow-retro,\nengineering-insights skills)"]

    AR -- "^1.0.0" --> EPP
    SDD -- "^1.0.0" --> EPP
    SDD -- "^1.0.0" --> RT
    SDD -- "^1.0.0" --> AR
```

## Layout

- `plugins/` — the four plugins listed above (stubs for now).
- `docs/` — contribution, site, security, release, and cost-baseline
  documentation. See [`docs/PLUGIN-GUIDELINES.md`](docs/PLUGIN-GUIDELINES.md),
  [`docs/SITE-SPEC.md`](docs/SITE-SPEC.md),
  [`docs/SECURITY.md`](docs/SECURITY.md),
  [`docs/RELEASES.md`](docs/RELEASES.md), and
  [`docs/COST-BASELINE.md`](docs/COST-BASELINE.md).
- `scripts/` — build and release tooling (empty for now).
- `site/` — the GitHub Pages catalog SPA (empty for now).

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for where to start.

## License

[MIT](LICENSE)
