import { useBody } from '../data/useBody';
import { useCatalog } from '../data/useCatalog';
import { useT } from '../i18n/useT';
import { Markdown } from '../components/Markdown';
import type { AgentEntry, IndexEntry, SkillEntry } from '../types/catalog';

export interface ArtifactPageProps {
  artifactId: string;
}

function isArtifactEntry(entry: IndexEntry): entry is SkillEntry | AgentEntry {
  return entry.type === 'skill' || entry.type === 'agent';
}

export function ArtifactPage({ artifactId }: ArtifactPageProps) {
  const t = useT();
  const catalog = useCatalog();
  const artifact =
    catalog.status === 'ready'
      ? catalog.data.index.find(
          (entry): entry is SkillEntry | AgentEntry => isArtifactEntry(entry) && entry.id === artifactId,
        )
      : undefined;

  const body = useBody(artifact ? artifact.bodyId : null);

  if (catalog.status === 'loading') {
    return <p role="status">{t('artifact.loading')}</p>;
  }
  if (catalog.status === 'error') {
    return (
      <p role="alert">
        {t('artifact.error')}
        {catalog.error}
      </p>
    );
  }
  if (!artifact) {
    return (
      <p role="alert">
        {t('artifact.notFound')}
        {artifactId}
      </p>
    );
  }

  return (
    <article>
      <h1>{artifact.name}</h1>
      <p>
        <span>{artifact.type}</span> ·{' '}
        <a href={`#/plugin/${artifact.pluginName}`}>{artifact.pluginName}</a>
      </p>
      <p>{artifact.description}</p>
      <section>
        {body.status === 'ready' && <Markdown markdown={body.markdown} />}
        {body.status === 'loading' && <p role="status">{t('artifact.bodyLoading')}</p>}
        {body.status === 'error' && <p role="alert">{t('artifact.bodyError')}</p>}
      </section>
    </article>
  );
}
