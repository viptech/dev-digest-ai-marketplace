import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PluginEntry } from '../types/catalog';
import { buildInstallCommand, PluginPage } from './PluginPage';

const testPlugin: PluginEntry = {
  type: 'plugin',
  id: 'engineering-paved-path',
  name: 'engineering-paved-path',
  description: 'Shared engineering-practice skills.',
  pluginName: 'engineering-paved-path',
  pluginVersion: '1.0.0',
  keywords: [],
  bodyId: 'engineering-paved-path/readme',
  dependencies: [],
};

vi.mock('../data/useCatalog', () => ({
  useCatalog: () => ({
    status: 'ready',
    data: {
      index: [testPlugin],
      releases: {},
      stats: { totalPlugins: 1, totalSkills: 0, totalAgents: 0, plugins: [] },
    },
  }),
}));

vi.mock('../data/useBody', () => ({
  useBody: () => ({ status: 'ready', markdown: 'Body text.' }),
}));

describe('PluginPage', () => {
  it('renders the install command verbatim for the given plugin name, with a working copy button', () => {
    render(<PluginPage pluginName="engineering-paved-path" />);

    expect(screen.getByText(buildInstallCommand('engineering-paved-path'))).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copy install command/i }),
    ).toBeInTheDocument();
  });
});
