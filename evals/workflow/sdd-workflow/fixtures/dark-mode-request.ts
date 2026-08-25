/**
 * Shared fixture prompt for the sdd-workflow eval suite — the fixed scenario from
 * architecture.md:140-145: a small, generic UI feature with no product-specific module, table,
 * or file path named. Every case that needs the scenario imports this string rather than
 * re-typing it, so wording never drifts between cases.
 */

export const DARK_MODE_REQUEST =
  "Add a dark-mode toggle to the settings screen: a switch the user can flip to " +
  "switch the whole app between a light and a dark theme, with the chosen theme " +
  "persisted across reloads and applied on next launch.";
