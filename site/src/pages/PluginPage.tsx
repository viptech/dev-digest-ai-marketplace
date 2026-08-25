import { useBody } from '../data/useBody';
import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import { CopyButton } from '../components/CopyButton';
import { Markdown } from '../components/Markdown';
import type { IndexEntry, PluginEntry } from '../types/catalog';

export interface PluginPageProps {
  pluginName: string;
}

function isPluginEntry(entry: IndexEntry): entry is PluginEntry {
  return entry.type === 'plugin';
}

function artifactHref(entry: IndexEntry): string {
  return `#/artifact/${entry.id}`;
}

/**
 * Fixed install command format (architecture.md:334-339) — the literal
 * `/plugin install <name>@dev-digest-ai-marketplace` string with the real
 * plugin name substituted. Do not change this format without updating the
 * architecture spec first. Exported so the smoke test (PluginPage.test.tsx)
 * can assert the rendered text matches this exactly, not a re-typed copy.
 */
export function buildInstallCommand(pluginName: string): string {
  return `/plugin install ${pluginName}@dev-digest-ai-marketplace`;
}

export function PluginPage({ pluginName }: PluginPageProps) {
  const t = useT();
  const catalog = useCatalog();
  const plugin =
    catalog.status === 'ready'
      ? catalog.data.index.find(
          (entry): entry is PluginEntry => isPluginEntry(entry) && entry.name === pluginName,
        )
      : undefined;

  // COMPATIBILITY.md is not surfaced as structured data in index.json (only
  // as a raw body file, per scripts/build-index.mjs) — rendered here as its
  // own sanitized markdown section rather than parsed into a "floor" value
  // that doesn't exist in the current data contract.
  const readmeBody = useBody(plugin ? plugin.bodyId : null);
  const compatibilityBody = useBody(plugin ? `${plugin.pluginName}/compatibility` : null);

  if (catalog.status === 'loading') {
    return <p role="status">{t('plugin.loading', 'Loading…')}</p>;
  }
  if (catalog.status === 'error') {
    return (
      <p role="alert">
        {t('plugin.error', 'Failed to load catalog: ')}
        {catalog.error}
      </p>
    );
  }
  if (!plugin) {
    return (
      <p role="alert">
        {t('plugin.notFound', 'Plugin not found: ')}
        {pluginName}
      </p>
    );
  }

  const composition = catalog.data.index.filter(
    (entry) => entry.type !== 'plugin' && entry.pluginName === plugin.pluginName,
  );
  const installCommand = buildInstallCommand(plugin.name);

  return (
    <article>
      <h1>{plugin.name}</h1>
      <p>{plugin.description}</p>
      <dl>
        <dt>{t('plugin.version', 'Version')}</dt>
        <dd>{plugin.pluginVersion}</dd>
      </dl>

      <section aria-label={t('plugin.installSectionLabel', 'Install command')}>
        <h2>{t('plugin.install', 'Install')}</h2>
        <pre>
          <code>{installCommand}</code>
        </pre>
        <CopyButton text={installCommand} label={t('plugin.copyInstall', 'Copy install command')} />
      </section>

      {plugin.dependencies.length > 0 && (
        <section>
          <h2>{t('plugin.dependencies', 'Dependencies')}</h2>
          <ul>
            {plugin.dependencies.map((dep) => (
              <li key={dep.name}>
                <a href={`#/plugin/${dep.name}`}>{dep.name}</a> {dep.version}
              </li>
            ))}
          </ul>
        </section>
      )}

      {composition.length > 0 && (
        <section>
          <h2>{t('plugin.composition', 'Skills & agents')}</h2>
          <ul>
            {composition.map((entry) => (
              <li key={entry.id}>
                <a href={artifactHref(entry)}>{entry.name}</a> <span>({entry.type})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {compatibilityBody.status === 'ready' && (
        <section>
          <h2>{t('plugin.compatibility', 'Compatibility')}</h2>
          <Markdown markdown={compatibilityBody.markdown} />
        </section>
      )}

      <section>
        <h2>{t('plugin.readme', 'README')}</h2>
        {readmeBody.status === 'ready' && <Markdown markdown={readmeBody.markdown} />}
        {readmeBody.status === 'loading' && (
          <p role="status">{t('plugin.readmeLoading', 'Loading README…')}</p>
        )}
        {readmeBody.status === 'error' && (
          <p role="alert">{t('plugin.readmeError', 'Failed to load README.')}</p>
        )}
      </section>
    </article>
  );
}
