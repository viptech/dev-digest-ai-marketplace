import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useT } from './useT';

describe('useT', () => {
  it('resolves a known key to its English dictionary text', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('search.title')).toBe('Search');
  });

  it('falls back to the literal key string for a missing key instead of throwing', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('this.key.does.not.exist')).toBe('this.key.does.not.exist');
  });
});
