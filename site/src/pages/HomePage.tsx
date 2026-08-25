import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import { CompatibilityBadge } from '../components/CompatibilityBadge';
import type { IndexEntry, PluginEntry } from '../types/catalog';

function isPluginEntry(entry: IndexEntry): entry is PluginEntry {
  return entry.type === 'plugin';
}

export function HomePage() {
  const t = useT();
  const catalog = useCatalog();

  if (catalog.status === 'loading') {
    return <p role="status">{t('home.loading')}</p>;
  }
  if (catalog.status === 'error') {
    return (
      <p role="alert">
        {t('home.error')}
        {catalog.error}
      </p>
    );
  }

  const plugins = catalog.data.index.filter(isPluginEntry);

  return (
    <section>
      <h1>{t('home.title')}</h1>
      <p>
        {t('home.statsPlugins')}: {catalog.data.stats.totalPlugins} ·{' '}
        {t('home.statsSkills')}: {catalog.data.stats.totalSkills} ·{' '}
        {t('home.statsAgents')}: {catalog.data.stats.totalAgents}
      </p>
      <ul>
        {plugins.map((plugin) => (
          <li key={plugin.id}>
            <a href={`#/plugin/${plugin.name}`}>{plugin.name}</a>
            <CompatibilityBadge info={{ version: plugin.pluginVersion, floor: plugin.compatibilityFloor }} />
            <p>{plugin.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
