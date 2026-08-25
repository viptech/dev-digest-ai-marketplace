import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import type { IndexEntry, PluginEntry } from '../types/catalog';

function isPluginEntry(entry: IndexEntry): entry is PluginEntry {
  return entry.type === 'plugin';
}

export function HomePage() {
  const t = useT();
  const catalog = useCatalog();

  if (catalog.status === 'loading') {
    return <p role="status">{t('home.loading', 'Loading catalog…')}</p>;
  }
  if (catalog.status === 'error') {
    return (
      <p role="alert">
        {t('home.error', 'Failed to load catalog: ')}
        {catalog.error}
      </p>
    );
  }

  const plugins = catalog.data.index.filter(isPluginEntry);

  return (
    <section>
      <h1>{t('home.title', 'Plugin catalog')}</h1>
      <p>
        {t('home.statsPlugins', 'Plugins')}: {catalog.data.stats.totalPlugins} ·{' '}
        {t('home.statsSkills', 'Skills')}: {catalog.data.stats.totalSkills} ·{' '}
        {t('home.statsAgents', 'Agents')}: {catalog.data.stats.totalAgents}
      </p>
      <ul>
        {plugins.map((plugin) => (
          <li key={plugin.id}>
            <a href={`#/plugin/${plugin.name}`}>{plugin.name}</a>
            <p>{plugin.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
