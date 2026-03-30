import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getPlanId } from '../../features/schedules/utils';
import {
  DAT_SECTIONS,
  MQL_ERROR_TYPES,
  WEEKDAY_META,
  createEmptySectionScores,
} from '../../data/manualWorkflow';
import { SECTION_KEY_TO_CODE } from '../../features/schedules/utils';
import { compareByDateDesc, getStartOfWeek, toISODate } from '../../utils/date';

const PortalContext = createContext(null);

const LS_SESSION = 'acethedat.session';
const LS_USERS = 'acethedat.users';
const LS_STUDENTS = 'acethedat.students';
const LS_WEEKLY_PLANS = 'acethedat.weeklyPlans';
const LS_TASK_COMPLETION = 'acethedat.taskCompletion';
const LS_NOTES = 'acethedat.notes';
const LS_MQL_ENTRIES = 'acethedat.mqlEntries';
const LS_PRACTICE_TESTS = 'acethedat.practiceTests';
const LS_STUDENT_PAYMENTS = 'acethedat.studentPayments';
const LS_TEAM_PAYMENTS = 'acethedat.teamPayments';

const LEGACY_DEMO_EMAIL_SUFFIX = '.demo';
const BOOTSTRAP_COACH_ACCOUNT = Object.freeze({
  email: 'thomas@acethedat.com',
  password: 'Coach2024!',
  profileId: 'coach-thomas',
  role: 'coach',
  name: 'Thomas',
  studentId: null,
  homePath: '/coach/dashboard',
});

