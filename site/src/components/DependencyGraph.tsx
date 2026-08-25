import { useT } from '../i18n/useT';
import type { PluginEntry } from '../types/catalog';

export interface DependencyGraphProps {
  plugin: PluginEntry;
  allPlugins: PluginEntry[];
}

/**
 * Small dependency-graph visualization on a plugin's detail page
 * (architecture.md:366-369, Phase 3.3 bonus feature #1). Edges come
 * entirely from `index.json`'s `dependencies` field (each plugin's own
 * `plugin.json`, surfaced by `scripts/build-index.mjs`) — the "depended on
 * by" (reverse) edges are derived client-side by scanning every other
 * plugin's forward edges for this plugin's name, never hand-maintained or
 * hardcoded.
 *
 * Rendering approach: two labeled lists (incoming/outgoing), not an SVG,
 * Mermaid, or a graph-layout library — the whole catalog graph is at most
 * 4 nodes / 4 edges (per the plan's explicit cap), so a real graph-layout
 * engine would be disproportionate. This mirrors the mermaid-diagram
 * skill's node/edge legibility guidance (direction + label clarity) without
 * taking on a rendering dependency sized for much larger graphs.
 */
export function DependencyGraph({ plugin, allPlugins }: DependencyGraphProps) {
  const t = useT();
  const dependsOn = plugin.dependencies;
  const dependedOnBy = allPlugins.filter((candidate) =>
    candidate.dependencies.some((dep) => dep.name === plugin.name),
  );

  if (dependsOn.length === 0 && dependedOnBy.length === 0) {
    return null;
  }

  return (
    <section aria-label={t('dependencyGraph.sectionLabel')}>
      <h2>{t('dependencyGraph.title')}</h2>
      {dependsOn.length > 0 && (
        <div>
          <h3>{t('dependencyGraph.dependsOn')}</h3>
          <ul>
            {dependsOn.map((dep) => (
              <li key={dep.name}>
                <a href={`#/plugin/${dep.name}`}>{dep.name}</a> {dep.version}
              </li>
            ))}
          </ul>
        </div>
      )}
      {dependedOnBy.length > 0 && (
        <div>
          <h3>{t('dependencyGraph.dependedOnBy')}</h3>
          <ul>
            {dependedOnBy.map((candidate) => (
              <li key={candidate.name}>
                <a href={`#/plugin/${candidate.name}`}>{candidate.name}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
