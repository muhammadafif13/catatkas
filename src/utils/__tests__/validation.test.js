import { describe, expect, it } from 'vitest';
import {
  hasErrors,
  validateAccount,
  validateBudget,
  validateCategory,
  validateTransaction,
  validateTransfer,
} from '../validation';

describe('validation', () => {
  it('detects empty or invalid transactions', () => {
    const errors = validateTransaction({});
    expect(hasErrors(errors)).toBe(true);
    expect(errors).toMatchObject({
      type: expect.any(String),
      amount: expect.any(String),
      categoryId: expect.any(String),
      accountId: expect.any(String),
      date: expect.any(String),
    });
  });

  it('accepts a valid transaction', () => {
    const errors = validateTransaction({
      type: 'expense',
      amount: 25000,
      categoryId: 1,
      accountId: 1,
      date: '2026-10-26',
      note: 'Makan siang',
    });
    expect(errors).toEqual({});
  });

  it('rejects notes longer than 200 characters', () => {
    const errors = validateTransaction({
      type: 'income',
      amount: 100000,
      categoryId: 2,
      accountId: 1,
      date: '2026-10-26',
      note: 'x'.repeat(201),
    });
    expect(errors.note).toBeDefined();
  });

  it('validates categories including duplicates', () => {
    const existing = [{ id: 1, name: 'Makanan', type: 'expense' }];
    const errors = validateCategory(
      { name: 'Makanan', type: 'expense', icon: '🍔', color: '#ef4444' },
      existing,
    );
    expect(errors.name).toContain('sudah ada');
    expect(
      validateCategory(
        { name: 'Makanan Baru', type: 'expense', icon: '🍔', color: '#ef4444' },
        existing,
      ),
    ).toEqual({});
    expect(
      validateCategory(
        { name: 'Makanan', type: 'expense', icon: '🍔', color: '#ef4444' },
        existing,
        1,
      ),
    ).toEqual({});
  });

  it('validates account names and duplicate accounts', () => {
    const existing = [{ id: 1, name: 'Kas' }];
    expect(
      validateAccount(
        { name: 'kas', icon: '💵', color: '#22c55e', initialBalance: 0 },
        existing,
      ).name,
    ).toContain('sudah ada');
    expect(
      validateAccount(
        { name: 'BCA', icon: '🏦', color: '#3b82f6', initialBalance: 100000 },
        existing,
      ),
    ).toEqual({});
  });

  it('validates budget fields', () => {
    expect(
      validateBudget({ categoryId: 1, amount: 500000, period: '2026-10' }),
    ).toEqual({});
    expect(validateBudget({ categoryId: '', amount: 0, period: '2026-13' })).toMatchObject({
      categoryId: expect.any(String),
      amount: expect.any(String),
      period: expect.any(String),
    });
  });

  it('validates transfers including distinct accounts', () => {
    expect(
      validateTransfer({
        fromAccountId: 1,
        toAccountId: 2,
        amount: 100000,
        date: '2026-10-26',
      }),
    ).toEqual({});
    expect(
      validateTransfer({
        fromAccountId: 1,
        toAccountId: 1,
        amount: 0,
        date: 'invalid',
      }),
    ).toMatchObject({
      toAccountId: expect.any(String),
      amount: expect.any(String),
      date: expect.any(String),
    });
  });
});
