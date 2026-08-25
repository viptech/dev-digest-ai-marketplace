import en from './en.json';

const dictionary: Record<string, string> = en;

/**
 * Real i18n hook (Phase 3.3, architecture.md:341-347) — reads the flat
 * `en.json` dictionary. English-only for v1.0.0; the flat key shape leaves
 * room for a second locale file later without a component rewrite (not in
 * scope now).
 *
 * A missing key falls back to the literal key string rather than throwing —
 * that makes a missed dictionary entry visibly wrong in the rendered UI
 * (e.g. `plugin.someNewKey` leaking onto the page) instead of crashing the
 * whole page, which is easier to spot in review/QA than a thrown error
 * during render.
 */
export function useT() {
  return function t(key: string): string {
    return dictionary[key] ?? key;
  };
}
