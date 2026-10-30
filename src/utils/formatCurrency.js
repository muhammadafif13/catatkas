const idNumberFormatter = new Intl.NumberFormat('id-ID');

export function formatCurrency(value, options = {}) {
  const { withSymbol = true, decimals = 0 } = options;
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : 0;
  const fractionDigits = Math.max(0, Number(decimals) || 0);
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(safe));

  return `${safe < 0 ? '-' : ''}${withSymbol ? 'Rp ' : ''}${formatted}`;
}

export function formatNumber(value) {
  const number = Number(value);
  return idNumberFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatSignedCurrency(value, type) {
  const sign = type === 'expense' ? '-' : '+';
  return `${sign}${formatCurrency(value)}`;
}

export function formatCompactCurrency(value) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : 0;
  const absolute = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';

  if (absolute >= 1_000_000_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })} T`;
  }
  if (absolute >= 1_000_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })} M`;
  }
  if (absolute >= 1_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })} jt`;
  }
  if (absolute >= 1_000) {
    return `${sign}Rp ${(absolute / 1_000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })} rb`;
  }
  return formatCurrency(safe);
}

export function parseCurrencyInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return 0;
  const number = Number(digits);
  return Number.isFinite(number) ? number : 0;
}

export function formatAmountInput(value) {
  const number = parseCurrencyInput(value);
  return number > 0 ? idNumberFormatter.format(number) : '';
}

export function formatPercentage(value, options = {}) {
  const { decimals = 0 } = options;
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : 0;
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe)}%`;
}
