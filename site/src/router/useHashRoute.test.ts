import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { parseHash, useHashRoute } from './useHashRoute';

function setHash(hash: string) {
  window.location.hash = hash;
  // jsdom does not reliably fire `hashchange` synchronously (or at all, in
  // some versions) purely from a `location.hash =` assignment inside
  // `act()` — dispatch it explicitly so the hook's listener runs within the
  // same act() batch instead of on a later, untracked microtask.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('parseHash', () => {
  it('matches all six known route shapes', () => {
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/search')).toEqual({ name: 'search' });
    expect(parseHash('#/plugin/engineering-paved-path')).toEqual({
      name: 'plugin',
      pluginName: 'engineering-paved-path',
    });
    expect(parseHash('#/artifact/engineering-paved-path/skills/drizzle-orm-patterns')).toEqual({
      name: 'artifact',
      artifactId: 'engineering-paved-path/skills/drizzle-orm-patterns',
    });
    expect(parseHash('#/whats-new')).toEqual({ name: 'whats-new' });
    expect(parseHash('#/getting-started')).toEqual({ name: 'getting-started' });
  });

  it('falls back to home for an unrecognized hash', () => {
    expect(parseHash('#/totally-unknown-route')).toEqual({ name: 'home' });
  });
});

describe('useHashRoute', () => {
  afterEach(() => {
    act(() => {
      setHash('');
    });
  });

  it('reads the initial hash, re-renders on hashchange, and falls back to home for an unmatched hash', () => {
    setHash('#/search');
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'search' });

    act(() => {
      setHash('#/plugin/research-tools');
    });
    expect(result.current).toEqual({ name: 'plugin', pluginName: 'research-tools' });

    act(() => {
      setHash('#/does-not-exist');
    });
    expect(result.current).toEqual({ name: 'home' });
  });
});
