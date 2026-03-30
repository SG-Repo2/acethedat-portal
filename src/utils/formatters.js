export function formatCurrency(value, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function formatHours(value) {
  return `${Number(value || 0).toFixed(Number.isInteger(value) ? 0 : 1)}h`;
}

export function formatPercent(value) {
  return `${Math.round(value || 0)}%`;
}
