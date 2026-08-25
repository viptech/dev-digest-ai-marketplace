import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { buildCatalog, writeCatalog, parseChangelog, parseFrontmatter, REPO_ROOT } from './build-index.mjs';

// These tests run against the real plugins/** tree checked into this repo
// (not a fixture) per the real-data-only constraint — they assert on the
// four actual plugins and their actual skill/agent counts as of this commit.

test('parseFrontmatter extracts folded-scalar description and single-line name', () => {
  const raw = [
    '---',
    'name: zod',
    'description: >',
    '  Line one of the description.',
    '  Line two continues it.',
    '---',
    '',
    '# Body heading',
  ].join('\n');

  const { attrs, body } = parseFrontmatter(raw);
  assert.equal(attrs.name, 'zod');
  assert.equal(attrs.description, 'Line one of the description. Line two continues it.');
  assert.match(body, /# Body heading/);
});

test('parseFrontmatter returns empty attrs for content with no frontmatter fence', () => {
  const { attrs, body } = parseFrontmatter('# Just a heading\n\nSome text.');
  assert.deepEqual(attrs, {});
  assert.match(body, /Just a heading/);
});

test('parseChangelog parses "## <version> — <title>" heading shape', () => {
  const changelog = [
    '# Changelog',
    '',
    '## 1.0.0 — Initial extraction',
    '',
    'Some release notes here.',
    '',
  ].join('\n');

  const entries = parseChangelog(changelog);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].version, '1.0.0');
  assert.equal(entries[0].title, 'Initial extraction');
  assert.match(entries[0].notes, /Some release notes here/);
});

test('buildCatalog finds all four real plugins with correct type/pluginName', async () => {
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });
  const pluginEntries = catalog.index.filter((e) => e.type === 'plugin');
  const pluginNames = pluginEntries.map((e) => e.pluginName).sort();

  assert.deepEqual(pluginNames, [
    'architecture-review',
    'engineering-paved-path',
    'research-tools',
    'sdd-engineering',
  ]);

  for (const entry of pluginEntries) {
    assert.equal(entry.type, 'plugin');
    assert.equal(entry.id, entry.pluginName);
    assert.ok(entry.pluginVersion, `${entry.pluginName} should have a pluginVersion`);
    assert.ok(Array.isArray(entry.dependencies));
  }
});

test('a plugin with no agents/ directory contributes zero agent entries without crashing', async () => {
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });
  const agentsForPavedPath = catalog.index.filter(
    (e) => e.type === 'agent' && e.pluginName === 'engineering-paved-path',
  );
  assert.equal(agentsForPavedPath.length, 0);
});

test('real plugin/skill/agent counts match the current plugins/** tree', async () => {
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });

  const skillsByPlugin = {};
  const agentsByPlugin = {};
  for (const entry of catalog.index) {
    if (entry.type === 'skill') {
      skillsByPlugin[entry.pluginName] = (skillsByPlugin[entry.pluginName] ?? 0) + 1;
    } else if (entry.type === 'agent') {
      agentsByPlugin[entry.pluginName] = (agentsByPlugin[entry.pluginName] ?? 0) + 1;
    }
  }

  assert.equal(skillsByPlugin['engineering-paved-path'], 11);
  assert.equal(skillsByPlugin['sdd-engineering'], 3);
  assert.equal(agentsByPlugin['sdd-engineering'], 4);
  assert.equal(agentsByPlugin['research-tools'], 1);
  assert.equal(agentsByPlugin['architecture-review'], 1);

  assert.equal(catalog.stats.totalPlugins, 4);
  assert.equal(
    catalog.index.length,
    4 + Object.values(skillsByPlugin).reduce((a, b) => a + b, 0) +
      Object.values(agentsByPlugin).reduce((a, b) => a + b, 0),
  );
});

test('releases.json parses the "## 1.0.0 — Initial extraction" heading for all four plugins', async () => {
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });
  for (const pluginName of [
    'engineering-paved-path',
    'research-tools',
    'architecture-review',
    'sdd-engineering',
  ]) {
    const entries = catalog.releases[pluginName];
    assert.ok(Array.isArray(entries) && entries.length >= 1, `${pluginName} should have releases`);
    assert.equal(entries[0].version, '1.0.0');
    assert.equal(entries[0].title, 'Initial extraction');
    assert.ok(entries[0].notes.length > 0);
  }
});

test('does not throw when no git tags exist (tag falls back to null)', async () => {
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });
  for (const entries of Object.values(catalog.releases)) {
    for (const entry of entries) {
      assert.ok(entry.tag === null || typeof entry.tag === 'string');
    }
  }
});

test('writeCatalog writes index.json/releases.json/stats.json/bodies/ to an isolated temp dir', async () => {
  const catalog = await buildCatalog({ rootDir: REPO_ROOT });
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'build-index-test-'));

  try {
    await writeCatalog(catalog, tmpDir);

    const indexRaw = await fsp.readFile(path.join(tmpDir, 'index.json'), 'utf8');
    const releasesRaw = await fsp.readFile(path.join(tmpDir, 'releases.json'), 'utf8');
    const statsRaw = await fsp.readFile(path.join(tmpDir, 'stats.json'), 'utf8');

    assert.ok(JSON.parse(indexRaw).length > 0);
    assert.ok(Object.keys(JSON.parse(releasesRaw)).length === 4);
    assert.equal(JSON.parse(statsRaw).totalPlugins, 4);

    const zodBody = await fsp.readFile(
      path.join(tmpDir, 'bodies', 'engineering-paved-path', 'skills', 'zod.md'),
      'utf8',
    );
    assert.match(zodBody, /Zod Best Practices/);
    // Frontmatter fence must be stripped from the body.
    assert.doesNotMatch(zodBody, /^---/);
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }
});
