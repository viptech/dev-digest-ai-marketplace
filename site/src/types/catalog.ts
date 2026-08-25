/**
 * Mirrors the JSDoc output-shape contract documented in
 * `scripts/build-index.mjs` (repo root) — keep these types in sync with
 * that file if the contract ever changes. These shapes describe
 * `site/public/index.json`, `site/public/releases.json`, and
 * `site/public/stats.json`, all produced by `npm run build:index` and
 * fetched at runtime (never bundled) by `site/src/data/useCatalog.ts`.
 */

export type ArtifactType = 'plugin' | 'skill' | 'agent';

export interface PluginDependency {
  name: string;
  version: string;
}

export interface PluginEntry {
  type: 'plugin';
  /** == pluginName */
  id: string;
  name: string;
  description: string;
  pluginName: string;
  pluginVersion: string;
  keywords: string[];
  /** -> bodies/<bodyId>.md (README.md body) */
  bodyId: string;
  dependencies: PluginDependency[];
}

export interface SkillEntry {
  type: 'skill';
  /** `${pluginName}/skills/${skillDirName}` */
  id: string;
  name: string;
  description: string;
  pluginName: string;
  pluginVersion: string;
  keywords: string[];
  bodyId: string;
}

export interface AgentEntry {
  type: 'agent';
  /** `${pluginName}/agents/${agentFileBaseName}` */
  id: string;
  name: string;
  description: string;
  pluginName: string;
  pluginVersion: string;
  keywords: string[];
  bodyId: string;
}

export type IndexEntry = PluginEntry | SkillEntry | AgentEntry;

export interface ReleaseEntry {
  version: string;
  title: string;
  notes: string;
  /** best-effort `<plugin>--v<version>` git tag; null when absent */
  tag: string | null;
}

export type ReleasesByPlugin = Record<string, ReleaseEntry[]>;

export interface PluginStats {
  name: string;
  version: string;
  skillsCount: number;
  agentsCount: number;
}

export interface CatalogStats {
  totalPlugins: number;
  totalSkills: number;
  totalAgents: number;
  plugins: PluginStats[];
}
