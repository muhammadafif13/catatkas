import { describe, expect, it } from 'vitest';
import {
  formatAmountInput,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatSignedCurrency,
  parseCurrencyInput,
} from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats rupiah with Indonesian grouping', () => {
    expect(formatCurrency(1234567)).toBe('Rp 1.234.567');
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  it('formats negative and decimal values', () => {
    expect(formatCurrency(-1000)).toBe('-Rp 1.000');
    expect(formatCurrency(1234.5, { decimals: 2 })).toBe('Rp 1.234,50');
  });

  it('supports values without the currency symbol', () => {
    expect(formatCurrency(250000, { withSymbol: false })).toBe('250.000');
  });

  it('falls back to zero for invalid values', () => {
    expect(formatCurrency('bukan angka')).toBe('Rp 0');
    expect(formatNumber(null)).toBe('0');
  });

  it('adds a signed prefix based on transaction type', () => {
    expect(formatSignedCurrency(45000, 'income')).toBe('+Rp 45.000');
    expect(formatSignedCurrency(45000, 'expense')).toBe('-Rp 45.000');
  });

  it('formats compact currency for large nominal values', () => {
    expect(formatCompactCurrency(950)).toBe('Rp 950');
    expect(formatCompactCurrency(1500)).toBe('Rp 1,5 rb');
    expect(formatCompactCurrency(2500000)).toBe('Rp 2,5 jt');
    expect(formatCompactCurrency(3000000000)).toBe('Rp 3 M');
    expect(formatCompactCurrency(-1500000)).toBe('-Rp 1,5 jt');
  });

  it('parses formatted numeric input', () => {
    expect(parseCurrencyInput('Rp 1.234.567')).toBe(1234567);
    expect(parseCurrencyInput('0012')).toBe(12);
    expect(parseCurrencyInput('')).toBe(0);
    expect(parseCurrencyInput('abc')).toBe(0);
  });

  it('formats amount inputs without leading zeroes', () => {
    expect(formatAmountInput(1500)).toBe('1.500');
    expect(formatAmountInput(0)).toBe('');
    expect(formatAmountInput('2.000')).toBe('2.000');
  });

  it('formats percentages', () => {
    expect(formatPercentage(12.345)).toBe('12%');
    expect(formatPercentage(12.345, { decimals: 1 })).toBe('12,3%');
    expect(formatPercentage(Number.NaN)).toBe('0%');
  });
});
