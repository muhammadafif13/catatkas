import { describe, expect, it } from 'vitest';
import { isValidUsername, normalizeUsername } from '../validation';

describe('username', () => {
  it('normalizes casing, spaces, and unsupported characters', () => {
    expect(normalizeUsername('  Rani Putra  ')).toBe('rani.putra');
    expect(normalizeUsername('Rani--Putra!!')).toBe('rani.putra');
    expect(normalizeUsername('.Rani.')).toBe('rani');
  });

  it('accepts 3-20 lowercase letters, digits, dots, and underscores', () => {
    expect(isValidUsername('rani.putra')).toBe(true);
    expect(isValidUsername('a_b123')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
    expect(isValidUsername('Rani')).toBe(false);
    expect(isValidUsername('rani@putra')).toBe(false);
    expect(isValidUsername('')).toBe(false);
  });
});
