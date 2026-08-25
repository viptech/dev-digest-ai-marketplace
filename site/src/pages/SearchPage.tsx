import { useState } from 'react';
import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import { useSearch } from '../search/useSearch';
import type { IndexEntry } from '../types/catalog';

function entryHref(entry: IndexEntry): string {
  return entry.type === 'plugin' ? `#/plugin/${entry.name}` : `#/artifact/${entry.id}`;
}

export function SearchPage() {
  const t = useT();
  const catalog = useCatalog();
  const [query, setQuery] = useState('');
  const entries = catalog.status === 'ready' ? catalog.data.index : [];
  const { search } = useSearch(entries);
  const trimmedQuery = query.trim();
  const results = trimmedQuery === '' ? [] : search(query);

  return (
    <section>
      <h1>{t('search.title', 'Search')}</h1>
      <label htmlFor="catalog-search">{t('search.label', 'Search plugins, skills, and agents')}</label>
      <input
        id="catalog-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('search.placeholder', 'e.g. drizzle, onion architecture, react')}
      />

      {catalog.status === 'loading' && (
        <p role="status">{t('search.loadingCatalog', 'Loading catalog…')}</p>
      )}
      {catalog.status === 'error' && (
        <p role="alert">
          {t('search.errorCatalog', 'Failed to load catalog: ')}
          {catalog.error}
        </p>
      )}

      {trimmedQuery !== '' && (
        <p aria-live="polite">
          {results.length === 0
            ? t('search.noResults', 'No results.')
            : `${results.length} ${t('search.resultsSuffix', 'result(s)')}`}
        </p>
      )}

      <ul>
        {results.map((entry) => (
          <li key={entry.id}>
            <a href={entryHref(entry)}>{entry.name}</a> <span>({entry.type})</span>
            <p>{entry.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
