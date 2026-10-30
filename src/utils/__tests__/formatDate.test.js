import { describe, expect, it } from 'vitest';
import {
  formatDateLong,
  formatDateShort,
  formatMonth,
  formatMonthShort,
  getCurrentPeriod,
  getDaysInMonth,
  getLastNDays,
  getMonthRange,
  getPreviousMonth,
  getRelativeDateLabel,
  isValidISODate,
  nowTime,
  parseDateOnly,
  shiftMonth,
  toISODate,
  todayISO,
} from '../formatDate';

describe('formatDate', () => {
  it('parses valid date-only strings', () => {
    const date = parseDateOnly('2026-10-26');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(26);
  });

  it('rejects invalid dates', () => {
    expect(parseDateOnly('2026-02-30')).toBeNull();
    expect(parseDateOnly('bukan tanggal')).toBeNull();
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2024-02-29')).toBe(true);
  });

  it('converts local dates to ISO date strings', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('formats dates in Indonesian', () => {
    expect(formatDateLong('2026-10-26')).toBe('26 Oktober 2026');
    expect(formatDateShort('2026-10-26')).toBe('26 Okt 2026');
    expect(formatMonth('2026-10')).toBe('Oktober 2026');
    expect(formatMonthShort('2026-10')).toBe('Okt 2026');
  });

  it('returns fallback values for empty or invalid dates', () => {
    expect(formatDateLong('')).toBe('-');
    expect(formatDateShort('invalid')).toBe('-');
    expect(formatMonth('')).toBe('-');
    expect(formatMonthShort('')).toBe('-');
  });

  it('builds month ranges including leap years', () => {
    expect(getMonthRange('2026-10')).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    });
    expect(getMonthRange('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });
    expect(getMonthRange('invalid')).toEqual({ start: '', end: '' });
  });

  it('shifts periods across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(getPreviousMonth('2026-03')).toBe('2026-02');
  });

  it('returns deterministic current-period helpers', () => {
    expect(getCurrentPeriod(new Date(2026, 9, 26))).toBe('2026-10');
    expect(getDaysInMonth('2024-02')).toBe(29);
    expect(getDaysInMonth('2026-02')).toBe(28);
  });

  it('builds the last N days inclusively', () => {
    expect(getLastNDays(3, new Date(2026, 9, 26))).toEqual([
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
  });

  it('labels today and yesterday', () => {
    expect(getRelativeDateLabel(todayISO())).toBe('Hari ini');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getRelativeDateLabel(toISODate(yesterday))).toBe('Kemarin');
  });

  it('formats the current time as HH:mm', () => {
    expect(nowTime()).toMatch(/^\d{2}:\d{2}$/);
  });
});
