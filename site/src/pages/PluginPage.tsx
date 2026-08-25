import { useBody } from '../data/useBody';
import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import { CompatibilityBadge } from '../components/CompatibilityBadge';
import { CopyButton } from '../components/CopyButton';
import { DependencyGraph } from '../components/DependencyGraph';
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

  // The full COMPATIBILITY.md body is still rendered as its own sanitized
  // markdown section (below) for the human-readable prose; the structured
  // `compatibilityFloor` field (index.json) drives the CompatibilityBadge
  // instead of re-parsing that markdown client-side.
  const readmeBody = useBody(plugin ? plugin.bodyId : null);
  const compatibilityBody = useBody(plugin ? `${plugin.pluginName}/compatibility` : null);

  if (catalog.status === 'loading') {
    return <p role="status">{t('plugin.loading')}</p>;
  }
  if (catalog.status === 'error') {
    return (
      <p role="alert">
        {t('plugin.error')}
        {catalog.error}
      </p>
    );
  }
  if (!plugin) {
    return (
      <p role="alert">
        {t('plugin.notFound')}
        {pluginName}
      </p>
    );
  }

  const composition = catalog.data.index.filter(
    (entry) => entry.type !== 'plugin' && entry.pluginName === plugin.pluginName,
  );
  const allPlugins = catalog.data.index.filter(isPluginEntry);
  const installCommand = buildInstallCommand(plugin.name);

  return (
    <article>
      <h1>{plugin.name}</h1>
      <p>{plugin.description}</p>
      <dl>
        <dt>{t('plugin.version')}</dt>
        <dd>{plugin.pluginVersion}</dd>
      </dl>
      <CompatibilityBadge info={{ version: plugin.pluginVersion, floor: plugin.compatibilityFloor }} />

      <section aria-label={t('plugin.installSectionLabel')}>
        <h2>{t('plugin.install')}</h2>
        <pre>
          <code>{installCommand}</code>
        </pre>
        <CopyButton text={installCommand} label={t('plugin.copyInstall')} />
      </section>

      <DependencyGraph plugin={plugin} allPlugins={allPlugins} />

      {composition.length > 0 && (
        <section>
          <h2>{t('plugin.composition')}</h2>
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
          <h2>{t('plugin.compatibility')}</h2>
          <Markdown markdown={compatibilityBody.markdown} />
        </section>
      )}

      <section>
        <h2>{t('plugin.readme')}</h2>
        {readmeBody.status === 'ready' && <Markdown markdown={readmeBody.markdown} />}
        {readmeBody.status === 'loading' && <p role="status">{t('plugin.readmeLoading')}</p>}
        {readmeBody.status === 'error' && <p role="alert">{t('plugin.readmeError')}</p>}
      </section>
    </article>
  );
}
