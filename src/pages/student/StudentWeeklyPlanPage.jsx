import { useMemo, useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { DAT_SECTIONS, MQL_ERROR_TYPES, WEEKDAY_META, createEmptySectionScores } from '../../data/manualWorkflow';
import { calculateStudyAllocation } from '../../features/schedules/utils';

export function StudentWeeklyPlanPage() {
  const {
    currentStudent,
    weeklyPlan,
    taskCompletion,
    toggleTask,
    notes,
    saveNote,
    practiceTests,
    mqlEntries,
    savePracticeTest,
    addMqlError,
  } = usePortal();

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [practiceForm, setPracticeForm] = useState({
    testNumber: 1,
    date: new Date().toISOString().slice(0, 10),
    sectionScores: createEmptySectionScores(),
    notes: '',
  });
  const [mqlForm, setMqlForm] = useState({
    section: 'Bio',
    errorType: MQL_ERROR_TYPES[0],
    questionReference: '',
    description: '',
    correction: '',
  });

  const studentPracticeTests = currentStudent
    ? practiceTests.filter((test) => test.studentId === currentStudent.id)
    : [];
  const studentMqlEntries = currentStudent
    ? mqlEntries.filter((entry) => entry.studentId === currentStudent.id)
    : [];
  const suggestedHours = useMemo(() => (
    currentStudent
      ? calculateStudyAllocation({
        ...currentStudent,
        practiceTests: studentPracticeTests,
        mqlEntries: studentMqlEntries,
      })
      : {}
  ), [currentStudent, studentMqlEntries, studentPracticeTests]);

  if (!currentStudent || !weeklyPlan) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>No weekly plan assigned yet.</div>;
  }

  const activeDay = weeklyPlan.days[activeDayIndex] || weeklyPlan.days[0];

  function updatePracticeScore(section, value) {
    setPracticeForm((current) => ({
      ...current,
      sectionScores: {
        ...current.sectionScores,
        [section]: value,
      },
    }));
  }

  function handlePracticeSubmit() {
    const hasAnyScore = DAT_SECTIONS.some((section) => practiceForm.sectionScores[section] !== '');
    if (!hasAnyScore) return;

    savePracticeTest(currentStudent.id, {
      testNumber: Number(practiceForm.testNumber) || 1,
      date: practiceForm.date,
      sectionScores: {
        BIO: practiceForm.sectionScores.Bio === '' ? null : Number(practiceForm.sectionScores.Bio),
        GCH: practiceForm.sectionScores.GChem === '' ? null : Number(practiceForm.sectionScores.GChem),
        OCH: practiceForm.sectionScores.OChem === '' ? null : Number(practiceForm.sectionScores.OChem),
        PAT: practiceForm.sectionScores.PAT === '' ? null : Number(practiceForm.sectionScores.PAT),
        RCT: practiceForm.sectionScores.RC === '' ? null : Number(practiceForm.sectionScores.RC),
        QRT: practiceForm.sectionScores.QR === '' ? null : Number(practiceForm.sectionScores.QR),
      },
      notes: practiceForm.notes,
    });

    setPracticeForm({
      testNumber: Math.min(15, Number(practiceForm.testNumber) + 1),
      date: new Date().toISOString().slice(0, 10),
      sectionScores: createEmptySectionScores(),
      notes: '',
    });
  }

  function handleMqlSubmit() {
    if (!mqlForm.questionReference.trim() || !mqlForm.description.trim()) return;

    addMqlError({
      section: mqlForm.section,
      errorType: mqlForm.errorType,
      questionReference: mqlForm.questionReference,
      description: mqlForm.description,
      correction: mqlForm.correction,
      actionItem: mqlForm.correction,
    });

    setMqlForm({
      section: 'Bio',
      errorType: MQL_ERROR_TYPES[0],
      questionReference: '',
      description: '',
      correction: '',
    });
  }

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">Weekly Plan</div>
          <div className="section-header-sub">{weeklyPlan.weekLabel}</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Suggested Study Hours This Week</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {Object.entries(suggestedHours).map(([sectionCode, hours]) => (
            <div key={sectionCode} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-panel-hover)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{sectionCode}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-hi)', marginTop: 4 }}>{hours}h</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginBottom: 18 }}>
        {weeklyPlan.days.map((day, index) => (
          <button
            key={day.id}
            type="button"
            onClick={() => setActiveDayIndex(index)}
            style={{
              padding: '12px 10px',
              borderRadius: 14,
              border: `1px solid ${index === activeDayIndex ? day.color : 'var(--border)'}`,
              background: index === activeDayIndex ? day.bg : 'var(--bg-panel)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: index === activeDayIndex ? day.color : 'var(--text-hi)' }}>
              {day.short}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {day.tasks.length} tasks
            </div>
          </button>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', background: activeDay.bg }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: activeDay.color }}>{activeDay.label}</div>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          {activeDay.tasks.length > 0 ? activeDay.tasks.map((task) => {
            const done = !!taskCompletion[`${currentStudent.id}:${task.id}`];
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel-hover)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: done ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    {task.section && <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 4 }}>{task.section}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text-hi)', textDecoration: done ? 'line-through' : 'none' }}>
                      {task.text}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.minutes ?? task.mins ?? 0} min</span>
                </div>
              </button>
            );
          }) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No tasks assigned for this day.</div>
          )}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <label className="form-label">Your notes for {activeDay.label}</label>
          <textarea
            className="form-textarea"
            value={notes[`${currentStudent.id}:${activeDay.id}`] || ''}
            onChange={(event) => saveNote(activeDay.id, event.target.value)}
            placeholder="Add notes for your coach."
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Log Practice Test</span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Practice Test #</label>
                <input className="form-input" type="number" min="1" max="15" value={practiceForm.testNumber} onChange={(event) => setPracticeForm((current) => ({ ...current, testNumber: event.target.value }))} />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={practiceForm.date} onChange={(event) => setPracticeForm((current) => ({ ...current, date: event.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {DAT_SECTIONS.map((section) => (
                <div key={section}>
                  <label className="form-label">{section}</label>
                  <input className="form-input" type="number" min="0" max="30" value={practiceForm.sectionScores[section]} onChange={(event) => updatePracticeScore(section, event.target.value)} />
                </div>
              ))}
            </div>
            <textarea className="form-textarea" value={practiceForm.notes} onChange={(event) => setPracticeForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional notes" />
            <button className="btn btn-gold" onClick={handlePracticeSubmit}>Save Practice Test</button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Log MQL Entry</span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <select className="form-select" value={mqlForm.section} onChange={(event) => setMqlForm((current) => ({ ...current, section: event.target.value }))}>
                {['Bio', 'GChem', 'OChem', 'PAT', 'RC', 'QR'].map((section) => <option key={section} value={section}>{section}</option>)}
              </select>
              <select className="form-select" value={mqlForm.errorType} onChange={(event) => setMqlForm((current) => ({ ...current, errorType: event.target.value }))}>
                {MQL_ERROR_TYPES.map((errorType) => <option key={errorType} value={errorType}>{errorType}</option>)}
              </select>
            </div>
            <input className="form-input" value={mqlForm.questionReference} onChange={(event) => setMqlForm((current) => ({ ...current, questionReference: event.target.value }))} placeholder="Question reference" />
            <textarea className="form-textarea" value={mqlForm.description} onChange={(event) => setMqlForm((current) => ({ ...current, description: event.target.value }))} placeholder="What went wrong?" />
            <textarea className="form-textarea" value={mqlForm.correction} onChange={(event) => setMqlForm((current) => ({ ...current, correction: event.target.value }))} placeholder="Corrective action" />
            <button className="btn btn-subtle" onClick={handleMqlSubmit}>Save MQL Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
}
