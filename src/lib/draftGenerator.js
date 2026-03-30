import { getStartOfWeek, toISODate } from '../utils/date';

export function getPlanningWeekStart(referenceDate = new Date()) {
  return toISODate(getStartOfWeek(referenceDate));
}

export function getNextMonday() {
  return getPlanningWeekStart();
}

export function calculateWeekNumber(student) {
  if (!student?.startDate) return 1;
  const start = new Date(student.startDate);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
}

export function distributeHours(totalHours, sectionPriorities = {}) {
  const sections = Object.keys(sectionPriorities);
  if (!sections.length) return {};
  const minutesPerSection = Math.round((Number(totalHours) || 0) * 60 / sections.length);
  return sections.reduce((collection, section) => {
    collection[section] = minutesPerSection;
    return collection;
  }, {});
}

export function generateWeeklyDraft(student, mqlErrors = [], checkIns = {}, previousPlan = null, coachConfig = {}) {
  return {
    id: `manual-${student?.id || 'student'}-${getPlanningWeekStart()}`,
    studentId: student?.id || null,
    weekStart: coachConfig.weekStart || getPlanningWeekStart(),
    status: 'draft',
    source: 'manual-only',
    days: [],
    notes: '',
    mqlCount: Array.isArray(mqlErrors) ? mqlErrors.length : 0,
    checkInCount: Object.keys(checkIns || {}).length,
    previousPlanId: previousPlan?.id || null,
  };
}

export default {
  getPlanningWeekStart,
  getNextMonday,
  calculateWeekNumber,
  distributeHours,
  generateWeeklyDraft,
};
