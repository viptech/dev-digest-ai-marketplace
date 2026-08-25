---
name: engineering-insights
description: Capture practical findings from a coding session into the INSIGHTS.md of the module you worked in — non-obvious dependencies, confirmed fixes, measured facts, counterintuitive gotchas — each with file:line evidence and a date. Use this at the end of any coding task that involved real debugging, a non-trivial decision, or a surprising discovery, and also mid-task the moment you hit something non-obvious. Trigger it whenever the user is wrapping up work, asks to record learnings or insights, or when you have just finished untangling something that cost genuine effort — even if they do not say the word "insights".
---

# Engineering Insights

## Why this exists

You live inside a context window. When this session ends, everything you figured
out the hard way is gone — the quirk that cost forty minutes, the dependency
nobody documented, the number you actually measured. The next session starts
cold and pays for the same discovery again.

`INSIGHTS.md` is where the previous version of you leaves notes for the next one.
It only works if the notes are specific enough to act on without re-deriving
them.

## What belongs here — and what does not

This file is **not** documentation, and it is **not** a changelog.

- README and project-instructions files describe how the system is *meant* to
  work. INSIGHTS records what turned out to be true in practice and is not
  visible from the code.
- Git history records what changed. "Added endpoint X" is not an insight.

Write an entry when the session produced one of these:

| Category | What it captures |
|---|---|
| `dependency` | A non-obvious coupling: changing here breaks something over there |
| `fix` | A confirmed fix: symptom → root cause → what actually worked |
| `measured` | A number you observed: timing, limit, threshold, size |
| `gotcha` | Behaviour that contradicts what a reasonable person would assume |
| `decision` | A choice that was made, together with the reason it was made |

Skip trivial tasks. A rename, a typo fix, or a change that went exactly as
expected teaches nobody anything.

## Pick the target file

Write into the `INSIGHTS.md` of whichever module/package the work actually
touched — judged from what you actually read and edited this session, not from
what the task was nominally about:

- If the target project splits into modules/packages (each with its own
  top-level directory), write to that module's own `INSIGHTS.md`
  (`<module>/INSIGHTS.md`), creating it if it doesn't exist yet.
- If the project has no per-module split at all, use a single root-level
  `INSIGHTS.md`.
- When a finding genuinely spans several modules, the root file is the right
  home — duplicating it into each module's file invites the copies to drift.

There is no empty scaffold to fill in — create the file fresh if it's missing.

## Entry format

Entries are written in English by default, in whatever language the project's
own documentation is written in if that differs and the user has established
that convention. Append to the **end** of the file; never insert into the
middle.

```markdown
## YYYY-MM-DD · <category>
**<One-line claim>**
<Why it matters, or what to do about it.>
Evidence: <path:line>
```

Worked example (illustrative only — invented for this template, not a claim
about any specific project):

```markdown
## 2026-07-28 · gotcha
**Integration tests silently skip themselves without a running test
database**
A green run does not by itself prove they executed — check for an explicit
skip notice in the output before treating it as a pass.
Evidence: test/helpers/db-setup.ts:14
```

The `file:line` evidence is not decoration. It is the thing that lets a future
reader verify the claim in five seconds instead of trusting it blindly — and it
doubles as a filter on yourself: **if you cannot point at a line, you are
probably recording a guess rather than a finding.** Point at the line that
demonstrates the claim, and check it still says what you think it says.

## The quality bar

The test: **if this would be obvious to anyone reading the code, do not write it.**

Vague entries feel productive and teach nothing. Compare:

| Weak | Useful |
|---|---|
| "Promises can be tricky" | "`Promise.all()` on the ingest pipeline times out past 30 items — use `Promise.allSettled()` in batches of 10" |
| "Be careful with async state" | "Checkout flow state always goes through the shared store because three components share the cart" |
| "Tests can be flaky" | "Integration tests self-skip without the test database running, so a green run does not prove they ran" |

The difference is that the useful version tells the next reader what to *do*.

Do not write: restatements of code comments, summaries of what you did, textbook
advice, or anything you did not actually verify.

Two or three sharp entries beat ten hedged ones. If nothing this session clears
the bar, say so and write nothing — an empty result is a valid one, and padding
the file makes every real entry harder to find.

## Append-only discipline

Never rewrite or delete an existing entry, even one that turned out to be wrong.
The record of having believed something is itself useful — it stops the next
session from re-adopting the same wrong idea.

When a finding is superseded, append a new dated entry that says so and points
back at the original:

```markdown
## 2026-08-14 · fix
**Supersedes the 2026-07-28 entry about the ingest timeout**
The cause was a missing index, not batch size.
Evidence: db/migrations/0010_ingest_idx.sql:3
```

Around 200 entries in one file, the signal-to-noise ratio starts to drop. That is
the point to prune stale entries or split by domain — mention it to the user
rather than silently letting the file grow.

## Workflow

1. Look back over the session: what did you learn that is not already written
   down somewhere in the repo?
2. Apply the quality bar. Discard anything that fails it.
3. Decide which module each surviving finding belongs to.
4. For each one, locate the `file:line` that demonstrates it and confirm the line
   still supports the claim.
5. Append the entries, then tell the user in one line what you recorded and where,
   so they can spot-check. These notes are a draft under human review, not a
   source of truth — you can summarise incorrectly, and a wrong entry that goes
   unchallenged will mislead every session after it.
