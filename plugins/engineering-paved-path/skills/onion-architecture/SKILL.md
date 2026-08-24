---
name: onion-architecture
description: Forces onion/hexagonal layering for a backend organized in onion/hexagonal layers — domain logic with no I/O, services depending on DI-resolved ports, adapters at the edge. Use this whenever adding or reviewing code in a backend's modules, adapters, or composition-root/DI-container directories; whenever wiring a new external integration (LLM provider, GitHub, git, Slack, webhook, feature-flag source, anything outside-the-process); or whenever the question is "where should this code/logic live" for a backend feature — even if the user never says "onion" or "hexagonal". Also trigger when you notice a route file importing an adapter directly, a service importing a concrete adapter class instead of a container-resolved interface, or a pure-domain package growing a DB/fs/network dependency.
---

# Onion Architecture (Backend)

## Why this exists

A backend built this way has a DI container (a composition root) specifically
so adapters can be swapped for mocks in tests, and a pure-domain package that
is deliberately DB/fs-free so it stays hermetically testable. That property
degrades one shortcut at a time: one route that imports an adapter directly,
one service that `new`s a concrete class instead of asking the container.
None of those shortcuts break anything the day they're written — they break
the next person's ability to test in isolation or swap an integration without
a rewrite. This skill exists to stop that erosion at review time, not to
introduce a new pattern.

## The rule

Dependencies point inward, one direction only. A layer knows about the layer
below it through an interface; it never imports a concrete implementation
from a layer further out.

```
routes.ts  --calls-->  service.ts  --depends on ports-->  adapters/<kind>/*.ts
   |                        |                                      ^
   |                        v                                      |
   |                  repository.ts --(ORM)--> db                  |
   |                                                                 |
   +----------------------- never -------------------------------->-+
```

| Layer | Lives at | Depends on | Never depends on |
|---|---|---|---|
| Domain (pure logic) | a pure-domain package | nothing external; only an injected provider interface | DB, fs, network, the rest of the app |
| Service (orchestration) | `modules/<name>/service.ts` | port/interface types resolved via a DI `Container` | concrete adapter classes, `adapters/**` imports |
| Repository (data access) | `modules/<name>/repository.ts` | the ORM/DB client | HTTP concerns |
| Ports (interfaces) | a shared types package | nothing | any concrete adapter |
| Adapters (port implementations) | `adapters/<kind>/*.ts` | the external SDK/API they wrap | other adapters, services |
| Composition root | `platform/container.ts` (or equivalent) | everything (lazily) — this is the **one** place concrete adapters get imported and wired | — |
| HTTP translation | `modules/<name>/routes.ts` | `service.ts` only | `adapters/**`, the DB client |

The composition root is not a violation of the rule — it's the deliberate
exception the rule needs. Everywhere else, "point inward" is absolute.

## Red flags — what to catch

**1. A route importing an adapter or the DB client directly.**

```ts
// modules/pulls/routes.ts — BAD
import { GitHubApiClient } from '../../adapters/github/api-client.js';
app.get('/pulls/:id', async (req, reply) => {
  const client = new GitHubApiClient(...);   // routes never construct adapters
  ...
});
```
Fix: route calls `service.something(...)`; the service already holds the
adapter via `this.container`.

**2. A service importing a concrete adapter class instead of a port type.**

```ts
// service.ts — BAD
import { LocalGitClient } from '../../adapters/git/local-git.js';
constructor(private container: Container) {
  this.git = new LocalGitClient();   // bypasses the container entirely
}
```
Fix: `this.git = container.git;` (or whatever the container's lazy getter is
named) — the concrete class is only ever named inside `container.ts`.

**3. A new external integration added without the full chain.** Adding
"just the adapter" and importing it straight into a service produces
something that works today and can't be mocked tomorrow. See the workflow
below — a new integration is never one file.

**4. The pure-domain package acquiring I/O.** Anything in that package
importing `fs`, a DB client, or making a network call *outside* the injected
provider interface breaks the "input in, result out, no side effects"
contract the whole package is built on.

**5. Data-access logic leaking into `service.ts`.** Raw ORM queries belong in
`repository.ts`; a service method that builds its own `db.select()` is
skipping a layer, not simplifying anything.

None of these are hard failures to flag reflexively — a two-line script or a
one-off migration doesn't need this ceremony. The rule matters once code
takes a dependency that a future test or a future swap-out will need to
intercept.

## Workflow: adding a new external integration

Whether it's a new LLM provider, a Slack notifier, a webhook receiver, or a
feature-flag source — the shape is always the same five steps:

1. **Define the port.** An interface in a shared types package (if other
   packages need the type) or a local `types.ts` (if it's module-private).
   Name it for the capability, not the vendor (`Notifier`, not
   `SlackClient`).
2. **Implement the adapter.** `adapters/<kind>/<vendor>.ts`, implementing
   the port. This is the only file allowed to import the vendor SDK.
3. **Add a mock.** `adapters/mocks.ts` (or a module-local mock) implementing
   the same port, so tests never hit the real network. Look at whatever mock
   provider/client already exists in the codebase for the pattern in use.
4. **Wire it into `Container`.** A private field + lazy getter, matching the
   shape of the other adapter getters already in `platform/container.ts`.
   Tests inject the mock through a container-overrides mechanism.
5. **Consume the port, not the class.** The service takes the interface type
   from the container; it never imports step 2's file.

Skipping straight to step 2 and importing it from a service is the most
common shortcut — it works immediately and quietly removes the ability to
test that code path without a live network call.

## Workflow: "where does this code go?"

When the question is placement rather than a new integration, resolve it by
what the code *does*, not where it's convenient to type it:

- Talks HTTP (headers, status codes, request parsing) → `routes.ts`
- Orchestrates a multi-step operation, decides business outcomes → `service.ts`
- Reads/writes the database via the ORM → `repository.ts`
- Wraps a specific external system (git, GitHub, an LLM, secrets) → `adapters/<kind>/`
- Pure transformation with no I/O, reusable across a processing pipeline → the pure-domain package

If a change genuinely spans two of these, that's normal — a feature usually
touches route + service + repository together. The violation is a *layer
being skipped*, not a feature touching multiple layers.

## Applying this in a new project

This skill describes a pattern, not a specific codebase. When you adopt it in
a consuming project, first identify:

- your composition root (where concrete adapters get wired — often
  `platform/container.ts` or equivalent),
- your pure-domain package (if one exists — the part of the system with zero
  ambient I/O),
- your existing mock/test-double convention for adapters.

Once those are identified, the rest of this skill's guidance applies as-is.

## Out of scope

Frontend component/file placement and PR-hygiene concerns are outside this
skill's scope — use whatever placement or review conventions your project
defines for those.

## Quick checklist

- [ ] Does `routes.ts` call only `service.ts`?
- [ ] Does `service.ts` reference the port type, resolved via `container`,
      never a concrete `adapters/**` class?
- [ ] Is ORM access confined to `repository.ts`?
- [ ] New external dependency → port + adapter + mock + container wiring, all
      four, not just the adapter?
- [ ] Still true that the pure-domain package has no DB/fs/network beyond the
      injected provider interface?
</content>
