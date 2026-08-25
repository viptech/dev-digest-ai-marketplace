import { useEffect, useState } from 'react';
import type { CatalogStats, IndexEntry, ReleasesByPlugin } from '../types/catalog';

export interface CatalogData {
  index: IndexEntry[];
  releases: ReleasesByPlugin;
  stats: CatalogStats;
}

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: CatalogData };

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * Loads the generated catalog data (index.json / releases.json / stats.json)
 * from the same-origin `public/` path at runtime via `fetch()` — no
 * bundler-time import, since these files don't exist at scaffold time; they
 * are produced by `npm run build:index` (repo root) before `vite dev` /
 * `vite build` runs. See site/README.md for the required build order.
 *
 * `import.meta.env.BASE_URL` (not a hardcoded '/') keeps this correct if
 * the production build is ever served from a sub-path.
 */
export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;

    async function load() {
      try {
        const [index, releases, stats] = await Promise.all([
          fetchJson<IndexEntry[]>(`${base}index.json`),
          fetchJson<ReleasesByPlugin>(`${base}releases.json`),
          fetchJson<CatalogStats>(`${base}stats.json`),
        ]);
        if (!cancelled) {
          setState({ status: 'ready', data: { index, releases, stats } });
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
  }, []);

  return state;
}
