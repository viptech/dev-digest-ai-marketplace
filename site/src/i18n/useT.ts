/**
 * i18n placeholder stub — the real dictionary-backed `useT` and
 * `site/src/i18n/en.json` land in Phase 3.3 (architecture.md:341-347). This
 * minimal version returns the caller-supplied English fallback text
 * directly, so every component already routes its UI strings through a `t`
 * function (no hardcoded literals) and 3.3 only needs to swap this hook's
 * internals for a real dictionary lookup — no call site changes required.
 */
export function useT() {
  return function t(_key: string, fallback: string): string {
    return fallback;
  };
}
