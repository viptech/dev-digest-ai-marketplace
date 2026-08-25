import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReleasesByPlugin } from '../types/catalog';
import { flattenReleases, WhatsNew } from './WhatsNew';

// Literal fixture, not the real generated releases.json — asserts ordering
// *behavior* (newest-first across plugins) per the plan's confirmed test
// strategy, same rationale as searchIndex.test.ts.
const fixtureReleases: ReleasesByPlugin = {
  'sdd-engineering': [
    { version: '1.2.0', title: 'Second sdd release', notes: 'sdd 1.2.0 notes', tag: null },
    { version: '1.0.0', title: 'Initial extraction', notes: 'sdd 1.0.0 notes', tag: null },
  ],
  'research-tools': [{ version: '1.1.0', title: 'Research tweak', notes: 'research 1.1.0 notes', tag: null }],
};

describe('flattenReleases', () => {
  it('flattens all plugins into one feed sorted newest-version-first', () => {
    const flat = flattenReleases(fixtureReleases);

    expect(flat.map((entry) => `${entry.pluginName}@${entry.version}`)).toEqual([
      'sdd-engineering@1.2.0',
      'research-tools@1.1.0',
      'sdd-engineering@1.0.0',
    ]);
  });
});

vi.mock('../data/useCatalog', () => ({
  useCatalog: () => ({
    status: 'ready',
    data: { index: [], releases: fixtureReleases, stats: { totalPlugins: 0, totalSkills: 0, totalAgents: 0, plugins: [] } },
  }),
}));

describe('WhatsNew page', () => {
  it('renders every release newest-first across plugins', () => {
    render(<WhatsNew />);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent);
    expect(headings[0]).toMatch(/sdd-engineering.*1\.2\.0/);
    expect(headings[1]).toMatch(/research-tools.*1\.1\.0/);
    expect(headings[2]).toMatch(/sdd-engineering.*1\.0\.0/);
  });
});
