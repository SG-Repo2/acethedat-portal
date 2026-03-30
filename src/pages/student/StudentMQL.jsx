import { useMemo, useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { DAT_SECTIONS, MQL_ERROR_TYPES } from '../../data/manualWorkflow';

function buildSectionPatterns(entries) {
  return DAT_SECTIONS.map((section) => {
    const sectionEntries = entries.filter((entry) => entry.section === section);
    if (!sectionEntries.length) return null;
    return {
      section,
      total: sectionEntries.length,
      errorCounts: MQL_ERROR_TYPES.reduce((collection, errorType) => {
        collection[errorType] = sectionEntries.filter((entry) => entry.errorType === errorType).length;
        return collection;
      }, {}),
    };
  }).filter(Boolean);
}

export function StudentMQL() {
  const { currentStudent, getStudentMqlEntries, addMqlError, deleteMqlError } = usePortal();
  const [form, setForm] = useState({
    section: 'Bio',
    errorType: MQL_ERROR_TYPES[0],
    questionReference: '',
    explanation: '',
    correctReasoning: '',
    actionItem: '',
  });

  const entries = useMemo(
    () => (currentStudent ? getStudentMqlEntries(currentStudent.id) : []),
    [currentStudent, getStudentMqlEntries],
  );

  const patterns = useMemo(() => buildSectionPatterns(entries), [entries]);

  if (!currentStudent) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>Loading your MQL...</div>;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    if (!form.questionReference.trim() || !form.explanation.trim()) return;

    addMqlError({
      ...form,
      studentId: currentStudent.id,
    });
    setForm({
      section: 'Bio',
      errorType: MQL_ERROR_TYPES[0],
      questionReference: '',
      explanation: '',
      correctReasoning: '',
      actionItem: '',
    });
  }

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">MQL</div>
          <div className="section-header-sub">
            Log missed questions manually using the exact MQL format your coach sees.
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Add MQL Entry</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Section</label>
              <select className="form-select" value={form.section} onChange={(event) => update('section', event.target.value)}>
                {DAT_SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Error Type</label>
              <select className="form-select" value={form.errorType} onChange={(event) => update('errorType', event.target.value)}>
                {MQL_ERROR_TYPES.map((errorType) => <option key={errorType} value={errorType}>{errorType}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Subsection</label>
            <input
              className="form-input"
              value={form.questionReference}
              onChange={(event) => update('questionReference', event.target.value)}
              placeholder="Example: PT 4 Q23"
            />
          </div>

          <div>
            <label className="form-label">Explanation</label>
            <textarea
              className="form-textarea"
              value={form.explanation}
              onChange={(event) => update('explanation', event.target.value)}
              placeholder="What went wrong?"
            />
          </div>

          <div>
            <label className="form-label">Correct Reasoning</label>
            <textarea
              className="form-textarea"
              value={form.correctReasoning}
              onChange={(event) => update('correctReasoning', event.target.value)}
              placeholder="What should your reasoning have been?"
            />
          </div>

          <div>
            <label className="form-label">Action Item</label>
            <textarea
              className="form-textarea"
              value={form.actionItem}
              onChange={(event) => update('actionItem', event.target.value)}
              placeholder="What will you do next time?"
            />
          </div>

          <button className="btn btn-gold" onClick={handleSubmit}>
            Save MQL Entry
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Patterns By Section</span>
        </div>
        {patterns.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {patterns.map((pattern) => (
              <div
                key={pattern.section}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel-hover)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 10 }}>
                  {pattern.section} ({pattern.total})
                </div>
                <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-lo)' }}>
                  {MQL_ERROR_TYPES.map((errorType) => (
                    <div key={errorType} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>{errorType}</span>
                      <strong style={{ color: 'var(--text-hi)' }}>{pattern.errorCounts[errorType]}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No MQL patterns yet.
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Saved Entries</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {entries.length > 0 ? entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--bg-panel-hover)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="tag tag-muted">{entry.section}</span>
                  <span className="tag tag-gold">{entry.errorType}</span>
                </div>
                <button className="btn btn-subtle" onClick={() => deleteMqlError(entry.id)} style={{ padding: '4px 10px', fontSize: 11 }}>
                  Delete
                </button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-hi)', marginBottom: 6 }}>
                {entry.questionReference || 'Question reference not set'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-hi)' }}>Explanation:</strong> {entry.explanation || '-'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-hi)' }}>Correct reasoning:</strong> {entry.correctReasoning || '-'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-hi)' }}>Action item:</strong> {entry.actionItem || '-'}
              </div>
            </div>
          )) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No MQL entries yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
