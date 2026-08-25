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

// Multi-requirement fixture for the 1.1.0 blocking-gate case (AC-5). Two earlier, harder attempts
// at this fixture (a numbered "(1)(2)(3)" list, and a six-requirement flowing-prose version) both
// passed 4/4 and 6/6 respectively against the UNEDITED 1.0.0 spec-creator.md — the underlying
// model (`claude-haiku-4-5`, see evals/src/config.ts) is thorough enough to cover every concrete,
// clearly-statable requirement on its own, gate or no gate. What it consistently does NOT do
// reliably is turn a genuinely vague, hard-to-formalize requirement into either a checkable AC-N
// or an explicit Open-questions entry — it tends to just narrate it in prose and move on, exactly
// the failure mode the 1.1.0 gate exists to catch. This version adds two such vague requirements
// (a fuzzy performance feel, an unspecified cancel affordance) plus a competing "keep it focused"
// instruction that gives the model an incentive to drop something rather than pad the draft.
const EXPORT_BUTTON_REQUEST =
  "Add a CSV export button to the reports screen. Clicking it downloads the current report as a " +
  "CSV file. While the report is still loading, keep the button disabled so nobody exports a " +
  "half-loaded report. The button needs to work for keyboard-only users too, and its " +
  "disabled/enabled state should be announced to screen readers — we've had complaints before " +
  "about controls that go silent for assistive tech. If the export fails for any reason (the " +
  "report data expired, a backend error, whatever), show the user an explicit error instead of " +
  "silently downloading a broken or empty file. Exports should feel fast and responsive even on " +
  "our biggest reports — nobody should be left staring at a spinner wondering if anything is " +
  "happening. We'd also like some way for a user to back out of an export that's taking a while, " +
  "rather than being stuck waiting. Keep the spec focused — this is a small feature, don't pad " +
  "it out with sections it doesn't need.";

const MULTI_REQUIREMENT_PROMPT =
  `${EXPORT_BUTTON_REQUEST}\n\n` +
  `Spec type: feature spec. Module: reports (create docs/specs/reports/ if it does not exist yet; ` +
  `this is a new, small module in a project that has none of its own architecture spec yet, so ` +
  `skip citing an architecture.md). Design source: none provided — base the spec on typical ` +
  `reports-screen UI conventions. This does not supersede any existing spec. All four ` +
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
  {
    // 1.1.0 blocking-gate case (AC-5). The two vague requirements (a fuzzy "feels fast"
    // performance expectation, an unspecified cancel affordance) are the ones most likely to get
    // summarized in prose and never promoted to a checkable AC-N or flagged as an Open question —
    // that's the specific failure mode the 1.1.0 gate exists to close off, and it's the load-
    // bearing pair of practices below. The other three (loading-disabled, accessibility,
    // error-state) are kept as a baseline — both versions should pass these regardless.
    //
    // Honest result, per AC-5's own "fails or is not applicable on 1.0.0" clause
    // (architecture.md:628-631): after three escalating fixture attempts (a numbered list, six
    // flowing-prose requirements, then this two-vague-requirement version), the unedited 1.0.0
    // `spec-creator.md` still scored 5/5 (100%) on this exact fixture — `claude-haiku-4-5` is
    // thorough enough to cover even genuinely ambiguous requirements without the blocking-gate
    // instruction, at least in single-shot generation on a small, focused prompt. The 1.1.0-edited
    // version then scored 4/5 (80%, still above this case's 0.8 threshold) on the same fixture —
    // backwards from what a clean "before fails, after passes" story would show, and with n=1 per
    // side this is ordinary LLM sampling variance, not a real regression from the edit. Conclusion:
    // this specific case does not reliably discriminate 1.0.0-vs-1.1.0 behavior on this model —
    // AC-5's "not applicable" branch, not a demonstrated pass/fail pair. The case stays in the
    // suite anyway (it's a legitimate spec-creator quality bar on its own merits), but do not cite
    // it as version-discriminating evidence without first re-running it N>1 times per side to get
    // a real signal above the sampling noise.
    name: "covers every named requirement, including the vague ones, with an AC-N or an explicit open question (AC-5)",
    kind: "quality",
    prompt: MULTI_REQUIREMENT_PROMPT,
    practices: [
      "the draft's Acceptance criteria section has at least one AC-N covering the button being disabled while the report is loading",
      "the draft's Acceptance criteria section has at least one AC-N covering the accessibility requirement (keyboard usability and/or screen-reader announcement of the button's state) — or, if not, the Open questions section explicitly names it as unresolved",
      "the draft's Acceptance criteria section has at least one AC-N covering the error-state requirement (an explicit error message shown when the export fails, instead of downloading a broken file) — or, if not, the Open questions section explicitly names it as unresolved",
      "the draft's Acceptance criteria section has at least one AC-N covering the 'exports should feel fast/responsive even on large reports' requirement — or, if not, the Open questions section explicitly names this performance expectation as unresolved (needs a concrete threshold)",
      "the draft's Acceptance criteria section has at least one AC-N covering a way for the user to cancel an in-progress export — or, if not, the Open questions section explicitly names the cancel affordance as unresolved",
    ],
    threshold: 0.8,
    maxTurns: 15,
  },
];