function readLS(key) {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeLS(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function formatWeekLabel(weekStart) {
  if (!weekStart) return 'This Week';
  const start = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(start.valueOf())) return 'This Week';
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

function isLegacyDemoEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith(LEGACY_DEMO_EMAIL_SUFFIX);
}

function filterLegacyDemoStudents(students) {
  return (Array.isArray(students) ? students : []).filter((student) => !isLegacyDemoEmail(student?.email));
}

function getNextStudentId(students) {
  const nextNumber = (Array.isArray(students) ? students : []).reduce((max, student) => {
    const numericId = Number(String(student?.id || '').replace(/\D/g, ''));
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0) + 1;

  return `S${String(nextNumber).padStart(2, '0')}`;
}

function filterStudentScopedList(records, validStudentIds) {
  return (Array.isArray(records) ? records : []).filter((record) => validStudentIds.has(record?.studentId));
}

function filterStudentScopedMap(records, validStudentIds) {
  return Object.entries(records || {}).reduce((collection, [key, value]) => {
    const studentId = value?.studentId || key.split(':')[0] || key;
    if (validStudentIds.has(studentId)) {
      collection[key] = value;
    }
    return collection;
  }, {});
}

function normalizeUsers(users) {
  const list = Array.isArray(users) ? users : Object.values(users || {});
  const normalized = list.reduce((collection, user) => {
    if (!user?.email) return collection;
    collection[user.email.toLowerCase()] = {
      ...user,
      email: user.email.toLowerCase(),
    };
    return collection;
  }, {});

  if (!normalized[BOOTSTRAP_COACH_ACCOUNT.email]) {
    normalized[BOOTSTRAP_COACH_ACCOUNT.email] = BOOTSTRAP_COACH_ACCOUNT;
  }

  return normalized;
}

function normalizeStudent(student) {
  if (!student?.id || !student?.name) return null;

  const amountPaid = Number(student.amountPaid ?? student.paymentSummary?.amountPaid ?? 0) || 0;
  const remainingBalance = Number(
    student.remainingBalance
      ?? student.amountOwed
      ?? student.paymentSummary?.remainingBalance
      ?? 0,
  ) || 0;
  const nextPaymentDate = student.nextPaymentDate
    || student.nextPaymentDue
    || student.paymentSummary?.nextPaymentDate
    || '';

  return {
    ...student,
    name: student.name.trim(),
    email: (student.email || '').trim().toLowerCase(),
    initials: student.initials
      || student.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    color: student.color || student.accentColor || '#C9A84C',
    phone: student.phone || '',
    status: student.status || 'Active',
    program: student.program || student.focusArea || 'DAT Coaching',
    phase: student.phase || 'Foundation',
    testDate: student.testDate || student.targetExamDate || '',
    targetExamDate: student.testDate || student.targetExamDate || '',
    coachNote: student.coachNote || '',
    weeklyCommitmentHours: Number(
      student.weeklyCommitmentHours
        ?? student.weeklyStudyHours
        ?? student.weeklyHours
        ?? 15,
    ) || 15,
    amountPaid,
    remainingBalance,
    amountDue: remainingBalance,
    amountOwed: remainingBalance,
    nextPaymentDate,
    nextPaymentDue: nextPaymentDate,
  };
}

function getPlanTimestamp(plan) {
  return new Date(
    plan?.publishedAt
      || plan?.savedAt
      || plan?.createdAt
      || plan?.weekStart
      || plan?.weekOf
      || 0,
  ).getTime();
}

function getPlanWeekStart(plan) {
  return plan?.weekStart || plan?.weekOf || toISODate(getStartOfWeek());
}

function createEmptyPlanTask(dayKey, taskIndex = 0) {
  return {
    id: `${dayKey.toLowerCase()}-${Date.now()}-${taskIndex}`,
    text: '',
    minutes: 45,
    mins: 45,
    note: '',
  };
}

function normalizePlanTask(task, dayKey, taskIndex) {
  const minutes = Number(task?.minutes ?? task?.mins ?? 45) || 45;
  return {
    ...task,
    id: task?.id || `${dayKey.toLowerCase()}-${taskIndex}`,
    text: task?.text || task?.title || task?.topic || '',
    minutes,
    mins: minutes,
    note: task?.note || '',
  };
}

function normalizePlanDay(day, index) {
  const meta = WEEKDAY_META[index];
  const dayKey = day?.id || meta.key;
  const label = day?.label || meta.label;

  return {
    ...meta,
    ...day,
    id: dayKey,
    label,
    short: day?.short || meta.short,
    isToday: label === getTodayLabel(),
    tasks: (day?.tasks || []).map((task, taskIndex) => normalizePlanTask(task, dayKey, taskIndex)),
  };
}

function createEmptyWeeklyPlan(studentId, weekStart = toISODate(getStartOfWeek())) {
  return {
    id: getPlanId(studentId, weekStart),
    studentId,
    weekStart,
    weekOf: weekStart,
    weekLabel: formatWeekLabel(weekStart),
    status: 'draft',
    days: WEEKDAY_META.map((day, index) => normalizePlanDay(day, index)),
  };
}

function normalizeWeeklyPlan(plan) {
  if (!plan) return null;

  const weekStart = getPlanWeekStart(plan);
  const basePlan = createEmptyWeeklyPlan(plan.studentId, weekStart);

  if (Array.isArray(plan.days)) {
    return {
      ...basePlan,
      ...plan,
      id: getPlanId(plan.studentId, weekStart),
      weekStart,
      weekOf: plan.weekOf || weekStart,
      weekLabel: plan.weekLabel || formatWeekLabel(weekStart),
      status: plan.status || 'draft',
      days: WEEKDAY_META.map((meta, index) => normalizePlanDay(plan.days[index] || meta, index)),
    };
  }

  if (plan.days && typeof plan.days === 'object') {
    return {
      ...basePlan,
      ...plan,
      id: getPlanId(plan.studentId, weekStart),
      weekStart,
      weekOf: plan.weekOf || weekStart,
      weekLabel: plan.weekLabel || formatWeekLabel(weekStart),
      status: plan.status || 'draft',
      days: WEEKDAY_META.map((meta, index) => normalizePlanDay({
        ...meta,
        tasks: plan.days[meta.key] || [],
      }, index)),
    };
  }

  return basePlan;
}

function normalizeStoredWeeklyPlans(plans, validStudentIds) {
  return Object.entries(plans || {}).reduce((collection, [, plan]) => {
    const studentId = plan?.studentId;
    if (!studentId || !validStudentIds.has(studentId)) return collection;
    const normalizedPlan = normalizeWeeklyPlan(plan);
    if (!normalizedPlan) return collection;
    collection[normalizedPlan.id] = normalizedPlan;
    return collection;
  }, {});
}

function buildWeeklyPlanHistory(plans) {
  const history = {};

  Object.values(plans || {}).forEach((plan) => {
    if (!plan?.studentId) return;
    if (!history[plan.studentId]) {
      history[plan.studentId] = [];
    }
    history[plan.studentId].push(plan);
  });

  Object.keys(history).forEach((studentId) => {
    history[studentId].sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left));
  });

  return history;
}

