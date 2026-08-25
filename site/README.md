# site — catalog SPA

The GitHub Pages plugin catalog: a Vite + React + TypeScript single-page app
with a hand-written hash router (no `react-router`), MiniSearch-backed
search, and `marked` + `DOMPurify` markdown rendering for README/SKILL.md/
agent/CHANGELOG content.

Routes: `#/`, `#/search`, `#/plugin/<name>`, `#/artifact/<id>`, `#/whats-new`,
and `#/getting-started` are all implemented. The plugin detail page also
renders a dependency-graph visualization and version/compatibility badges
(Phase 3.3).

## Data contract

This app reads `public/index.json`, `public/releases.json`,
`public/stats.json`, and `public/bodies/**/*.md` at **runtime** via
`fetch()` — they are not bundled at build time and do not exist until
generated. They're produced by `scripts/build-index.mjs` at the repo root
and are gitignored (see root `.gitignore`).

**Build order matters.** Before running any command below, generate the
data once from the repo root:

```sh
npm run build:index
```

This is a manual prerequisite, not wired into `site`'s own npm lifecycle
scripts (`predev`/`prebuild`) — keeping it explicit avoids surprising a
contributor who runs `npm run dev` inside `site/` without realizing it
silently regenerates catalog data from the current state of `plugins/`.

## Commands

Run from this directory (`site/`), after `npm run build:index` has been run
from the repo root at least once:

```sh
npm ci        # install dependencies
npm run dev   # start the Vite dev server
npm run build # production build -> site/dist/
npm run preview # serve the production build locally
npm test      # run the Vitest suite (router, search, plugin page smoke test)
```

## Security invariant

Every markdown-rendering call site (README, SKILL.md, agent body,
CHANGELOG) MUST render through `src/components/Markdown.tsx`, the one
component that sanitizes `marked.parse()` output with `DOMPurify.sanitize()`
before insertion into the DOM. See `src/markdown/renderMarkdown.ts` for the
full invariant text. Do not add a second markdown-rendering path.

## i18n

Every UI string routes through `src/i18n/useT.ts`, a `useT('key')` hook
backed by the flat dictionary at `src/i18n/en.json`. A missing key falls
back to the literal key string rather than throwing. English-only for
v1.0.0 — no component should ever hardcode a literal UI string.
