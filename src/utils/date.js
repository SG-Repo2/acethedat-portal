const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function coerceDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value);
  if (typeof value === 'string' && isIsoDate(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  if (typeof value === 'string' && value.includes('/')) {
    const [month, day, year] = value.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toISODate(value) {
  const date = coerceDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(value, options = {}) {
  const date = coerceDate(value);
  if (!date) return 'TBD';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatMonthKey(value) {
  const date = coerceDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
  }).format(date);
}

export function addDays(value, amount) {
  const date = coerceDate(value);
  if (!date) return null;
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

export function addWeeks(value, amount) {
  return addDays(value, amount * 7);
}

export function getStartOfWeek(value = new Date()) {
  const date = coerceDate(value) || new Date();
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function getEndOfWeek(value = new Date()) {
  const start = getStartOfWeek(value);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getWeekRangeLabel(weekStart) {
  const start = getStartOfWeek(weekStart);
  const end = getEndOfWeek(start);
  return `${formatDate(start, { month: 'short', day: 'numeric' })} - ${formatDate(end, {
    month: 'short',
    day: 'numeric',
  })}`;
}

export function compareByDateAsc(left, right) {
  const leftDate = coerceDate(left)?.getTime() || 0;
  const rightDate = coerceDate(right)?.getTime() || 0;
  return leftDate - rightDate;
}

export function compareByDateDesc(left, right) {
  return compareByDateAsc(right, left);
}