function getCurrentWeeklyPlanRecord(weeklyPlans, studentId, weekStart = toISODate(getStartOfWeek())) {
  if (!weeklyPlans || !studentId) return null;
  return weeklyPlans[getPlanId(studentId, weekStart)] || null;
}

function getLatestWeeklyPlanRecord(weeklyPlans, studentId) {
  return Object.values(weeklyPlans || {})
    .filter((plan) => plan?.studentId === studentId)
    .sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left))[0] || null;
}

function getLatestPublishedPlanRecord(weeklyPlans, studentId) {
  return Object.values(weeklyPlans || {})
    .filter((plan) => plan?.studentId === studentId && plan?.status === 'published')
    .sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left))[0] || null;
}

function getPreferredStudentPlan(weeklyPlans, studentId) {
  return (
    getCurrentWeeklyPlanRecord(weeklyPlans, studentId)
    || getLatestPublishedPlanRecord(weeklyPlans, studentId)
    || getLatestWeeklyPlanRecord(weeklyPlans, studentId)
    || null
  );
}

function normalizeMqlEntry(entry) {
  if (!entry?.studentId) return null;

  const errorType = MQL_ERROR_TYPES.includes(entry.errorType)
    ? entry.errorType
    : (MQL_ERROR_TYPES.find((type) => type.toLowerCase() === String(entry.category || '').toLowerCase()) || '');

  return {
    id: entry.id || `mql-${Date.now()}`,
    studentId: entry.studentId,
    date: entry.date || (entry.createdAt ? entry.createdAt.split('T')[0] : toISODate(new Date())),
    createdAt: entry.createdAt || new Date().toISOString(),
    section: entry.section || '',
    errorType,
    questionReference: entry.questionReference
      || [entry.examNumber, entry.questionNumber].filter(Boolean).join(' #')
      || '',
    explanation: entry.explanation || entry.description || entry.whyMissed || entry.reasoning || '',
    description: entry.description || entry.explanation || entry.whyMissed || entry.reasoning || '',
    correctReasoning: entry.correctReasoning || entry.correction || entry.takeaway || '',
    correction: entry.correction || entry.correctReasoning || entry.takeaway || '',
    actionItem: entry.actionItem || entry.intervention || '',
  };
}

function normalizePracticeTest(record) {
  if (!record?.studentId) return null;
  const generatedId = record.id || record.testId || `pt-${Date.now()}`;

  const sections = DAT_SECTIONS.reduce((collection, section) => {
    const code = SECTION_KEY_TO_CODE[section];
    const rawValue = record.sections?.[section]
      ?? record.sectionScores?.[code]
      ?? record.sectionScores?.[section]
      ?? record[section]
      ?? record[code]
      ?? null;
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      collection[section] = null;
      return collection;
    }
    const numericValue = Number(rawValue);
    collection[section] = Number.isFinite(numericValue) ? numericValue : null;
    return collection;
  }, {});

  const sectionScores = Object.entries(SECTION_KEY_TO_CODE).reduce((collection, [sectionKey, code]) => {
    collection[code] = sections[sectionKey] ?? null;
    return collection;
  }, {});

  return {
    id: generatedId,
    testId: generatedId,
    studentId: record.studentId,
    testNumber: Math.min(15, Math.max(1, Number(record.testNumber) || 1)),
    date: record.date || record.takenOn || toISODate(new Date()),
    takenOn: record.takenOn || record.date || toISODate(new Date()),
    sections,
    sectionScores,
    notes: record.notes || '',
    createdAt: record.createdAt || new Date().toISOString(),
  };
}

function comparePracticeTests(left, right) {
  if (left.testNumber !== right.testNumber) {
    return left.testNumber - right.testNumber;
  }
  return new Date(left.takenOn).getTime() - new Date(right.takenOn).getTime();
}

function normalizeStudentPayment(payment) {
  if (!payment?.studentId) return null;
  return {
    id: payment.id || `pay-${Date.now()}`,
    studentId: payment.studentId,
    date: payment.date || toISODate(new Date()),
    amount: Number(payment.amount) || 0,
    method: payment.method || 'Manual',
    note: payment.note || '',
    kind: payment.kind || 'Payment',
  };
}

