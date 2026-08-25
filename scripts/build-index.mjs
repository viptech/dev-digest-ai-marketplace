#!/usr/bin/env node
/**
 * build-index.mjs — turns plugins/** + .claude-plugin/marketplace.json into
 * the static catalog data the SPA (Phase 3.2/3.3) reads from site/public/.
 *
 * Real-data-only: every entry below is derived exclusively from what exists
 * in plugins/ and marketplace.json at build time. No seed/demo/fixture data
 * is ever written into site/public/ by this script.
 *
 * ---------------------------------------------------------------------------
 * Output shapes (the contract 3.2/3.3 build against — keep field names
 * stable once this lands):
 *
 * index.json: IndexEntry[]
 *   type IndexEntry = PluginEntry | SkillEntry | AgentEntry;
 *
 *   type PluginEntry = {
 *     type: 'plugin';
 *     id: string;              // == pluginName
 *     name: string;
 *     description: string;
 *     pluginName: string;
 *     pluginVersion: string;
 *     keywords: string[];      // from plugin.json/README frontmatter if any, else []
 *     bodyId: string;          // -> bodies/<bodyId>.md (README.md body)
 *     // Dependency edges from plugin.json's own `dependencies` field.
 *     // This is what 3.3's dependency-graph feature consumes — the field
 *     // name `dependencies` is the contract established here.
 *     dependencies: { name: string; version: string }[];
 *   };
 *
 *   type SkillEntry = {
 *     type: 'skill';
 *     id: string;               // `${pluginName}/skills/${skillDirName}`
 *     name: string;              // from SKILL.md frontmatter `name`
 *     description: string;       // from SKILL.md frontmatter `description`
 *     pluginName: string;
 *     pluginVersion: string;
 *     keywords: string[];        // from SKILL.md frontmatter `keywords` if present, else []
 *     bodyId: string;            // -> bodies/<bodyId>.md (SKILL.md body, frontmatter stripped)
 *   };
 *
 *   type AgentEntry = {
 *     type: 'agent';
 *     id: string;               // `${pluginName}/agents/${agentFileBaseName}`
 *     name: string;              // from agent .md frontmatter `name`
 *     description: string;       // from agent .md frontmatter `description`
 *     pluginName: string;
 *     pluginVersion: string;
 *     keywords: string[];        // from agent frontmatter `keywords` if present, else []
 *     bodyId: string;            // -> bodies/<bodyId>.md (agent body, frontmatter stripped)
 *   };
 *
 * releases.json: Record<pluginName, ReleaseEntry[]>
 *   type ReleaseEntry = {
 *     version: string;
 *     title: string;
 *     notes: string;
 *     tag: string | null;   // best-effort `<plugin>--v<version>` git tag; null when absent
 *   };
 *   // Order preserved from CHANGELOG.md (project convention: newest first).
 *
 * stats.json:
 *   {
 *     totalPlugins: number;
 *     totalSkills: number;
 *     totalAgents: number;
 *     plugins: { name: string; version: string; skillsCount: number; agentsCount: number }[];
 *   }
 *
 * bodies/<bodyId>.md: raw markdown body text, NOT sanitized here.
 *   Sanitization (DOMPurify) happens client-side at render time in 3.2 —
 *   this script only copies/extracts markdown, stripping the YAML
 *   frontmatter fence from SKILL.md / agent files before writing.
 * ---------------------------------------------------------------------------
 */

import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.join(__dirname, '..');

/**
 * Parses a minimal subset of YAML frontmatter used by SKILL.md / agent .md
 * files in this repo: top-level `key: value` pairs, plus folded (`>`) or
 * literal (`|`) block scalars for multi-line values. Not a general YAML
 * parser — intentionally hand-rolled per the "no framework" constraint.
 *
 * @param {string} content
 * @returns {{ attrs: Record<string, unknown>, body: string }}
 */
export function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return { attrs: {}, body: content };
  }

  const lines = content.split(/\r?\n/);
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    return { attrs: {}, body: content };
  }

  const fmLines = lines.slice(1, endIndex);
  /** @type {Record<string, unknown>} */
  const attrs = {};

  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
    const match = /^([A-Za-z_][\w-]*):\s?(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let rawValue = match[2];

    if (rawValue === '>' || rawValue === '|' || rawValue === '' ) {
      const isFolded = rawValue !== '|';
      const collected = [];
      let j = i + 1;
      while (j < fmLines.length && (fmLines[j] === '' || /^\s+/.test(fmLines[j]))) {
        collected.push(fmLines[j].replace(/^\s+/, ''));
        j++;
      }
      i = j - 1;
      const joined = isFolded ? collected.join(' ') : collected.join('\n');
      attrs[key] = joined.trim();
    } else {
      // Strip a single layer of matching quotes, if present.
      const quoted = /^"(.*)"$/.exec(rawValue) || /^'(.*)'$/.exec(rawValue);
      attrs[key] = (quoted ? quoted[1] : rawValue).trim();
    }
  }

  const body = lines.slice(endIndex + 1).join('\n');
  return { attrs, body };
}

