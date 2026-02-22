import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Import cache AFTER mocking localStorage
import { cache } from '../services/cache';

describe('Cache Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('stores and retrieves data', () => {
    cache.set('test-key', { name: 'alice', amount: 42 });
    const result = cache.get<{ name: string; amount: number }>('test-key');
    expect(result).toEqual({ name: 'alice', amount: 42 });
  });

  it('returns null for missing keys', () => {
    const result = cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null for expired entries', () => {
    // Set with 0ms TTL (immediately expires)
    cache.set('expires', 'data', 0);
    const result = cache.get('expires');
    expect(result).toBeNull();
  });

  it('invalidates a specific key', () => {
    cache.set('keep-me', 'yes');
    cache.set('remove-me', 'bye');
    cache.invalidate('remove-me');

    expect(cache.get('keep-me')).toBe('yes');
    expect(cache.get('remove-me')).toBeNull();
  });

  it('invalidateAll clears all cache entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.invalidateAll();

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
    expect(cache.get('c')).toBeNull();
  });

  it('handles JSON parse errors gracefully', () => {
    // Manually insert invalid JSON into localStorage
    localStorage.setItem('sv_broken', 'not-valid-json{{{');
    const result = cache.get('broken');
    expect(result).toBeNull();
  });

  it('supports different data types', () => {
    cache.set('string', 'hello');
    cache.set('number', 12345);
    cache.set('array', [1, 2, 3]);
    cache.set('bool', true);

    expect(cache.get<string>('string')).toBe('hello');
    expect(cache.get<number>('number')).toBe(12345);
    expect(cache.get<number[]>('array')).toEqual([1, 2, 3]);
    expect(cache.get<boolean>('bool')).toBe(true);
  });
});
