import {
  DAT_SECTION_CODES,
  SECTION_CODE_TO_KEY,
  calculateStudyAllocation,
  getPlanId,
  summarizeWeeklyPlan,
} from '../features/schedules/utils';
import { compareByDateAsc, compareByDateDesc, formatMonthKey, getStartOfWeek, toISODate } from './date';

export function getStudentMap(students) {
  return (Array.isArray(students) ? students : []).reduce((collection, student) => {
    collection[student.id] = student;
    return collection;
  }, {});
}

export function getStudentPayments(payments, studentId) {
  return (Array.isArray(payments) ? payments : [])
    .filter((payment) => payment.studentId === studentId)
    .sort((left, right) => compareByDateDesc(left.date, right.date));
}

export function getCurrentWeeklyPlan(weeklyPlans, studentId, weekStart = getStartOfWeek()) {
  if (!weeklyPlans || !studentId) return null;
  const key = getPlanId(studentId, typeof weekStart === 'string' ? weekStart : toISODate(weekStart));
  return weeklyPlans[key] || weeklyPlans[studentId] || null;
}

export function getStudentPracticeTests(practiceTests, studentId) {
  return (Array.isArray(practiceTests) ? practiceTests : [])
    .filter((test) => test.studentId === studentId)
    .sort((left, right) => {
      if (left.testNumber !== right.testNumber) return left.testNumber - right.testNumber;
      return compareByDateAsc(left.date || left.takenOn, right.date || right.takenOn);
    });
}

export function getLastPracticeTest(practiceTests, studentId) {
  const tests = getStudentPracticeTests(practiceTests, studentId);
  return tests[tests.length - 1] || null;
}

function getSectionScore(test, code) {
  const key = SECTION_CODE_TO_KEY[code];
  const value = test.sectionScores?.[code]
    ?? test.sectionScores?.[key]
    ?? test.sections?.[key]
    ?? test.sections?.[code]
    ?? null;
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function getStudentTrendSeries(practiceTests, studentId) {
  return getStudentPracticeTests(practiceTests, studentId).map((test) => ({
    label: `PT ${test.testNumber}`,
    ...DAT_SECTION_CODES.reduce((collection, code) => {
      collection[code] = getSectionScore(test, code);
      return collection;
    }, {}),
  }));
}

export function getStudentProgressSeries(student, practiceTests = []) {
  const tests = getStudentPracticeTests(practiceTests, student?.id);
  return tests.map((test) => ({
    label: `PT ${test.testNumber}`,
    score: DAT_SECTION_CODES
      .map((code) => getSectionScore(test, code))
      .filter((value) => value !== null)
      .reduce((sum, value, _, values) => sum + (value / values.length), 0),
  }));
}

export function getRevenueSeries(payments) {
  const grouped = (Array.isArray(payments) ? payments : [])
    .sort((left, right) => compareByDateAsc(left.date, right.date))
    .reduce((collection, payment) => {
      const key = formatMonthKey(payment.date);
      collection[key] = (collection[key] || 0) + payment.amount;
      return collection;
    }, {});

  return Object.entries(grouped).map(([month, revenue]) => ({ month, revenue }));
}

export function getStudentInvoiceStatus(student) {
  if (!(student?.remainingBalance || student?.amountOwed) && (student?.amountPaid || 0) > 0) return 'Paid';
  if ((student?.amountPaid || 0) > 0 && (student?.remainingBalance || student?.amountOwed || 0) > 0) return 'Partial';
  if ((student?.remainingBalance || student?.amountOwed || 0) > 0) return 'Outstanding';
  return 'Not started';
}

export function getMqlStatsBySection(mqlEntries, studentId) {
  return (Array.isArray(mqlEntries) ? mqlEntries : [])
    .filter((entry) => entry.studentId === studentId)
    .reduce((collection, entry) => {
      collection[entry.section] = (collection[entry.section] || 0) + 1;
      return collection;
    }, {});
}

export function getMqlStatsBySectionAndErrorType(mqlEntries, studentId) {
  return (Array.isArray(mqlEntries) ? mqlEntries : [])
    .filter((entry) => entry.studentId === studentId)
    .reduce((collection, entry) => {
      if (!collection[entry.section]) collection[entry.section] = {};
      collection[entry.section][entry.errorType] = (collection[entry.section][entry.errorType] || 0) + 1;
      return collection;
    }, {});
}

export function getStudentDirectory(students, payments, weeklyPlans, practiceTests = [], mqlEntries = []) {
  return (Array.isArray(students) ? students : []).map((student) => {
    const studentPayments = getStudentPayments(payments, student.id);
    const currentPlan = getCurrentWeeklyPlan(weeklyPlans, student.id);
    const latestPracticeTest = getLastPracticeTest(practiceTests, student.id);

    return {
      ...student,
      paymentCount: studentPayments.length,
      latestPayment: studentPayments[0] || null,
      latestPracticeTest,
      invoiceStatus: getStudentInvoiceStatus(student),
      currentPlan,
      currentPlanSummary: summarizeWeeklyPlan(currentPlan),
      mqlStats: getMqlStatsBySection(mqlEntries, student.id),
      studyAllocation: calculateStudyAllocation({
        ...student,
        practiceTests: getStudentPracticeTests(practiceTests, student.id),
        mqlEntries: (Array.isArray(mqlEntries) ? mqlEntries : []).filter((entry) => entry.studentId === student.id),
      }),
    };
  });
}

export function getCoachDashboardSnapshot({ students, payments, weeklyPlans, practiceTests = [], mqlEntries = [] }) {
  const roster = getStudentDirectory(students, payments, weeklyPlans, practiceTests, mqlEntries);
  const totalCollected = (Array.isArray(students) ? students : []).reduce((sum, student) => sum + (Number(student.amountPaid) || 0), 0);
  const totalOutstanding = (Array.isArray(students) ? students : []).reduce((sum, student) => (
    sum + (Number(student.remainingBalance || student.amountOwed) || 0)
  ), 0);

  return {
    metrics: [
      { label: 'Student roster', value: roster.length, helper: 'manual student profiles' },
      { label: 'Collected to date', value: totalCollected, helper: 'manual payment summaries' },
      { label: 'Outstanding balance', value: totalOutstanding, helper: `${roster.filter((student) => (student.remainingBalance || student.amountOwed || 0) > 0).length} open balances` },
      { label: 'Practice tests logged', value: (Array.isArray(practiceTests) ? practiceTests.length : 0), helper: 'manual DAT test entries' },
    ],
    revenueSeries: getRevenueSeries(payments),
    roster,
  };
}

export function getCoachNotifications() {
  return [];
}
