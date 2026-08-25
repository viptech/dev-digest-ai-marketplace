import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import { Markdown } from '../components/Markdown';
import type { ReleasesByPlugin } from '../types/catalog';

export interface FlatRelease {
  pluginName: string;
  version: string;
  title: string;
  notes: string;
  tag: string | null;
}

/**
 * Compares two SemVer-ish version strings, descending (newest first).
 * Numeric-segment comparison with a lexical fallback for anything that
 * doesn't parse as dot-separated numbers — pure and framework-agnostic so
 * it's directly unit-testable (react-ui-architecture: business logic
 * colocated as a plain function, not tangled with rendering).
 */
function compareVersionsDesc(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return b.localeCompare(a);
    }
    if (numA !== numB) return numB - numA;
  }
  return 0;
}

/**
 * Flattens 3.1's `releases.json` (per-plugin, each already newest-first from
 * CHANGELOG.md order) into one feed sorted newest-first across all plugins
 * (architecture.md:370-372) — a render-time flatten/sort of existing
 * build-time data, not a new aggregation computed inside the SPA.
 */
export function flattenReleases(releases: ReleasesByPlugin): FlatRelease[] {
  const flat: FlatRelease[] = [];
  for (const [pluginName, entries] of Object.entries(releases)) {
    for (const entry of entries) {
      flat.push({ pluginName, ...entry });
    }
  }
  return flat.sort((a, b) => {
    const byVersion = compareVersionsDesc(a.version, b.version);
    return byVersion !== 0 ? byVersion : a.pluginName.localeCompare(b.pluginName);
  });
}

export function WhatsNew() {
  const t = useT();
  const catalog = useCatalog();

  if (catalog.status === 'loading') {
    return <p role="status">{t('whatsNew.loading')}</p>;
  }
  if (catalog.status === 'error') {
    return (
      <p role="alert">
        {t('whatsNew.error')}
        {catalog.error}
      </p>
    );
  }

  const entries = flattenReleases(catalog.data.releases);

  return (
    <section>
      <h1>{t('whatsNew.title')}</h1>
      {entries.length === 0 ? (
        <p>{t('whatsNew.empty')}</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={`${entry.pluginName}-${entry.version}`}>
              <h2>
                <a href={`#/plugin/${entry.pluginName}`}>{entry.pluginName}</a> {entry.version} —{' '}
                {entry.title}
              </h2>
              <Markdown markdown={entry.notes} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
