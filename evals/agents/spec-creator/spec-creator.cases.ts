/**
 * QualityCase for checklist item 1 (L08/04-hands-on-lab.md:255-264): "spec-creator produces a
 * spec without implementation details." Content-isolated (agentTask injects spec-creator.md as
 * the system prompt, no on-disk plugin loading) — judged, not trace-asserted, because "no
 * implementation-detail language" is a content property, not something a tool trace can show.
 *
 * Uses the same dark-mode-toggle fixture as the workflow suite (architecture.md:140-145).
 *
 * This is one of the two cases required to actually run for real against the subscription in
 * this phase (see README.md's real-vs-structural table) — the representative positive case.
 */

import type { AgentCase } from "../../src/index.js";
import { DARK_MODE_REQUEST } from "../../workflow/sdd-workflow/fixtures/dark-mode-request.js";

// spec-creator's Step 0 is a blocking clarification gate (spec type / module / design source /
// supersedes). Since this eval has no interactive follow-up turn, the prompt answers all four
// up front so the agent proceeds straight to drafting instead of stopping at the gate.
const PROMPT =
  `${DARK_MODE_REQUEST}\n\n` +
  `Spec type: feature spec. Module: settings (create docs/specs/settings/ if it does not exist ` +
  `yet; this is a new, small module in a project that has none of its own architecture spec yet, ` +
  `so skip citing an architecture.md). Design source: none provided — base the spec on typical ` +
  `settings-screen UI conventions. This does not supersede any existing spec. All four ` +
  `clarification-gate questions above are answered already — do not re-ask them, and do not ` +
  `explore the repository (no Read/Grep/Glob/Bash) to look for more context first; you have ` +
  `everything you need in this prompt. Respond with the full feature spec draft text directly, ` +
  `right now, in this turn.`;

export const cases: AgentCase[] = [
  {
    name: "produces a dark-mode-toggle feature spec without implementation details",
    kind: "quality",
    prompt: PROMPT,
    practices: [
      "the draft includes a feature-spec section titled 'Acceptance criteria (EARS)' with at least one AC-N requirement using a shall/WHEN/WHILE/IF/WHERE EARS shape",
      "the draft does not name a specific programming language, framework, library, or UI component/class name as part of implementing the toggle (e.g. no 'useState', 'React', 'CSS variable', 'localStorage API' framed as the solution)",
      "the draft does not include a code snippet",
    ],
    threshold: 0.6,
    maxTurns: 15,
  },
];
