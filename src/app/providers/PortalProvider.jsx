import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../../lib/supabaseClient';
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

/* ── session persistence (localStorage — lightweight, auth-only) ── */
const LS_SESSION = 'acethedat.session';

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

/* ── helpers (unchanged from original) ── */

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

function getNextStudentId(students) {
  const nextNumber = (Array.isArray(students) ? students : []).reduce((max, student) => {
    const numericId = Number(String(student?.id || '').replace(/\D/g, ''));
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0) + 1;

  return `S${String(nextNumber).padStart(2, '0')}`;
}

function normalizeStudent(student) {
  if (!student?.id || !student?.name) return null;

  const amountPaid = Number(student.amountPaid ?? student.amount_paid ?? student.paymentSummary?.amountPaid ?? 0) || 0;
  const remainingBalance = Number(
    student.remainingBalance
      ?? student.remaining_balance
      ?? student.amountOwed
      ?? student.paymentSummary?.remainingBalance
      ?? 0,
  ) || 0;
  const nextPaymentDate = student.nextPaymentDate
    || student.next_payment_date
    || student.nextPaymentDue
    || student.paymentSummary?.nextPaymentDate
    || '';

  return {
    ...student,
    id: student.student_id || student.id,
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
    testDate: student.testDate || student.test_date || student.targetExamDate || '',
    targetExamDate: student.testDate || student.test_date || student.targetExamDate || '',
    coachNote: student.coachNote || student.coach_note || '',
    weeklyCommitmentHours: Number(
      student.weeklyCommitmentHours
        ?? student.weekly_commitment_hours
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
      || plan?.published_at
      || plan?.savedAt
      || plan?.saved_at
      || plan?.createdAt
      || plan?.weekStart
      || plan?.week_start
      || plan?.weekOf
      || 0,
  ).getTime();
}

function getPlanWeekStart(plan) {
  return plan?.weekStart || plan?.week_start || plan?.weekOf || toISODate(getStartOfWeek());
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

  const studentId = plan.studentId || plan.student_id;
  const weekStart = getPlanWeekStart(plan);
  const basePlan = createEmptyWeeklyPlan(studentId, weekStart);

  const rawDays = plan.days;
  if (Array.isArray(rawDays)) {
    return {
      ...basePlan,
      ...plan,
      studentId,
      id: getPlanId(studentId, weekStart),
      weekStart,
      weekOf: plan.weekOf || weekStart,
      weekLabel: plan.weekLabel || plan.week_label || formatWeekLabel(weekStart),
      status: plan.status || 'draft',
      publishedAt: plan.publishedAt || plan.published_at || null,
      savedAt: plan.savedAt || plan.saved_at || null,
      days: WEEKDAY_META.map((meta, index) => normalizePlanDay(rawDays[index] || meta, index)),
    };
  }

  if (rawDays && typeof rawDays === 'object') {
    return {
      ...basePlan,
      ...plan,
      studentId,
      id: getPlanId(studentId, weekStart),
      weekStart,
      weekOf: plan.weekOf || weekStart,
      weekLabel: plan.weekLabel || plan.week_label || formatWeekLabel(weekStart),
      status: plan.status || 'draft',
      publishedAt: plan.publishedAt || plan.published_at || null,
      savedAt: plan.savedAt || plan.saved_at || null,
      days: WEEKDAY_META.map((meta, index) => normalizePlanDay({
        ...meta,
        tasks: rawDays[meta.key] || [],
      }, index)),
    };
  }

  return basePlan;
}

function buildWeeklyPlanHistory(plans) {
  const history = {};

  Object.values(plans || {}).forEach((plan) => {
    const sid = plan?.studentId;
    if (!sid) return;
    if (!history[sid]) history[sid] = [];
    history[sid].push(plan);
  });

  Object.keys(history).forEach((sid) => {
    history[sid].sort((left, right) => getPlanTimestamp(right) - getPlanTimestamp(left));
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
  const studentId = entry?.studentId || entry?.student_id;
  if (!studentId) return null;

  const errorType = MQL_ERROR_TYPES.includes(entry.errorType || entry.error_type)
    ? (entry.errorType || entry.error_type)
    : (MQL_ERROR_TYPES.find((type) => type.toLowerCase() === String(entry.category || '').toLowerCase()) || '');

  return {
    id: entry.id || `mql-${Date.now()}`,
    studentId,
    date: entry.date || (entry.createdAt || entry.created_at ? (entry.createdAt || entry.created_at).split('T')[0] : toISODate(new Date())),
    createdAt: entry.createdAt || entry.created_at || new Date().toISOString(),
    section: entry.section || '',
    errorType,
    questionReference: entry.questionReference
      || entry.question_reference
      || [entry.examNumber, entry.questionNumber].filter(Boolean).join(' #')
      || '',
    explanation: entry.explanation || entry.description || entry.whyMissed || entry.reasoning || '',
    description: entry.description || entry.explanation || entry.whyMissed || entry.reasoning || '',
    correctReasoning: entry.correctReasoning || entry.correct_reasoning || entry.correction || entry.takeaway || '',
    correction: entry.correction || entry.correctReasoning || entry.correct_reasoning || entry.takeaway || '',
    actionItem: entry.actionItem || entry.action_item || entry.intervention || '',
  };
}

function normalizePracticeTest(record) {
  const studentId = record?.studentId || record?.student_id;
  if (!studentId) return null;
  const generatedId = record.id || record.testId || `pt-${Date.now()}`;
  const testNumber = record.testNumber ?? record.test_number ?? 1;

  const sections = DAT_SECTIONS.reduce((collection, section) => {
    const code = SECTION_KEY_TO_CODE[section];
    const rawValue = record.sections?.[section]
      ?? record.sectionScores?.[code]
      ?? record.section_scores?.[code]
      ?? record.sectionScores?.[section]
      ?? record.section_scores?.[section]
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
    studentId,
    testNumber: Math.min(15, Math.max(1, Number(testNumber) || 1)),
    date: record.date || record.takenOn || toISODate(new Date()),
    takenOn: record.takenOn || record.date || toISODate(new Date()),
    sections,
    sectionScores,
    notes: record.notes || '',
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
  };
}

function comparePracticeTests(left, right) {
  if (left.testNumber !== right.testNumber) {
    return left.testNumber - right.testNumber;
  }
  return new Date(left.takenOn).getTime() - new Date(right.takenOn).getTime();
}

function normalizeStudentPayment(payment) {
  const studentId = payment?.studentId || payment?.student_id;
  if (!studentId) return null;
  return {
    id: payment.id || `pay-${Date.now()}`,
    studentId,
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

/* ── Supabase ↔ frontend mappers ── */

function profileToStudent(profile) {
  return normalizeStudent({
    id: profile.student_id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    status: profile.status,
    program: profile.program,
    phase: profile.phase,
    testDate: profile.test_date,
    weeklyCommitmentHours: profile.weekly_commitment_hours,
    coachNote: profile.coach_note,
    color: profile.color,
    amountPaid: profile.amount_paid,
    remainingBalance: profile.remaining_balance,
    nextPaymentDate: profile.next_payment_date,
  });
}

function dbPlanToFrontend(row) {
  return normalizeWeeklyPlan({
    id: row.id,
    studentId: row.student_id,
    weekStart: row.week_start,
    weekLabel: row.week_label,
    status: row.status,
    days: row.days,
    publishedAt: row.published_at,
    savedAt: row.saved_at,
  });
}

function dbMqlToFrontend(row) {
  return normalizeMqlEntry({
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    section: row.section,
    errorType: row.error_type,
    questionReference: row.question_reference,
    explanation: row.explanation,
    correctReasoning: row.correct_reasoning,
    actionItem: row.action_item,
    createdAt: row.created_at,
  });
}

function dbTestToFrontend(row) {
  return normalizePracticeTest({
    id: row.id,
    studentId: row.student_id,
    testNumber: row.test_number,
    date: row.date,
    sections: row.sections,
    sectionScores: row.section_scores,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

function dbStudentPaymentToFrontend(row) {
  return normalizeStudentPayment({
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    amount: row.amount,
    method: row.method,
    note: row.note,
    kind: row.kind,
  });
}

function dbTeamPaymentToFrontend(row) {
  return normalizeTeamPayment({
    id: row.id,
    payee: row.payee,
    date: row.date,
    amount: row.amount,
    note: row.note,
  });
}

/* ══════════════════════════════════════════════════════════════
   PROVIDER
   ══════════════════════════════════════════════════════════════ */

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

  /* ── Load everything from Supabase ── */
  const loadAllData = useCallback(async () => {
    const [
      { data: profileRows },
      { data: planRows },
      { data: completionRows },
      { data: noteRows },
      { data: mqlRows },
      { data: testRows },
      { data: studentPaymentRows },
      { data: teamPaymentRows },
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('weekly_plans').select('*'),
      supabase.from('task_completions').select('*'),
      supabase.from('day_notes').select('*'),
      supabase.from('mql_entries').select('*'),
      supabase.from('practice_tests').select('*'),
      supabase.from('student_payments').select('*'),
      supabase.from('team_payments').select('*'),
    ]);

    // Students = profiles with role='student'
    const loadedStudents = (profileRows || [])
      .filter((p) => p.role === 'student')
      .map(profileToStudent)
      .filter(Boolean);
    setStudents(loadedStudents);

    const validStudentIds = new Set(loadedStudents.map((s) => s.id));

    // Weekly plans → object keyed by plan id
    const loadedPlans = (planRows || []).reduce((col, row) => {
      const plan = dbPlanToFrontend(row);
      if (plan && validStudentIds.has(plan.studentId)) {
        col[plan.id] = plan;
      }
      return col;
    }, {});
    setWeeklyPlans(loadedPlans);
    setWeeklyPlanHistory(buildWeeklyPlanHistory(loadedPlans));

    // Task completions → { "studentId:taskId": boolean }
    const loadedCompletions = (completionRows || []).reduce((col, row) => {
      if (validStudentIds.has(row.student_id)) {
        col[`${row.student_id}:${row.task_id}`] = row.completed;
      }
      return col;
    }, {});
    setTaskCompletion(loadedCompletions);

    // Day notes → { "studentId:dayId": text }
    const loadedNotes = (noteRows || []).reduce((col, row) => {
      if (validStudentIds.has(row.student_id)) {
        col[`${row.student_id}:${row.day_id}`] = row.text;
      }
      return col;
    }, {});
    setNotes(loadedNotes);

    // MQL entries
    const loadedMql = (mqlRows || [])
      .map(dbMqlToFrontend)
      .filter((e) => e && validStudentIds.has(e.studentId));
    setMqlEntries(loadedMql);

    // Practice tests
    const loadedTests = (testRows || [])
      .map(dbTestToFrontend)
      .filter((t) => t && validStudentIds.has(t.studentId))
      .sort(comparePracticeTests);
    setPracticeTests(loadedTests);

    // Student payments
    const loadedStudentPayments = (studentPaymentRows || [])
      .map(dbStudentPaymentToFrontend)
      .filter((p) => p && validStudentIds.has(p.studentId))
      .sort((a, b) => compareByDateDesc(a.date, b.date));
    setStudentPayments(loadedStudentPayments);

    // Team payments
    const loadedTeamPayments = (teamPaymentRows || [])
      .map(dbTeamPaymentToFrontend)
      .sort((a, b) => compareByDateDesc(a.date, b.date));
    setTeamPayments(loadedTeamPayments);

    return { students: loadedStudents, profiles: profileRows || [] };
  }, []);

  /* ── Bootstrap on mount ── */
  useEffect(() => {
    (async () => {
      const storedSession = readLS(LS_SESSION);
      const { students: loadedStudents } = await loadAllData();

      if (storedSession?.role) {
        const restoredStudent = storedSession.studentId
          ? loadedStudents.find((s) => s.id === storedSession.studentId) || null
          : null;

        if (storedSession.role === 'student' && !restoredStudent) {
          window.localStorage.removeItem(LS_SESSION);
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
    })();
  }, [loadAllData]);

  useEffect(() => {
    if (session?.role === 'student' && session.studentId) {
      setCurrentStudent(students.find((s) => s.id === session.studentId) || null);
    }
  }, [session, students]);

  /* ── Auth ── */
  const loginWithCredentials = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check credentials against profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1);

    const credential = profiles?.[0];
    if (!credential || credential.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    const nextSession = {
      email: credential.email,
      profileId: credential.id,
      role: credential.role,
      name: credential.name,
      studentId: credential.student_id,
      homePath: credential.home_path,
    };

    writeLS(LS_SESSION, nextSession);
    setSession(nextSession);

    const profile = {
      id: credential.id,
      role: credential.role,
      name: credential.name,
      email: credential.email,
      studentId: credential.student_id,
      homePath: credential.home_path,
      label: credential.role === 'coach' ? 'Coach Workspace' : `${credential.name} Portal`,
    };
    setCurrentProfile(profile);

    const { students: loadedStudents } = await loadAllData();
    if (credential.student_id) {
      const foundStudent = loadedStudents.find((s) => s.id === credential.student_id) || null;
      if (!foundStudent) {
        window.localStorage.removeItem(LS_SESSION);
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
    window.localStorage.removeItem(LS_SESSION);
    setSession(null);
    setCurrentProfile(null);
    setCurrentStudent(null);
  }, []);

  /* ── Student management ── */
  const addStudent = useCallback(async (studentData) => {
    const email = (studentData.email || '').trim().toLowerCase();
    const password = studentData.password || '';

    if (!studentData.name?.trim()) {
      return { success: false, error: 'Name is required.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email is required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check for existing email
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing?.length > 0 || students.some((s) => s.email === email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const id = getNextStudentId(students);
    const profileId = `student-${id}`;

    const { error } = await supabase.from('profiles').insert([{
      id: profileId,
      role: 'student',
      name: studentData.name.trim(),
      email,
      password,
      student_id: id,
      home_path: '/student/dashboard',
      phone: studentData.phone || '',
      status: 'Active',
      program: studentData.program || 'DAT Coaching',
      phase: studentData.phase || 'Foundation',
      test_date: studentData.testDate || '',
      weekly_commitment_hours: studentData.weeklyCommitmentHours || 15,
      coach_note: '',
      color: '#C9A84C',
      amount_paid: 0,
      remaining_balance: 0,
      next_payment_date: '',
    }]);

    if (error) {
      return { success: false, error: error.message };
    }

    await loadAllData();
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
    });

    return { success: true, student, user: { email, profileId, role: 'student', name: student.name, studentId: id, homePath: '/student/dashboard' } };
  }, [students, loadAllData]);

  const updateStudent = useCallback(async (studentId, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.program !== undefined) dbUpdates.program = updates.program;
    if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
    if (updates.testDate !== undefined || updates.targetExamDate !== undefined) {
      dbUpdates.test_date = updates.testDate || updates.targetExamDate;
    }
    if (updates.weeklyCommitmentHours !== undefined) dbUpdates.weekly_commitment_hours = updates.weeklyCommitmentHours;
    if (updates.coachNote !== undefined) dbUpdates.coach_note = updates.coachNote;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.amountPaid !== undefined) dbUpdates.amount_paid = Number(updates.amountPaid) || 0;
    if (updates.remainingBalance !== undefined || updates.amountOwed !== undefined) {
      dbUpdates.remaining_balance = Number(updates.remainingBalance ?? updates.amountOwed) || 0;
    }
    if (updates.nextPaymentDate !== undefined || updates.nextPaymentDue !== undefined) {
      dbUpdates.next_payment_date = updates.nextPaymentDate || updates.nextPaymentDue || '';
    }

    await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('student_id', studentId);

    // Optimistic local update
    setStudents((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return normalizeStudent({
        ...s,
        ...updates,
        amountPaid: updates.amountPaid ?? s.amountPaid,
        remainingBalance: updates.remainingBalance ?? updates.amountOwed ?? s.remainingBalance,
        nextPaymentDate: updates.nextPaymentDate ?? updates.nextPaymentDue ?? s.nextPaymentDate,
      });
    }).filter(Boolean));
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

  /* ── Task completion ── */
  const toggleTask = useCallback(async (taskId) => {
    if (!currentStudent?.id) return;
    const key = `${currentStudent.id}:${taskId}`;
    const newValue = !taskCompletion[key];

    // Optimistic update
    setTaskCompletion((prev) => ({ ...prev, [key]: newValue }));

    // Upsert to Supabase
    await supabase
      .from('task_completions')
      .upsert({
        student_id: currentStudent.id,
        task_id: taskId,
        completed: newValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,task_id' });
  }, [currentStudent, taskCompletion]);

  /* ── Notes ── */
  const saveNote = useCallback(async (dayId, text) => {
    if (!currentStudent?.id) return;
    const key = `${currentStudent.id}:${dayId}`;

    // Optimistic update
    setNotes((prev) => ({ ...prev, [key]: text }));

    // Upsert to Supabase
    await supabase
      .from('day_notes')
      .upsert({
        student_id: currentStudent.id,
        day_id: dayId,
        text,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,day_id' });
  }, [currentStudent]);

  /* ── Weekly plans ── */
  const saveWeeklyPlan = useCallback(async (studentId, plan) => {
    const normalizedPlan = normalizeWeeklyPlan({ ...plan, studentId });
    const savedPlan = { ...normalizedPlan, savedAt: new Date().toISOString() };

    // Optimistic local update
    setWeeklyPlans((prev) => {
      const next = { ...prev, [savedPlan.id]: savedPlan };
      setWeeklyPlanHistory(buildWeeklyPlanHistory(next));
      return next;
    });

    // Upsert to Supabase
    await supabase
      .from('weekly_plans')
      .upsert({
        id: savedPlan.id,
        student_id: studentId,
        week_start: savedPlan.weekStart,
        week_label: savedPlan.weekLabel,
        status: savedPlan.status,
        days: savedPlan.days,
        published_at: savedPlan.publishedAt || null,
        saved_at: savedPlan.savedAt,
      }, { onConflict: 'id' });

    return savedPlan;
  }, []);

  const updateWeeklyPlan = useCallback(async (planId, updater) => {
    let savedPlan = null;

    setWeeklyPlans((prev) => {
      const currentPlan = prev[planId];
      if (!currentPlan) return prev;
      const nextPlan = normalizeWeeklyPlan({ ...updater(currentPlan), studentId: currentPlan.studentId });
      savedPlan = { ...nextPlan, savedAt: new Date().toISOString() };
      const next = { ...prev, [planId]: savedPlan };
      setWeeklyPlanHistory(buildWeeklyPlanHistory(next));
      return next;
    });

    if (savedPlan) {
      await supabase
        .from('weekly_plans')
        .upsert({
          id: savedPlan.id,
          student_id: savedPlan.studentId,
          week_start: savedPlan.weekStart,
          week_label: savedPlan.weekLabel,
          status: savedPlan.status,
          days: savedPlan.days,
          published_at: savedPlan.publishedAt || null,
          saved_at: savedPlan.savedAt,
        }, { onConflict: 'id' });
    }
  }, []);

  const publishWeeklyPlan = useCallback(async (studentId, planId) => {
    let publishedPlan = null;

    setWeeklyPlans((prev) => {
      const currentPlan = prev[planId]
        || getCurrentWeeklyPlanRecord(prev, studentId)
        || getLatestWeeklyPlanRecord(prev, studentId);
      if (!currentPlan) return prev;

      publishedPlan = {
        ...currentPlan,
        status: 'published',
        publishedAt: currentPlan.publishedAt || new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };

      const next = { ...prev, [publishedPlan.id]: publishedPlan };
      setWeeklyPlanHistory(buildWeeklyPlanHistory(next));
      return next;
    });

    if (publishedPlan) {
      await supabase
        .from('weekly_plans')
        .upsert({
          id: publishedPlan.id,
          student_id: publishedPlan.studentId,
          week_start: publishedPlan.weekStart,
          week_label: publishedPlan.weekLabel,
          status: 'published',
          days: publishedPlan.days,
          published_at: publishedPlan.publishedAt,
          saved_at: publishedPlan.savedAt,
        }, { onConflict: 'id' });
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

  /* ── MQL Entries ── */
  const addMqlError = useCallback(async (entry) => {
    const studentId = entry.studentId || currentStudent?.id;
    if (!studentId) return null;

    const normalizedEntry = normalizeMqlEntry({ ...entry, studentId });
    if (!normalizedEntry) return null;

    // Optimistic update
    setMqlEntries((prev) => [normalizedEntry, ...prev]);

    // Insert to Supabase
    await supabase.from('mql_entries').insert([{
      id: normalizedEntry.id,
      student_id: studentId,
      date: normalizedEntry.date,
      section: normalizedEntry.section,
      error_type: normalizedEntry.errorType,
      question_reference: normalizedEntry.questionReference,
      explanation: normalizedEntry.explanation,
      correct_reasoning: normalizedEntry.correctReasoning,
      action_item: normalizedEntry.actionItem,
      created_at: normalizedEntry.createdAt,
    }]);

    return normalizedEntry;
  }, [currentStudent]);

  const addMqlErrorForStudent = useCallback((studentId, entry) => {
    return addMqlError({ ...entry, studentId });
  }, [addMqlError]);

  const updateMqlError = useCallback(async (entryId, updates) => {
    const normalizedUpdates = {};
    if (updates.section !== undefined) normalizedUpdates.section = updates.section;
    if (updates.errorType !== undefined) normalizedUpdates.error_type = updates.errorType;
    if (updates.questionReference !== undefined) normalizedUpdates.question_reference = updates.questionReference;
    if (updates.explanation !== undefined) normalizedUpdates.explanation = updates.explanation;
    if (updates.description !== undefined) normalizedUpdates.explanation = updates.description;
    if (updates.correctReasoning !== undefined) normalizedUpdates.correct_reasoning = updates.correctReasoning;
    if (updates.correction !== undefined) normalizedUpdates.correct_reasoning = updates.correction;
    if (updates.actionItem !== undefined) normalizedUpdates.action_item = updates.actionItem;

    // Optimistic update
    setMqlEntries((prev) => prev.map((e) => (
      e.id === entryId ? normalizeMqlEntry({ ...e, ...updates }) : e
    )).filter(Boolean));

    await supabase
      .from('mql_entries')
      .update(normalizedUpdates)
      .eq('id', entryId);
  }, []);

  const deleteMqlError = useCallback(async (entryId) => {
    setMqlEntries((prev) => prev.filter((e) => e.id !== entryId));
    await supabase.from('mql_entries').delete().eq('id', entryId);
  }, []);

  const getStudentMqlEntries = useCallback((studentId) => (
    mqlEntries
      .filter((e) => e.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [mqlEntries]);

  /* ── Practice tests ── */
  const savePracticeTest = useCallback(async (studentId, record) => {
    const normalizedRecord = normalizePracticeTest({ ...record, studentId });
    if (!normalizedRecord) return null;

    // Optimistic update
    setPracticeTests((prev) => {
      return prev
        .filter((t) => !(t.studentId === studentId && (
          t.id === normalizedRecord.id || t.testId === normalizedRecord.testId || t.testNumber === normalizedRecord.testNumber
        )))
        .concat(normalizedRecord)
        .sort(comparePracticeTests);
    });

    // Upsert to Supabase
    await supabase
      .from('practice_tests')
      .upsert({
        id: normalizedRecord.id,
        student_id: studentId,
        test_number: normalizedRecord.testNumber,
        date: normalizedRecord.date,
        sections: normalizedRecord.sections,
        section_scores: normalizedRecord.sectionScores,
        notes: normalizedRecord.notes,
        created_at: normalizedRecord.createdAt,
      }, { onConflict: 'id' });

    return normalizedRecord;
  }, []);

  const updatePracticeTest = useCallback((studentId, record) => {
    return savePracticeTest(studentId, record);
  }, [savePracticeTest]);

  const deletePracticeTest = useCallback(async (recordId) => {
    setPracticeTests((prev) => prev.filter((t) => t.id !== recordId));
    await supabase.from('practice_tests').delete().eq('id', recordId);
  }, []);

  const getStudentPracticeTests = useCallback((studentId) => (
    practiceTests
      .filter((t) => t.studentId === studentId)
      .sort(comparePracticeTests)
  ), [practiceTests]);

  /* ── Student payments ── */
  const saveStudentPayment = useCallback(async (studentId, payment) => {
    const normalizedPayment = normalizeStudentPayment({ ...payment, studentId });
    if (!normalizedPayment) return null;

    // Optimistic update
    setStudentPayments((prev) => prev
      .filter((p) => p.id !== normalizedPayment.id)
      .concat(normalizedPayment)
      .sort((a, b) => compareByDateDesc(a.date, b.date)));

    await supabase
      .from('student_payments')
      .upsert({
        id: normalizedPayment.id,
        student_id: studentId,
        date: normalizedPayment.date,
        amount: normalizedPayment.amount,
        method: normalizedPayment.method,
        note: normalizedPayment.note,
        kind: normalizedPayment.kind,
      }, { onConflict: 'id' });

    return normalizedPayment;
  }, []);

  const deleteStudentPayment = useCallback(async (paymentId) => {
    setStudentPayments((prev) => prev.filter((p) => p.id !== paymentId));
    await supabase.from('student_payments').delete().eq('id', paymentId);
  }, []);

  /* ── Team payments ── */
  const saveTeamPayment = useCallback(async (payment) => {
    const normalizedPayment = normalizeTeamPayment(payment);

    setTeamPayments((prev) => prev
      .filter((p) => p.id !== normalizedPayment.id)
      .concat(normalizedPayment)
      .sort((a, b) => compareByDateDesc(a.date, b.date)));

    await supabase
      .from('team_payments')
      .upsert({
        id: normalizedPayment.id,
        payee: normalizedPayment.payee,
        date: normalizedPayment.date,
        amount: normalizedPayment.amount,
        note: normalizedPayment.note,
      }, { onConflict: 'id' });

    return normalizedPayment;
  }, []);

  const deleteTeamPayment = useCallback(async (paymentId) => {
    setTeamPayments((prev) => prev.filter((p) => p.id !== paymentId));
    await supabase.from('team_payments').delete().eq('id', paymentId);
  }, []);

  const getStudentPayments = useCallback((studentId) => (
    studentPayments
      .filter((p) => p.studentId === studentId)
      .sort((a, b) => compareByDateDesc(a.date, b.date))
  ), [studentPayments]);

  /* ── Derived state ── */
  const weeklyPlan = useMemo(() => {
    if (!currentStudent?.id) return null;
    const plan = getPreferredStudentPlan(weeklyPlans, currentStudent.id);
    return normalizeWeeklyPlan(plan);
  }, [currentStudent, weeklyPlans]);

  const paymentSummaries = useMemo(() => (
    students.reduce((col, student) => {
      col[student.id] = {
        studentId: student.id,
        amountPaid: student.amountPaid || 0,
        amountDue: student.amountDue ?? student.remainingBalance ?? 0,
        remainingBalance: student.remainingBalance ?? student.amountDue ?? 0,
        nextPaymentDate: student.nextPaymentDate || '',
      };
      return col;
    }, {})
  ), [students]);

  /* ── Context value ── */
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