/**
 * @param {string} filePath
 * @returns {Promise<string | null>}
 */
async function readFileIfExists(filePath) {
  try {
    return await fsp.readFile(filePath, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Parses a CHANGELOG.md matching `## <version> — <title>` headings into
 * release entries, in source (newest-first) order.
 *
 * @param {string} content
 * @returns {{ version: string, title: string, notes: string }[]}
 */
export function parseChangelog(content) {
  const headingRe = /^##\s+(\S+)\s+—\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRe)];
  const entries = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const version = match[1].trim();
    const title = match[2].trim();
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    const notes = content.slice(start, end).trim();
    entries.push({ version, title, notes });
  }

  return entries;
}

/**
 * Best-effort git tag lookup for `<pluginName>--v*` tags. Never throws —
 * an empty array (no tags) is the expected, tolerated result today since
 * no tags exist yet in this repo (tagging happens later, lab step 9).
 *
 * @param {string} pluginName
 * @param {string} cwd
 * @returns {string[]}
 */
export function listPluginTags(pluginName, cwd) {
  try {
    const out = execFileSync('git', ['tag', '-l', `${pluginName}--v*`], {
      cwd,
      encoding: 'utf8',
    });
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Reads and JSON.parses a file, returning null if it does not exist.
 * @param {string} filePath
 */
async function readJsonIfExists(filePath) {
  const raw = await readFileIfExists(filePath);
  if (raw === null) return null;
  return JSON.parse(raw);
}

/**
 * Lists immediate subdirectory names of `dirPath`, or [] if it doesn't exist.
 * @param {string} dirPath
 */
async function listDirsIfExists(dirPath) {
  try {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * Lists `.md` file base names (without extension) directly under `dirPath`,
 * or [] if it doesn't exist.
 * @param {string} dirPath
 */
async function listMarkdownFilesIfExists(dirPath) {
  try {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name.replace(/\.md$/, ''))
      .sort();
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeKeywords(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Walks plugins/** + marketplace.json and builds the in-memory catalog
 * data. Pure — does not touch site/public/; callers write the result with
 * writeCatalog().
 *
 * @param {{ rootDir: string }} opts
 */
export async function buildCatalog({ rootDir }) {
  const marketplacePath = path.join(rootDir, '.claude-plugin', 'marketplace.json');
  const marketplace = await readJsonIfExists(marketplacePath);
  if (!marketplace || !Array.isArray(marketplace.plugins)) {
    throw new Error(`Could not read plugin list from ${marketplacePath}`);
  }

  /** @type {any[]} */
  const index = [];
  /** @type {Record<string, any[]>} */
  const releases = {};
  /** @type {{ bodyId: string, content: string }[]} */
  const bodies = [];
  /** @type {{ name: string, version: string, skillsCount: number, agentsCount: number }[]} */
  const perPluginStats = [];

  for (const { name: pluginName, source } of marketplace.plugins) {
    const pluginDir = path.join(rootDir, source);
    const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
    const pluginJson = await readJsonIfExists(pluginJsonPath);
    if (!pluginJson) {
      throw new Error(`Missing plugin.json for "${pluginName}" at ${pluginJsonPath}`);
    }

    const pluginVersion = pluginJson.version ?? '0.0.0';
    const dependencies = Array.isArray(pluginJson.dependencies) ? pluginJson.dependencies : [];

    // README.md / CHANGELOG.md / COMPATIBILITY.md are the three per-plugin
    // docs the discovery walk reads (architecture.md's plugin contract).
    const readme = await readFileIfExists(path.join(pluginDir, 'README.md'));
    const changelog = await readFileIfExists(path.join(pluginDir, 'CHANGELOG.md'));
    // Read for completeness of the discovery walk; not surfaced as its own
    // index entry (not an artifact type), but copied into bodies/ for the
    // SPA's "compatibility" tab in a later sub-plan.
    const compatibility = await readFileIfExists(path.join(pluginDir, 'COMPATIBILITY.md'));

    const pluginBodyId = `${pluginName}/readme`;
    bodies.push({ bodyId: pluginBodyId, content: (readme ?? '').trim() + '\n' });
    if (compatibility !== null) {
      bodies.push({ bodyId: `${pluginName}/compatibility`, content: compatibility.trim() + '\n' });
    }

    index.push({
      type: 'plugin',
      id: pluginName,
      name: pluginName,
      description: pluginJson.description ?? '',
      pluginName,
      pluginVersion,
      keywords: normalizeKeywords(pluginJson.keywords),
      bodyId: pluginBodyId,
      dependencies: dependencies.map((d) => ({ name: d.name, version: d.version })),
    });

    // releases.json — parsed from CHANGELOG.md, git tags are best-effort.
    const changelogEntries = changelog ? parseChangelog(changelog) : [];
    const tags = listPluginTags(pluginName, rootDir);
    releases[pluginName] = changelogEntries.map((entry) => {
      const tagCandidate = `${pluginName}--v${entry.version}`;
      return {
        ...entry,
        tag: tags.includes(tagCandidate) ? tagCandidate : null,
      };
    });

    // Skills: plugins/<name>/skills/<skillDir>/SKILL.md
    const skillsDir = path.join(pluginDir, 'skills');
    const skillDirNames = await listDirsIfExists(skillsDir);
    let skillsCount = 0;
    for (const skillDirName of skillDirNames) {
      const skillMdPath = path.join(skillsDir, skillDirName, 'SKILL.md');
      const raw = await readFileIfExists(skillMdPath);
      if (raw === null) continue; // not every subdir under skills/ is a skill
      const { attrs, body } = parseFrontmatter(raw);
      const bodyId = `${pluginName}/skills/${skillDirName}`;
      bodies.push({ bodyId, content: body.trim() + '\n' });
      index.push({
        type: 'skill',
        id: bodyId,
        name: typeof attrs.name === 'string' ? attrs.name : skillDirName,
        description: typeof attrs.description === 'string' ? attrs.description : '',
        pluginName,
        pluginVersion,
        keywords: normalizeKeywords(attrs.keywords),
        bodyId,
      });
      skillsCount++;
    }

    // Agents: plugins/<name>/agents/<agentFile>.md (flat, no per-agent dir)
    const agentsDir = path.join(pluginDir, 'agents');
    const agentBaseNames = await listMarkdownFilesIfExists(agentsDir);
    let agentsCount = 0;
    for (const agentBaseName of agentBaseNames) {
      const agentMdPath = path.join(agentsDir, `${agentBaseName}.md`);
      const raw = await readFileIfExists(agentMdPath);
      if (raw === null) continue;
      const { attrs, body } = parseFrontmatter(raw);
      const bodyId = `${pluginName}/agents/${agentBaseName}`;
      bodies.push({ bodyId, content: body.trim() + '\n' });
      index.push({
        type: 'agent',
        id: bodyId,
        name: typeof attrs.name === 'string' ? attrs.name : agentBaseName,
        description: typeof attrs.description === 'string' ? attrs.description : '',
        pluginName,
        pluginVersion,
        keywords: normalizeKeywords(attrs.keywords),
        bodyId,
      });
      agentsCount++;
    }

    perPluginStats.push({ name: pluginName, version: pluginVersion, skillsCount, agentsCount });
  }

  const stats = {
    totalPlugins: perPluginStats.length,
    totalSkills: perPluginStats.reduce((sum, p) => sum + p.skillsCount, 0),
    totalAgents: perPluginStats.reduce((sum, p) => sum + p.agentsCount, 0),
    plugins: perPluginStats,
  };

  return { index, releases, stats, bodies };
}

/**
 * Writes the catalog produced by buildCatalog() to `outDir` as
 * index.json / releases.json / stats.json / bodies/<bodyId>.md.
 *
 * @param {{ index: any[], releases: Record<string, any[]>, stats: any, bodies: { bodyId: string, content: string }[] }} catalog
 * @param {string} outDir
 */
export async function writeCatalog(catalog, outDir) {
  await fsp.mkdir(outDir, { recursive: true });
  const bodiesDir = path.join(outDir, 'bodies');
  await fsp.mkdir(bodiesDir, { recursive: true });

  await fsp.writeFile(path.join(outDir, 'index.json'), JSON.stringify(catalog.index, null, 2) + '\n', 'utf8');
  await fsp.writeFile(path.join(outDir, 'releases.json'), JSON.stringify(catalog.releases, null, 2) + '\n', 'utf8');
  await fsp.writeFile(path.join(outDir, 'stats.json'), JSON.stringify(catalog.stats, null, 2) + '\n', 'utf8');

  for (const { bodyId, content } of catalog.bodies) {
    const bodyPath = path.join(bodiesDir, `${bodyId}.md`);
    await fsp.mkdir(path.dirname(bodyPath), { recursive: true });
    await fsp.writeFile(bodyPath, content, 'utf8');
  }
}

async function main() {
  const outDir = path.join(REPO_ROOT, 'site', 'public');
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });
  await writeCatalog(catalog, outDir);
  console.log(
    `build-index: wrote ${catalog.index.length} index entries ` +
      `(${catalog.stats.totalPlugins} plugins, ${catalog.stats.totalSkills} skills, ` +
      `${catalog.stats.totalAgents} agents) and ${catalog.bodies.length} body files to ${outDir}`,
  );
}

// Only run when invoked directly (`node scripts/build-index.mjs`), not when
// imported by the test suite. Compare via a proper file:// URL (not a raw
// template-string concat) so paths containing spaces or other characters
// that import.meta.url percent-encodes (e.g. this repo's own
// "ai agent" parent directory) still compare equal.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
