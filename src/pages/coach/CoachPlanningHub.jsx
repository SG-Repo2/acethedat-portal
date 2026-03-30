import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { usePortal } from '../../app/providers/PortalProvider';
import { DAT_SECTIONS, WEEKDAY_META } from '../../data/manualWorkflow';
import { calculateStudyAllocation } from '../../features/schedules/utils';
import { getStartOfWeek, toISODate } from '../../utils/date';

function createTask(dayKey, index) {
  return {
    id: `${dayKey.toLowerCase()}-${Date.now()}-${index}`,
    section: 'Bio',
    text: '',
    minutes: 45,
    mins: 45,
    note: '',
  };
}

export function CoachPlanningHub() {
  const {
    students,
    weeklyPlanHistory,
    getWeeklyPlan,
    createWeeklyPlanDraft,
    saveWeeklyPlan,
    practiceTests,
    mqlEntries,
  } = usePortal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('student') || '');
  const [weekStart, setWeekStart] = useState(searchParams.get('week') || toISODate(getStartOfWeek()));
  const [plan, setPlan] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId],
  );

  const history = selectedStudentId ? (weeklyPlanHistory[selectedStudentId] || []) : [];
  const studentTestCount = practiceTests.filter((test) => test.studentId === selectedStudentId).length;
  const studentMqlCount = mqlEntries.filter((entry) => entry.studentId === selectedStudentId).length;
  const studentPracticeTests = practiceTests.filter((test) => test.studentId === selectedStudentId);
  const studentMqlEntries = mqlEntries.filter((entry) => entry.studentId === selectedStudentId);
  const suggestedHours = selectedStudent
    ? calculateStudyAllocation({
      ...selectedStudent,
      practiceTests: studentPracticeTests,
      mqlEntries: studentMqlEntries,
    })
    : {};

  useEffect(() => {
    const nextParams = {};
    if (selectedStudentId) nextParams.student = selectedStudentId;
    if (weekStart) nextParams.week = weekStart;
    setSearchParams(nextParams, { replace: true });
  }, [selectedStudentId, setSearchParams, weekStart]);

  useEffect(() => {
    if (!selectedStudentId) {
      setPlan(null);
      return;
    }

    const existingPlan = getWeeklyPlan(selectedStudentId, weekStart);
    setPlan(existingPlan || createWeeklyPlanDraft(selectedStudentId, weekStart));
  }, [createWeeklyPlanDraft, getWeeklyPlan, selectedStudentId, weekStart]);

  function updatePlanDay(dayId, updater) {
    setPlan((currentPlan) => {
      if (!currentPlan) return currentPlan;
      return {
        ...currentPlan,
        days: currentPlan.days.map((day) => (
          day.id === dayId ? updater(day) : day
        )),
      };
    });
  }

  function addTask(dayId) {
    updatePlanDay(dayId, (day) => ({
      ...day,
      tasks: [...day.tasks, createTask(dayId, day.tasks.length)],
    }));
  }

  function updateTask(dayId, taskId, field, value) {
    updatePlanDay(dayId, (day) => ({
      ...day,
      tasks: day.tasks.map((task) => (
        task.id === taskId
          ? {
            ...task,
            [field]: field === 'minutes' ? Number(value) || 0 : value,
            mins: field === 'minutes' ? Number(value) || 0 : task.mins,
          }
          : task
      )),
    }));
  }

  function removeTask(dayId, taskId) {
    updatePlanDay(dayId, (day) => ({
      ...day,
      tasks: day.tasks.filter((task) => task.id !== taskId),
    }));
  }

  function handleSave(nextStatus) {
    if (!selectedStudent || !plan) return;

    const savedPlan = saveWeeklyPlan(selectedStudent.id, {
      ...plan,
      status: nextStatus,
      publishedAt: nextStatus === 'published' ? (plan.publishedAt || new Date().toISOString()) : plan.publishedAt,
    });

    setPlan(savedPlan);
    setStatusMessage(nextStatus === 'published' ? 'Plan published to student.' : 'Plan saved as draft.');
    window.setTimeout(() => setStatusMessage(''), 2500);
  }

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">Planning Hub</div>
          <div className="section-header-sub">
            Build each student plan manually by day. No automated generation, no hourly scheduler, just editable weekly tasks.
          </div>
        </div>
        {statusMessage && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 999,
            background: 'var(--gold-bg)',
            border: '1px solid var(--gold-border)',
            color: 'var(--gold)',
            fontSize: 12,
            fontWeight: 700,
          }}
          >
            {statusMessage}
          </div>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="form-label">Student</label>
            <select className="form-select" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Week Of</label>
            <input className="form-input" type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-subtle" onClick={() => handleSave('draft')} disabled={!plan}>
              Save Draft
            </button>
            <button className="btn btn-gold" onClick={() => handleSave('published')} disabled={!plan}>
              Publish
            </button>
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.3px' }}>Student</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginTop: 6 }}>{selectedStudent.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.3px' }}>Program</div>
              <div style={{ fontSize: 14, color: 'var(--text-hi)', marginTop: 6 }}>{selectedStudent.program || 'DAT Coaching'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.3px' }}>Practice Tests</div>
              <div style={{ fontSize: 14, color: 'var(--text-hi)', marginTop: 6 }}>{studentTestCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.3px' }}>MQL Entries</div>
              <div style={{ fontSize: 14, color: 'var(--text-hi)', marginTop: 6 }}>{studentMqlCount}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {Object.entries(suggestedHours).map(([sectionCode, hours]) => (
              <div key={sectionCode} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-panel-hover)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-lo)' }}>{sectionCode}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginTop: 4 }}>{hours}h</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedStudent && (
        <div style={{
          padding: '30px 20px',
          borderRadius: 16,
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
        >
          Select a student to build or edit a weekly plan.
        </div>
      )}

      {plan && (
        <div style={{ display: 'grid', gap: 16 }}>
          {WEEKDAY_META.map((dayMeta) => {
            const day = plan.days.find((entry) => entry.id === dayMeta.key) || dayMeta;
            return (
              <div key={dayMeta.key} className="panel" style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '18px 20px',
                  background: dayMeta.bg,
                  borderBottom: '1px solid var(--border)',
                }}
                >
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: dayMeta.color }}>{dayMeta.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>
                      {day.tasks.length} manual task{day.tasks.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <button className="btn btn-subtle" onClick={() => addTask(dayMeta.key)}>
                    <Plus size={14} /> Add Task
                  </button>
                </div>

                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  {day.tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-panel-hover)',
                        display: 'grid',
                        gridTemplateColumns: '140px minmax(0, 1fr) 110px auto',
                        gap: 12,
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <label className="form-label">Section</label>
                        <select
                          className="form-select"
                          value={task.section || 'Bio'}
                          onChange={(event) => updateTask(dayMeta.key, task.id, 'section', event.target.value)}
                        >
                          {DAT_SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={task.text}
                          onChange={(event) => updateTask(dayMeta.key, task.id, 'text', event.target.value)}
                          placeholder="Enter the work for this day..."
                        />
                      </div>
                      <div>
                        <label className="form-label">Minutes</label>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          step="5"
                          value={task.minutes ?? task.mins ?? 0}
                          onChange={(event) => updateTask(dayMeta.key, task.id, 'minutes', event.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTask(dayMeta.key, task.id)}
                        style={{
                          marginTop: 25,
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          border: '1px solid rgba(239,68,68,0.25)',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  {day.tasks.length === 0 && (
                    <div style={{
                      padding: '16px 14px',
                      borderRadius: 12,
                      border: '1px dashed var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                    >
                      No tasks added for {dayMeta.label} yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Plan History</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {history.length > 0 ? history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setWeekStart(entry.weekStart)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-panel-hover)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>{entry.weekLabel}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>
                      {entry.days.reduce((sum, day) => sum + day.tasks.length, 0)} tasks
                    </div>
                  </div>
                  <span className={`tag ${entry.status === 'published' ? 'tag-success' : 'tag-gold'}`}>
                    {entry.status}
                  </span>
                </button>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No plan history yet for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachPlanningHub;