function normalizeTeamPayment(payment) {
  return {
    id: payment.id || `team-${Date.now()}`,
    payee: payment.payee || '',
    date: payment.date || toISODate(new Date()),
    amount: Number(payment.amount) || 0,
    note: payment.note || '',
  };
}

export function PortalProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [weeklyPlans, setWeeklyPlans] = useState({});
  const [weeklyPlanHistory, setWeeklyPlanHistory] = useState({});
  const [taskCompletion, setTaskCompletion] = useState({});
  const [notes, setNotes] = useState({});
  const [mqlEntries, setMqlEntries] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [teamPayments, setTeamPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(() => {
    const users = normalizeUsers(readLS(LS_USERS));
    writeLS(LS_USERS, users);

    const storedStudents = filterLegacyDemoStudents(readLS(LS_STUDENTS) || [])
      .map(normalizeStudent)
      .filter(Boolean);
    writeLS(LS_STUDENTS, storedStudents);
    setStudents(storedStudents);

    const validStudentIds = new Set(storedStudents.map((student) => student.id));

    const storedPlans = normalizeStoredWeeklyPlans(readLS(LS_WEEKLY_PLANS) || {}, validStudentIds);
    writeLS(LS_WEEKLY_PLANS, storedPlans);
    setWeeklyPlans(storedPlans);
    setWeeklyPlanHistory(buildWeeklyPlanHistory(storedPlans));

    const storedTaskCompletion = filterStudentScopedMap(readLS(LS_TASK_COMPLETION) || {}, validStudentIds);
    const storedNotes = filterStudentScopedMap(readLS(LS_NOTES) || {}, validStudentIds);
    writeLS(LS_TASK_COMPLETION, storedTaskCompletion);
    writeLS(LS_NOTES, storedNotes);
    setTaskCompletion(storedTaskCompletion);
    setNotes(storedNotes);

    const storedMqlEntries = filterStudentScopedList(readLS(LS_MQL_ENTRIES) || [], validStudentIds)
      .map(normalizeMqlEntry)
      .filter(Boolean);
    writeLS(LS_MQL_ENTRIES, storedMqlEntries);
    setMqlEntries(storedMqlEntries);

    const storedPracticeTests = filterStudentScopedList(readLS(LS_PRACTICE_TESTS) || [], validStudentIds)
      .map(normalizePracticeTest)
      .filter(Boolean)
      .sort(comparePracticeTests);
    writeLS(LS_PRACTICE_TESTS, storedPracticeTests);
    setPracticeTests(storedPracticeTests);

    const storedStudentPayments = filterStudentScopedList(readLS(LS_STUDENT_PAYMENTS) || [], validStudentIds)
      .map(normalizeStudentPayment)
      .filter(Boolean)
      .sort((left, right) => compareByDateDesc(left.date, right.date));
    writeLS(LS_STUDENT_PAYMENTS, storedStudentPayments);
    setStudentPayments(storedStudentPayments);

    const storedTeamPayments = (Array.isArray(readLS(LS_TEAM_PAYMENTS)) ? readLS(LS_TEAM_PAYMENTS) : [])
      .map(normalizeTeamPayment)
      .sort((left, right) => compareByDateDesc(left.date, right.date));
    writeLS(LS_TEAM_PAYMENTS, storedTeamPayments);
    setTeamPayments(storedTeamPayments);

    return { students: storedStudents, users };
  }, []);

  useEffect(() => {
    const storedSession = readLS(LS_SESSION);
    const { students: loadedStudents } = loadAllData();

    if (storedSession?.role) {
      const restoredStudent = storedSession.studentId
        ? loadedStudents.find((student) => student.id === storedSession.studentId) || null
        : null;

      if (storedSession.role === 'student' && !restoredStudent) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(LS_SESSION);
        }
        setLoading(false);
        return;
      }

      setSession(storedSession);
      setCurrentProfile({
        id: storedSession.profileId,
        role: storedSession.role,
        name: storedSession.name,
        email: storedSession.email || '',
        studentId: storedSession.studentId || null,
        homePath: storedSession.homePath || (storedSession.role === 'coach' ? '/coach/dashboard' : '/student/dashboard'),
        label: storedSession.role === 'coach' ? 'Coach Workspace' : `${storedSession.name} Portal`,
      });
      setCurrentStudent(restoredStudent);
    }

    setLoading(false);
  }, [loadAllData]);

  useEffect(() => {
    if (session?.role === 'student' && session.studentId) {
      setCurrentStudent(students.find((student) => student.id === session.studentId) || null);
    }
  }, [session, students]);

  const loginWithCredentials = useCallback(async (email, password) => {
    const users = normalizeUsers(readLS(LS_USERS));
    writeLS(LS_USERS, users);

    const credential = users[email.trim().toLowerCase()];
    if (!credential || credential.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    const nextSession = {
      email: credential.email,
      profileId: credential.profileId,
      role: credential.role,
      name: credential.name,
      studentId: credential.studentId,
      homePath: credential.homePath,
    };

    writeLS(LS_SESSION, nextSession);
    setSession(nextSession);

    const profile = {
      id: credential.profileId,
      role: credential.role,
      name: credential.name,
      email: credential.email,
      studentId: credential.studentId,
      homePath: credential.homePath,
      label: credential.role === 'coach' ? 'Coach Workspace' : `${credential.name} Portal`,
    };
    setCurrentProfile(profile);

    const { students: loadedStudents } = loadAllData();
    if (credential.studentId) {
      const foundStudent = loadedStudents.find((student) => student.id === credential.studentId) || null;
      if (!foundStudent) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(LS_SESSION);
        }
        setSession(null);
        setCurrentProfile(null);
        setCurrentStudent(null);
        return { success: false, error: 'This student account is no longer active.' };
      }
      setCurrentStudent(foundStudent);
    } else {
      setCurrentStudent(null);
    }

    return { success: true, profile };
  }, [loadAllData]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LS_SESSION);
    }
    setSession(null);
    setCurrentProfile(null);
    setCurrentStudent(null);
  }, []);

  const addStudent = useCallback(async (studentData) => {
    const email = (studentData.email || '').trim().toLowerCase();
    const password = studentData.password || '';

    if (!studentData.name?.trim()) {
      return { success: false, error: 'Name is required.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email is required.' };
    }
    if (isLegacyDemoEmail(email)) {
      return { success: false, error: 'Please use a real email address.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const existingUsers = normalizeUsers(readLS(LS_USERS));
    if (existingUsers[email] || students.some((student) => student.email === email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const id = getNextStudentId(students);
    const student = normalizeStudent({
      id,
      name: studentData.name,
      email,
      phone: studentData.phone || '',
      program: studentData.program || 'DAT Coaching',
      phase: studentData.phase || 'Foundation',
      testDate: studentData.testDate || '',
      weeklyCommitmentHours: studentData.weeklyCommitmentHours || 15,
      status: 'Active',
      coachNote: '',
      amountPaid: 0,
      remainingBalance: 0,
      nextPaymentDate: '',
    });

    const nextStudents = [...students, student];
    setStudents(nextStudents);
    writeLS(LS_STUDENTS, nextStudents);

    const nextUsers = {
      ...existingUsers,
      [email]: {
        email,
        password,
        profileId: `student-${id}`,
        role: 'student',
        name: student.name,
        studentId: id,
        homePath: '/student/dashboard',
      },
    };
    writeLS(LS_USERS, nextUsers);

    return { success: true, student, user: nextUsers[email] };
  }, [students]);

  const updateStudent = useCallback((studentId, updates) => {
    setStudents((previousStudents) => {
      const nextStudents = previousStudents.map((student) => {
        if (student.id !== studentId) return student;
        return normalizeStudent({
          ...student,
          ...updates,
          amountPaid: updates.amountPaid ?? student.amountPaid,
          remainingBalance: updates.remainingBalance ?? updates.amountOwed ?? student.remainingBalance,
          nextPaymentDate: updates.nextPaymentDate ?? updates.nextPaymentDue ?? student.nextPaymentDate,
        });
      }).filter(Boolean);
      writeLS(LS_STUDENTS, nextStudents);
      return nextStudents;
    });
  }, []);

  const updateStudentSections = useCallback((studentId, sections) => {
    updateStudent(studentId, { sections });
  }, [updateStudent]);

  const updateStudentPaymentSummary = useCallback((studentId, summary) => {
    updateStudent(studentId, {
      amountPaid: Number(summary.amountPaid) || 0,
      remainingBalance: Number(summary.remainingBalance) || 0,
      amountDue: Number(summary.remainingBalance) || 0,
      nextPaymentDate: summary.nextPaymentDate || '',
    });
  }, [updateStudent]);

  const toggleTask = useCallback((taskId) => {
    if (!currentStudent?.id) return;
    const key = `${currentStudent.id}:${taskId}`;
    setTaskCompletion((previousCompletion) => {
      const nextCompletion = {
        ...previousCompletion,
        [key]: !previousCompletion[key],
      };
      writeLS(LS_TASK_COMPLETION, nextCompletion);
      return nextCompletion;
    });
  }, [currentStudent]);

  const saveNote = useCallback((dayId, text) => {
    if (!currentStudent?.id) return;
    const key = `${currentStudent.id}:${dayId}`;
    setNotes((previousNotes) => {
      const nextNotes = {
        ...previousNotes,
        [key]: text,
      };
      writeLS(LS_NOTES, nextNotes);
      return nextNotes;
    });
  }, [currentStudent]);

  const saveWeeklyPlan = useCallback((studentId, plan) => {
    const normalizedPlan = normalizeWeeklyPlan({
      ...plan,
      studentId,
    });
    const savedPlan = {
      ...normalizedPlan,
      savedAt: new Date().toISOString(),
    };

    setWeeklyPlans((previousPlans) => {
      const nextPlans = {
        ...previousPlans,
        [savedPlan.id]: savedPlan,
      };
      writeLS(LS_WEEKLY_PLANS, nextPlans);
      return nextPlans;
    });

    setWeeklyPlanHistory((previousHistory) => {
      const existingPlans = (previousHistory[studentId] || []).filter((existingPlan) => existingPlan.id !== savedPlan.id);
      return {
        ...previousHistory,
        [studentId]: [savedPlan, ...existingPlans].sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left)),
      };
    });

    return savedPlan;
  }, []);

  const updateWeeklyPlan = useCallback((planId, updater) => {
    setWeeklyPlans((previousPlans) => {
      const currentPlan = previousPlans[planId];
      if (!currentPlan) return previousPlans;
      const nextPlan = normalizeWeeklyPlan({
        ...updater(currentPlan),
        studentId: currentPlan.studentId,
      });
      const savedPlan = {
        ...nextPlan,
        savedAt: new Date().toISOString(),
      };
      const nextPlans = {
        ...previousPlans,
        [planId]: savedPlan,
      };
      writeLS(LS_WEEKLY_PLANS, nextPlans);
      return nextPlans;
    });

    setWeeklyPlanHistory((previousHistory) => {
      const historyEntries = Object.entries(previousHistory).reduce((collection, [studentId, plans]) => {
        collection[studentId] = plans.map((plan) => (
          plan.id === planId
            ? {
              ...normalizeWeeklyPlan(updater(plan)),
              savedAt: new Date().toISOString(),
            }
            : plan
        )).sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left));
        return collection;
      }, {});
      return historyEntries;
    });
  }, []);

  const publishWeeklyPlan = useCallback((studentId, planId) => {
    let publishedPlan = null;

    setWeeklyPlans((previousPlans) => {
      const currentPlan = previousPlans[planId]
        || getCurrentWeeklyPlanRecord(previousPlans, studentId)
        || getLatestWeeklyPlanRecord(previousPlans, studentId);
      if (!currentPlan) return previousPlans;

      publishedPlan = {
        ...currentPlan,
        status: 'published',
        publishedAt: currentPlan.publishedAt || new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };

      const nextPlans = {
        ...previousPlans,
        [publishedPlan.id]: publishedPlan,
      };
      writeLS(LS_WEEKLY_PLANS, nextPlans);
      return nextPlans;
    });

    if (publishedPlan) {
      setWeeklyPlanHistory((previousHistory) => {
        const existingPlans = (previousHistory[studentId] || []).filter((plan) => plan.id !== publishedPlan.id);
        return {
          ...previousHistory,
          [studentId]: [publishedPlan, ...existingPlans].sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left)),
        };
      });
    }

    return publishedPlan;
  }, []);

  const getWeeklyPlan = useCallback((studentId, weekStart) => {
    if (!studentId) return null;
    if (weekStart) {
      return normalizeWeeklyPlan(getCurrentWeeklyPlanRecord(weeklyPlans, studentId, weekStart));
    }
    return normalizeWeeklyPlan(getPreferredStudentPlan(weeklyPlans, studentId));
  }, [weeklyPlans]);

  const createWeeklyPlanDraft = useCallback((studentId, weekStart = toISODate(getStartOfWeek())) => (
    createEmptyWeeklyPlan(studentId, weekStart)
  ), []);

  const addMqlError = useCallback((entry) => {
    const studentId = entry.studentId || currentStudent?.id;
    if (!studentId) return null;

    const normalizedEntry = normalizeMqlEntry({
      ...entry,
      studentId,
    });
    if (!normalizedEntry) return null;

    setMqlEntries((previousEntries) => {
      const nextEntries = [normalizedEntry, ...previousEntries];
      writeLS(LS_MQL_ENTRIES, nextEntries);
      return nextEntries;
    });

    return normalizedEntry;
  }, [currentStudent]);

  const addMqlErrorForStudent = useCallback((studentId, entry) => {
    return addMqlError({ ...entry, studentId });
  }, [addMqlError]);

  const updateMqlError = useCallback((entryId, updates) => {
    setMqlEntries((previousEntries) => {
      const nextEntries = previousEntries.map((entry) => (
        entry.id === entryId
          ? normalizeMqlEntry({ ...entry, ...updates })
          : entry
      )).filter(Boolean);
      writeLS(LS_MQL_ENTRIES, nextEntries);
      return nextEntries;
    });
  }, []);

  const deleteMqlError = useCallback((entryId) => {
    setMqlEntries((previousEntries) => {
      const nextEntries = previousEntries.filter((entry) => entry.id !== entryId);
      writeLS(LS_MQL_ENTRIES, nextEntries);
      return nextEntries;
    });
  }, []);

  const getStudentMqlEntries = useCallback((studentId) => (
    mqlEntries
      .filter((entry) => entry.studentId === studentId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  ), [mqlEntries]);

  const savePracticeTest = useCallback((studentId, record) => {
    const normalizedRecord = normalizePracticeTest({
      ...record,
      studentId,
    });
    if (!normalizedRecord) return null;

    setPracticeTests((previousTests) => {
      const nextTests = previousTests
        .filter((test) => !(test.studentId === studentId && (
          test.id === normalizedRecord.id || test.testId === normalizedRecord.testId || test.testNumber === normalizedRecord.testNumber
        )))
        .concat(normalizedRecord)
        .sort(comparePracticeTests);
      writeLS(LS_PRACTICE_TESTS, nextTests);
      return nextTests;
    });

    return normalizedRecord;
  }, []);

  const updatePracticeTest = useCallback((studentId, record) => {
    return savePracticeTest(studentId, record);
  }, [savePracticeTest]);

  const deletePracticeTest = useCallback((recordId) => {
    setPracticeTests((previousTests) => {
      const nextTests = previousTests.filter((test) => test.id !== recordId);
      writeLS(LS_PRACTICE_TESTS, nextTests);
      return nextTests;
    });
  }, []);

  const getStudentPracticeTests = useCallback((studentId) => (
    practiceTests
      .filter((test) => test.studentId === studentId)
      .sort(comparePracticeTests)
  ), [practiceTests]);

  const saveStudentPayment = useCallback((studentId, payment) => {
    const normalizedPayment = normalizeStudentPayment({
      ...payment,
      studentId,
    });
    if (!normalizedPayment) return null;

    setStudentPayments((previousPayments) => {
      const nextPayments = previousPayments
        .filter((existingPayment) => existingPayment.id !== normalizedPayment.id)
        .concat(normalizedPayment)
        .sort((left, right) => compareByDateDesc(left.date, right.date));
      writeLS(LS_STUDENT_PAYMENTS, nextPayments);
      return nextPayments;
    });

    return normalizedPayment;
  }, []);

  const deleteStudentPayment = useCallback((paymentId) => {
    setStudentPayments((previousPayments) => {
      const nextPayments = previousPayments.filter((payment) => payment.id !== paymentId);
      writeLS(LS_STUDENT_PAYMENTS, nextPayments);
      return nextPayments;
    });
  }, []);

  const saveTeamPayment = useCallback((payment) => {
    const normalizedPayment = normalizeTeamPayment(payment);
    setTeamPayments((previousPayments) => {
      const nextPayments = previousPayments
        .filter((existingPayment) => existingPayment.id !== normalizedPayment.id)
        .concat(normalizedPayment)
        .sort((left, right) => compareByDateDesc(left.date, right.date));
      writeLS(LS_TEAM_PAYMENTS, nextPayments);
      return nextPayments;
    });
    return normalizedPayment;
  }, []);

  const deleteTeamPayment = useCallback((paymentId) => {
    setTeamPayments((previousPayments) => {
      const nextPayments = previousPayments.filter((payment) => payment.id !== paymentId);
      writeLS(LS_TEAM_PAYMENTS, nextPayments);
      return nextPayments;
    });
  }, []);

  const getStudentPayments = useCallback((studentId) => (
    studentPayments
      .filter((payment) => payment.studentId === studentId)
      .sort((left, right) => compareByDateDesc(left.date, right.date))
  ), [studentPayments]);

  const weeklyPlan = useMemo(() => {
    if (!currentStudent?.id) return null;
    const plan = getPreferredStudentPlan(weeklyPlans, currentStudent.id);
    return normalizeWeeklyPlan(plan);
  }, [currentStudent, weeklyPlans]);

  const paymentSummaries = useMemo(() => (
    students.reduce((collection, student) => {
      collection[student.id] = {
        studentId: student.id,
        amountPaid: student.amountPaid || 0,
        amountDue: student.amountDue ?? student.remainingBalance ?? 0,
        remainingBalance: student.remainingBalance ?? student.amountDue ?? 0,
        nextPaymentDate: student.nextPaymentDate || '',
      };
      return collection;
    }, {})
  ), [students]);

  const value = useMemo(() => ({
    session,
    loading,
    currentProfile,
    currentStudent,
    students,
    weeklyPlan,
    weeklyPlans,
    weeklyPlanHistory,
    taskCompletion,
    notes,
    mqlEntries,
    mqlErrors: mqlEntries,
    practiceTests,
    payments: studentPayments,
    paymentSummaries,
    studentPayments,
    teamPayments,
    loginWithCredentials,
    logout,
    addStudent,
    updateStudent,
    updateStudentSections,
    updateStudentPaymentSummary,
    toggleTask,
    saveNote,
    saveWeeklyPlan,
    updateWeeklyPlan,
    publishWeeklyPlan,
    getWeeklyPlan,
    createWeeklyPlanDraft,
    addMqlError,
    addMqlErrorForStudent,
    updateMqlError,
    deleteMqlError,
    getStudentMqlEntries,
    savePracticeTest,
    updatePracticeTest,
    deletePracticeTest,
    getStudentPracticeTests,
    saveStudentPayment,
    deleteStudentPayment,
    getStudentPayments,
    saveTeamPayment,
    deleteTeamPayment,
    createEmptySectionScores,
  }), [
    session,
    loading,
    currentProfile,
    currentStudent,
    students,
    weeklyPlan,
    weeklyPlans,
    weeklyPlanHistory,
    taskCompletion,
    notes,
    mqlEntries,
    practiceTests,
    studentPayments,
    paymentSummaries,
    teamPayments,
    loginWithCredentials,
    logout,
    addStudent,
    updateStudent,
    updateStudentSections,
    updateStudentPaymentSummary,
    toggleTask,
    saveNote,
    saveWeeklyPlan,
    updateWeeklyPlan,
    publishWeeklyPlan,
    getWeeklyPlan,
    createWeeklyPlanDraft,
    addMqlError,
    addMqlErrorForStudent,
    updateMqlError,
    deleteMqlError,
    getStudentMqlEntries,
    savePracticeTest,
    updatePracticeTest,
    deletePracticeTest,
    getStudentPracticeTests,
    saveStudentPayment,
    deleteStudentPayment,
    getStudentPayments,
    saveTeamPayment,
    deleteTeamPayment,
  ]);

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used inside PortalProvider');
  }
  return context;
}
