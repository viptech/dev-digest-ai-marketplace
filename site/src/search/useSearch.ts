import { useEffect, useMemo, useState } from 'react';
import type { IndexEntry } from '../types/catalog';
import { buildSearchIndex, searchEntries } from './searchIndex';

/**
 * Fetches the body text for every catalog entry (needed for MiniSearch's
 * `body` field, per architecture.md:325-327). A failed individual body
 * fetch degrades to an empty body string for that entry rather than
 * blocking search for the rest of the catalog.
 */
function useEntryBodies(entries: IndexEntry[]): Record<string, string> {
  const [bodies, setBodies] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entries.length === 0) return undefined;
    let cancelled = false;
    const base = import.meta.env.BASE_URL;

    async function loadBodies() {
      const pairs = await Promise.all(
        entries.map(async (entry): Promise<readonly [string, string]> => {
          try {
            const res = await fetch(`${base}bodies/${entry.bodyId}.md`);
            if (!res.ok) return [entry.bodyId, ''] as const;
            return [entry.bodyId, await res.text()] as const;
          } catch {
            return [entry.bodyId, ''] as const;
          }
        }),
      );
      if (!cancelled) {
        setBodies(Object.fromEntries(pairs));
      }
    }

    void loadBodies();
    return () => {
      cancelled = true;
    };
  }, [entries]);

  return bodies;
}

export interface UseSearchResult {
  search: (query: string) => IndexEntry[];
}

/**
 * MiniSearch-backed search over the catalog's plugins/skills/agents
 * (`#/search` page). Wires the pure `buildSearchIndex`/`searchEntries`
 * functions (searchIndex.ts) to the body-text fetch needed to index
 * README/SKILL.md content.
 */
export function useSearch(entries: IndexEntry[]): UseSearchResult {
  const bodies = useEntryBodies(entries);
  const miniSearch = useMemo(() => buildSearchIndex(entries, bodies), [entries, bodies]);

  return {
    search: (query: string) => searchEntries(miniSearch, entries, query),
  };
}
