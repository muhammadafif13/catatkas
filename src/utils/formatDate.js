const longDateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dayDateFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const monthFormat = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

const monthShortFormat = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  year: 'numeric',
});

const weekdayFormat = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
const dayMonthFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });

export function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [year, month, day] = parts;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidISODate(value) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && parseDateOnly(value));
}

export function toISODate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function formatDateLong(value) {
  const date = parseDateOnly(value);
  return date ? longDateFormat.format(date) : '-';
}

export function formatDateShort(value) {
  const date = parseDateOnly(value);
  return date ? shortDateFormat.format(date) : '-';
}

export function formatDayDate(value) {
  const date = parseDateOnly(value);
  return date ? dayDateFormat.format(date) : '-';
}

export function formatWeekdayShort(value) {
  const date = parseDateOnly(value);
  return date ? weekdayFormat.format(date) : '-';
}

export function formatDayMonth(value) {
  const date = parseDateOnly(value);
  return date ? dayMonthFormat.format(date) : '-';
}

export function formatMonth(period) {
  const [year, month] = String(period || '').split('-').map(Number);
  if (!year || !month) return '-';
  return monthFormat.format(new Date(year, month - 1, 1));
}

export function formatMonthShort(period) {
  const [year, month] = String(period || '').split('-').map(Number);
  if (!year || !month) return '-';
  return monthShortFormat.format(new Date(year, month - 1, 1));
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${longDateFormat.format(date)}, ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function getCurrentPeriod(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthRange(period) {
  const [year, month] = String(period || '').split('-').map(Number);
  if (!year || !month) return { start: '', end: '' };
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function shiftMonth(period, amount) {
  const [year, month] = String(period || '').split('-').map(Number);
  if (!year || !month) return getCurrentPeriod();
  const date = new Date(year, month - 1 + Number(amount || 0), 1);
  return getCurrentPeriod(date);
}

export function getPreviousMonth(period) {
  return shiftMonth(period, -1);
}

export function getLastNDays(count, endDate = new Date()) {
  const days = Math.max(1, Number(count) || 1);
  const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const dates = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - index);
    dates.push(toISODate(date));
  }
  return dates;
}

export function getRelativeDateLabel(value) {
  const date = parseDateOnly(value);
  if (!date) return '-';
  const today = parseDateOnly(todayISO());
  const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return formatDayDate(value);
}

export function isFutureDate(value) {
  return String(value || '') > todayISO();
}

export function getWeekdayIndex(value) {
  const date = parseDateOnly(value);
  return date ? date.getDay() : -1;
}

export function getDaysInMonth(period) {
  const [year, month] = String(period || '').split('-').map(Number);
  if (!year || !month) return 30;
  return new Date(year, month, 0).getDate();
}
