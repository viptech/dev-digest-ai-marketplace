import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompatibilityBadge } from './CompatibilityBadge';

describe('CompatibilityBadge', () => {
  it('renders the plugin version and its compatibility floor', () => {
    render(<CompatibilityBadge info={{ version: '1.0.0', floor: '>=2.1.110' }} />);

    expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/>=2\.1\.110/)).toBeInTheDocument();
  });

  it('falls back to an "unknown" message when no compatibility floor was parsed', () => {
    render(<CompatibilityBadge info={{ version: '1.0.0', floor: null }} />);

    expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
    expect(screen.queryByText(/>=/)).not.toBeInTheDocument();
  });
});
