export const DAT_SECTIONS = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC'];

export const DAT_SECTION_LABELS = {
  Bio: 'Biology',
  GChem: 'General Chemistry',
  OChem: 'Organic Chemistry',
  PAT: 'Perceptual Ability',
  QR: 'Quantitative Reasoning',
  RC: 'Reading Comprehension',
};

export const DAT_SECTION_COLORS = {
  Bio: '#ef4444',
  GChem: '#3b82f6',
  OChem: '#8b5cf6',
  PAT: '#f59e0b',
  QR: '#14b8a6',
  RC: '#ec4899',
};

export const WEEKDAY_META = [
  { key: 'Mon', label: 'Monday', short: 'Mon', color: '#c9a84c', bg: 'rgba(201,168,76,0.08)' },
  { key: 'Tue', label: 'Tuesday', short: 'Tue', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  { key: 'Thu', label: 'Thursday', short: 'Thu', color: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
  { key: 'Fri', label: 'Friday', short: 'Fri', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  { key: 'Sat', label: 'Saturday', short: 'Sat', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  { key: 'Sun', label: 'Sunday', short: 'Sun', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
];

export const MQL_ERROR_TYPES = [
  'Knowledge Gap',
  'Classic Mix-Up',
  'Brain Fart',
  'Silly Mistake',
  'Ran Out of Time',
];

export function createEmptySectionScores() {
  return DAT_SECTIONS.reduce((collection, section) => {
    collection[section] = '';
    return collection;
  }, {});
}
