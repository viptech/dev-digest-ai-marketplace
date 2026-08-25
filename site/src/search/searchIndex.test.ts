import { describe, expect, it } from 'vitest';
import type { IndexEntry } from '../types/catalog';
import { buildSearchIndex, searchEntries } from './searchIndex';

// Literal test fixture, not the real generated catalog — this test asserts
// search *behavior*, not real catalog content (per the plan's confirmed
// test strategy).
const fixtureEntries: IndexEntry[] = [
  {
    type: 'plugin',
    id: 'engineering-paved-path',
    name: 'engineering-paved-path',
    description: 'Shared engineering-practice skills.',
    pluginName: 'engineering-paved-path',
    pluginVersion: '1.0.0',
    keywords: [],
    bodyId: 'engineering-paved-path/readme',
    dependencies: [],
  },
  {
    type: 'skill',
    id: 'engineering-paved-path/skills/drizzle-orm-patterns',
    name: 'drizzle-orm-patterns',
    description: 'Comprehensive Drizzle ORM patterns for schema and queries.',
    pluginName: 'engineering-paved-path',
    pluginVersion: '1.0.0',
    keywords: ['orm', 'postgres'],
    bodyId: 'engineering-paved-path/skills/drizzle-orm-patterns',
  },
];

const fixtureBodies: Record<string, string> = {
  'engineering-paved-path/readme': 'Extraction of the DevDigest engineering harness.',
  'engineering-paved-path/skills/drizzle-orm-patterns':
    'Schema definition, migrations, transactions, relations.',
};

describe('buildSearchIndex / searchEntries', () => {
  it('matches a keyword found in the entry name', () => {
    const index = buildSearchIndex(fixtureEntries, fixtureBodies);
    const results = searchEntries(index, fixtureEntries, 'drizzle');
    expect(results.map((entry) => entry.id)).toContain(
      'engineering-paved-path/skills/drizzle-orm-patterns',
    );
  });

  it('matches a keyword found only in the indexed body text', () => {
    const index = buildSearchIndex(fixtureEntries, fixtureBodies);
    const results = searchEntries(index, fixtureEntries, 'migrations');
    expect(results.map((entry) => entry.id)).toContain(
      'engineering-paved-path/skills/drizzle-orm-patterns',
    );
  });

  it('returns zero results for a non-matching keyword', () => {
    const index = buildSearchIndex(fixtureEntries, fixtureBodies);
    const results = searchEntries(index, fixtureEntries, 'nonexistent-keyword-xyz');
    expect(results).toHaveLength(0);
  });

  it('returns zero results for an empty query', () => {
    const index = buildSearchIndex(fixtureEntries, fixtureBodies);
    expect(searchEntries(index, fixtureEntries, '   ')).toHaveLength(0);
  });
});
