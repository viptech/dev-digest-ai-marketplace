import MiniSearch from 'minisearch';
import type { IndexEntry } from '../types/catalog';

export interface SearchableDoc {
  id: string;
  name: string;
  description: string;
  keywords: string;
  body: string;
}

function toSearchableDoc(entry: IndexEntry, body: string): SearchableDoc {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    keywords: entry.keywords.join(' '),
    body,
  };
}

/**
 * Builds a MiniSearch index over catalog entries. Indexed fields per
 * architecture.md:325-327: `name`, `description`, `keywords`, and the
 * README/SKILL.md body text (passed in via `bodies`, keyed by `bodyId` —
 * loaded client-side from `site/public/bodies/`, see `useSearch.ts`). Pure
 * and framework-agnostic so it's directly unit-testable with fixture data,
 * per the react-ui-architecture skill's guidance for non-UI business logic.
 */
export function buildSearchIndex(
  entries: IndexEntry[],
  bodies: Record<string, string>,
): MiniSearch<SearchableDoc> {
  const miniSearch = new MiniSearch<SearchableDoc>({
    idField: 'id',
    fields: ['name', 'description', 'keywords', 'body'],
    storeFields: ['id'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { name: 3, description: 2, keywords: 2 },
    },
  });

  const docs = entries.map((entry) => toSearchableDoc(entry, bodies[entry.bodyId] ?? ''));
  miniSearch.addAll(docs);
  return miniSearch;
}

/**
 * Runs a query against a MiniSearch index and maps the results back to the
 * full `IndexEntry` objects (MiniSearch only stores `id` per `storeFields`).
 * An empty/whitespace-only query returns no results rather than the whole
 * catalog.
 */
export function searchEntries(
  miniSearch: MiniSearch<SearchableDoc>,
  entries: IndexEntry[],
  query: string,
): IndexEntry[] {
  if (query.trim() === '') return [];

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return miniSearch
    .search(query)
    .map((result) => byId.get(result.id))
    .filter((entry): entry is IndexEntry => entry !== undefined);
}
