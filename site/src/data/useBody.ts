import { useEffect, useState } from 'react';

export type BodyState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; markdown: string };

/**
 * Fetches a single repository body file — raw, NOT sanitized here — from
 * `site/public/bodies/<bodyId>.md` at runtime. Callers must render the
 * returned markdown through `<Markdown />` (never directly), which is the
 * one place the marked -> DOMPurify sanitize pipeline runs.
 *
 * Pass `null` when there's nothing to fetch yet (e.g. catalog still
 * loading) — the hook stays in `loading` state without issuing a request.
 */
export function useBody(bodyId: string | null): BodyState {
  const [state, setState] = useState<BodyState>({ status: 'loading' });

  useEffect(() => {
    if (bodyId === null) {
      setState({ status: 'loading' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });
    const base = import.meta.env.BASE_URL;

    async function load() {
      try {
        const res = await fetch(`${base}bodies/${bodyId}.md`);
        if (!res.ok) {
          throw new Error(`Failed to fetch body ${bodyId}: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        if (!cancelled) {
          setState({ status: 'ready', markdown: text });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', error: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bodyId]);

  return state;
}
