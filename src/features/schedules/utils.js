import { getStartOfWeek, toISODate } from '../../utils/date';

export const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SUBJECTS = {
  Bio: { label: 'Biology', color: '#2f6c4f', surface: '#edf6ef' },
  GChem: { label: 'General Chemistry', color: '#2e5daa', surface: '#eef4ff' },
  OChem: { label: 'Organic Chemistry', color: '#7a4ec4', surface: '#f4efff' },
  PAT: { label: 'Perceptual Ability', color: '#b57b18', surface: '#fff6e4' },
  RC: { label: 'Reading Comprehension', color: '#148175', surface: '#ebfaf7' },
  QR: { label: 'Quantitative Reasoning', color: '#b7483e', surface: '#feefed' },
  Strategy: { label: 'Strategy', color: '#735c41', surface: '#f7f2eb' },
  App: { label: 'Application Support', color: '#8d5a9f', surface: '#f8effb' },
};

export const DAT_SECTION_CODES = ['BIO', 'GCH', 'OCH', 'PAT', 'RCT', 'QRT'];

export const SECTION_CODE_TO_KEY = {
  BIO: 'Bio',
  GCH: 'GChem',
  OCH: 'OChem',
  PAT: 'PAT',
  RCT: 'RC',
  QRT: 'QR',
};

export const SECTION_KEY_TO_CODE = Object.entries(SECTION_CODE_TO_KEY).reduce((collection, [code, key]) => {
  collection[key] = code;
  return collection;
}, {});

export const DEFAULT_DAT_WEEKLY_HOURS = 15;
export const DAT_BASELINE_TOTAL_HOURS = 225;
export const DAT_BASELINE_WEEKS = 15;

export function getPlanId(studentId, weekStart) {
  return `${studentId}-${typeof weekStart === 'string' ? weekStart : toISODate(weekStart)}`;
}

function getPlanItems(plan) {
  if (!plan?.days) return [];
  if (Array.isArray(plan.days)) {
    return plan.days.flatMap((day) => day.tasks || []);
  }
  return Object.values(plan.days).flatMap((dayItems) => dayItems || []);
}

function getTaskHours(task) {
  if (typeof task?.hours === 'number') return task.hours;
  if (typeof task?.minutes === 'number') return task.minutes / 60;
  if (typeof task?.mins === 'number') return task.mins / 60;
  return 0;
}

function getTaskSection(task) {
  return task?.section || 'Strategy';
}

function getSectionCodeFromLabel(section) {
  if (!section) return null;
  if (SECTION_CODE_TO_KEY[section]) return section;
  return SECTION_KEY_TO_CODE[section] || null;
}

function getSectionScoreFromTest(test, code) {
  if (!test) return null;
  const key = SECTION_CODE_TO_KEY[code];
  const value = test.sectionScores?.[code]
    ?? test.sectionScores?.[key]
    ?? test.sections?.[key]
    ?? test.sections?.[code]
    ?? test[key]
    ?? null;
  if (value === '' || value === null || value === undefined) return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getSectionErrorCount(entries, code) {
  const key = SECTION_CODE_TO_KEY[code];
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const sectionCode = getSectionCodeFromLabel(entry.section);
    return sectionCode === code || entry.section === key;
  }).length;
}

export function summarizeWeeklyPlan(plan) {
  const items = getPlanItems(plan);
  const totalHours = items.reduce((sum, item) => sum + getTaskHours(item), 0);
  const completedItems = items.filter((item) => item.completed);
  const completedHours = completedItems.reduce((sum, item) => sum + getTaskHours(item), 0);
  const sectionHours = items.reduce((collection, item) => {
    const section = getTaskSection(item);
    collection[section] = (collection[section] || 0) + getTaskHours(item);
    return collection;
  }, {});

  return {
    completionRate: items.length ? (completedItems.length / items.length) * 100 : 0,
    completedHours,
    totalHours,
    totalBlocks: items.length,
    completedBlocks: completedItems.length,
    sectionHours,
  };
}

export function calculateStudyAllocation(student) {
  const practiceTests = Array.isArray(student?.practiceTests) ? student.practiceTests : [];
  const mqlEntries = Array.isArray(student?.mqlEntries) ? student.mqlEntries : [];
  const weeklyHours = Number(student?.weeklyCommitmentHours || student?.weeklyHours || DEFAULT_DAT_WEEKLY_HOURS) || DEFAULT_DAT_WEEKLY_HOURS;
  const recentTests = practiceTests.slice(-3);
  const totalErrors = mqlEntries.length || 1;

  const rawWeights = DAT_SECTION_CODES.reduce((collection, code) => {
    const scores = recentTests
      .map((test) => getSectionScoreFromTest(test, code))
      .filter((value) => value !== null);
    const averageScore = scores.length
      ? scores.reduce((sum, value) => sum + value, 0) / scores.length
      : 20;
    const scoreDeficit = Math.max(0, 30 - averageScore) / 30;
    const errorCount = getSectionErrorCount(mqlEntries, code);
    const errorWeight = errorCount / totalErrors;
    const weight = 1 + (scoreDeficit * 2.4) + (errorWeight * 2);

    collection[code] = {
      averageScore,
      errorCount,
      weight,
    };
    return collection;
  }, {});

  const totalWeight = Object.values(rawWeights).reduce((sum, entry) => sum + entry.weight, 0) || 1;

  return DAT_SECTION_CODES.reduce((collection, code) => {
    collection[code] = Number(((rawWeights[code].weight / totalWeight) * weeklyHours).toFixed(1));
    return collection;
  }, {});
}

export function getStudyAllocationDetails(student) {
  const allocation = calculateStudyAllocation(student);
  return DAT_SECTION_CODES.map((code) => ({
    code,
    key: SECTION_CODE_TO_KEY[code],
    label: SUBJECTS[SECTION_CODE_TO_KEY[code]].label,
    hours: allocation[code],
  }));
}

export function createCustomPlanItem(dayKey, position = 0) {
  return {
    id: `${dayKey}-manual-${Date.now()}-${position}`,
    section: 'Bio',
    topic: 'Manual study task',
    description: 'Manual study task',
    hours: 1,
    completed: false,
  };
}

export function generateWeeklyPlan({ student, weekStart }) {
  const start = toISODate(getStartOfWeek(weekStart));
  return {
    id: getPlanId(student?.id || 'student', start),
    studentId: student?.id || null,
    weekStart: start,
    published: false,
    days: DAY_KEYS.reduce((collection, dayKey) => {
      collection[dayKey] = [];
      return collection;
    }, {}),
    suggestedHours: student ? calculateStudyAllocation(student) : {},
  };
}

export function createSeedWeeklyPlans() {
  return {};
}
