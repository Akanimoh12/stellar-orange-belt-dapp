import { describe, it, expect } from 'vitest';
import { formatXLM, truncateAddress, isValidAmount, timeUntil } from '../utils/helpers';

describe('formatXLM', () => {
  it('formats stroops to XLM with 2 decimals', () => {
    expect(formatXLM(10_000_000)).toBe('1.00');
    expect(formatXLM(50_000_000)).toBe('5.00');
    expect(formatXLM(12_345_678)).toBe('1.23');
  });

  it('formats zero correctly', () => {
    expect(formatXLM(0)).toBe('0.00');
  });

  it('formats large amounts', () => {
    expect(formatXLM(1_000_000_000_000)).toBe('100000.00');
  });

  it('formats fractional amounts', () => {
    expect(formatXLM(1)).toBe('0.00');
    expect(formatXLM(100_000)).toBe('0.01');
  });
});

describe('truncateAddress', () => {
  it('truncates a long address to default 6 chars', () => {
    const addr = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345';
    const result = truncateAddress(addr);
    expect(result).toBe('GABCDE...012345');
    expect(result.length).toBeLessThan(addr.length);
  });

  it('truncates with custom char count', () => {
    const addr = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345';
    const result = truncateAddress(addr, 4);
    expect(result).toBe('GABC...2345');
  });

  it('returns short addresses as-is', () => {
    expect(truncateAddress('ABCDEF', 6)).toBe('ABCDEF');
    expect(truncateAddress('AB', 4)).toBe('AB');
  });
});

describe('isValidAmount', () => {
  it('accepts positive numbers', () => {
    expect(isValidAmount('1')).toBe(true);
    expect(isValidAmount('0.5')).toBe(true);
    expect(isValidAmount('100.25')).toBe(true);
  });

  it('rejects zero and negative numbers', () => {
    expect(isValidAmount('0')).toBe(false);
    expect(isValidAmount('-1')).toBe(false);
    expect(isValidAmount('-0.5')).toBe(false);
  });

  it('rejects invalid strings', () => {
    expect(isValidAmount('')).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
    expect(isValidAmount('12abc')).toBe(false);
    expect(isValidAmount('Infinity')).toBe(false);
  });
});

describe('timeUntil', () => {
  it('returns "Unlocked" for past timestamps', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    expect(timeUntil(past)).toBe('Unlocked');
  });

  it('returns "Unlocked" for zero', () => {
    expect(timeUntil(0)).toBe('Unlocked');
  });

  it('formats days and hours for future timestamps', () => {
    const futureSeconds = Math.floor(Date.now() / 1000) + 90000; // ~1 day + 1 hour
    const result = timeUntil(futureSeconds);
    expect(result).toMatch(/^\d+d \d+h$/);
  });

  it('formats hours and minutes when under 1 day', () => {
    const futureSeconds = Math.floor(Date.now() / 1000) + 7200; // 2 hours
    const result = timeUntil(futureSeconds);
    expect(result).toMatch(/^\d+h \d+m$/);
  });

  it('formats minutes when under 1 hour', () => {
    const futureSeconds = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    const result = timeUntil(futureSeconds);
    expect(result).toMatch(/^\d+m$/);
  });
});
