# engineering-paved-path

Eleven skills covering the recurring engineering-practice questions any
TypeScript/React/Node backend-and-frontend codebase runs into: what pattern
to write, where code should live, and what to check before shipping it. No
agents — this plugin is skills-only.

## Skills

- **react-best-practices** — Modern React component design, state patterns,
  hooks misuse, performance, data fetching, and code organization.
- **react-testing-library** — Testing React components and hooks with React
  Testing Library and Vitest: setup, query priority, userEvent, async
  patterns, mocking.
- **next-best-practices** — Next.js file conventions, RSC boundaries, data
  patterns, async APIs, metadata, error handling, route handlers, image/font
  optimization, and bundling.
- **fastify-best-practices** — Building and debugging Fastify servers and
  REST APIs: routes, plugins, JSON Schema validation, error handling,
  authentication, CORS, WebSockets, and the request lifecycle.
- **onion-architecture** — Enforces onion/hexagonal layering for a backend:
  domain logic with no I/O, services depending on DI-resolved ports,
  adapters wired at the edge through a composition root.
- **drizzle-orm-patterns** — Schema definition, CRUD, relations, queries,
  transactions, and migrations with Drizzle ORM across Postgres, MySQL,
  SQLite, MSSQL, and CockroachDB.
- **postgresql-table-design** — Designing or reviewing a PostgreSQL schema:
  data types, indexing, constraints, performance patterns, and advanced
  features.
- **zod** — Zod schema validation: `z.object` design, parsing/`safeParse`,
  error handling, and composition patterns.
- **typescript-expert** — Type-level programming, performance optimization,
  monorepo management, migration strategies, and modern TypeScript tooling.
- **security** — Web application security based on OWASP Top 10:2025:
  vulnerability review, auth/authorization, input handling, file uploads,
  secrets management, and API endpoint hardening.
- **mermaid-diagram** — Authoring Mermaid diagrams (flowcharts, sequence,
  class, ER, state, and more) in markdown.

## Install

```
/plugin install engineering-paved-path@dev-digest-ai-marketplace
```

## Dependencies

This plugin has no dependencies of its own. It is a dependency of the
`architecture-review` and `sdd-engineering` plugins in this marketplace.
