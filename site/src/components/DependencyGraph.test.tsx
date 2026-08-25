import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PluginEntry } from '../types/catalog';
import { DependencyGraph } from './DependencyGraph';

function plugin(overrides: Partial<PluginEntry>): PluginEntry {
  return {
    type: 'plugin',
    id: overrides.name ?? 'plugin',
    name: 'plugin',
    description: '',
    pluginName: 'plugin',
    pluginVersion: '1.0.0',
    keywords: [],
    bodyId: 'plugin/readme',
    dependencies: [],
    compatibilityFloor: '>=2.1.110',
    ...overrides,
  };
}

describe('DependencyGraph', () => {
  it('shows both what a plugin depends on and what depends on it', () => {
    const pavedPath = plugin({ name: 'engineering-paved-path', id: 'engineering-paved-path' });
    const architectureReview = plugin({
      name: 'architecture-review',
      id: 'architecture-review',
      dependencies: [{ name: 'engineering-paved-path', version: '^1.0.0' }],
    });
    const allPlugins = [pavedPath, architectureReview];

    render(<DependencyGraph plugin={pavedPath} allPlugins={allPlugins} />);

    expect(screen.getByText('Depended on by')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'architecture-review' })).toBeInTheDocument();
    expect(screen.queryByText('Depends on')).not.toBeInTheDocument();
  });

  it('renders nothing when a plugin has no edges in either direction', () => {
    const isolated = plugin({ name: 'research-tools', id: 'research-tools' });
    const { container } = render(<DependencyGraph plugin={isolated} allPlugins={[isolated]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
