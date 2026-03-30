import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { usePortal } from '../../app/providers/PortalProvider';
import { PracticeTestTrendChart } from '../../components/charts/PracticeTestTrendChart';
import { DAT_SECTIONS, createEmptySectionScores } from '../../data/manualWorkflow';

export function StudentSections() {
  const {
    currentStudent,
    getStudentPracticeTests,
    savePracticeTest,
    deletePracticeTest,
  } = usePortal();

  const [form, setForm] = useState({
    testNumber: 1,
    takenOn: new Date().toISOString().slice(0, 10),
    sections: createEmptySectionScores(),
    notes: '',
  });

  const tests = useMemo(
    () => (currentStudent ? getStudentPracticeTests(currentStudent.id) : []),
    [currentStudent, getStudentPracticeTests],
  );

  if (!currentStudent) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>Loading your practice tests...</div>;
  }

  function updateSection(section, value) {
    setForm((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: value,
      },
    }));
  }

  function handleSubmit() {
    const hasAnyScore = DAT_SECTIONS.some((section) => form.sections[section] !== '');
    if (!hasAnyScore) return;

    savePracticeTest(currentStudent.id, {
      ...form,
      testNumber: Number(form.testNumber) || 1,
      sections: DAT_SECTIONS.reduce((collection, section) => {
        const rawValue = form.sections[section];
        collection[section] = rawValue === '' ? null : Number(rawValue);
        return collection;
      }, {}),
    });

    setForm({
      testNumber: Math.min(15, Number(form.testNumber) + 1),
      takenOn: new Date().toISOString().slice(0, 10),
      sections: createEmptySectionScores(),
      notes: '',
    });
  }

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">Practice Tests</div>
          <div className="section-header-sub">
            Log each practice test manually. Scores are stored over time and shown as a line trend.
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Add Practice Test</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 200px', gap: 12 }}>
            <div>
              <label className="form-label">Practice Test #</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="15"
                value={form.testNumber}
                onChange={(event) => setForm((current) => ({ ...current, testNumber: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                value={form.takenOn}
                onChange={(event) => setForm((current) => ({ ...current, takenOn: event.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {DAT_SECTIONS.map((section) => (
              <div key={section}>
                <label className="form-label">{section}</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="30"
                  value={form.sections[section]}
                  onChange={(event) => updateSection(section, event.target.value)}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional notes about how this test felt."
            />
          </div>

          <button className="btn btn-gold" onClick={handleSubmit}>
            Save Practice Test
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Trend</span>
        </div>
        <PracticeTestTrendChart tests={tests} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Saved Practice Tests</span>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>PT</th>
                <th>Date</th>
                {DAT_SECTIONS.map((section) => <th key={section}>{section}</th>)}
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td>{test.testNumber}</td>
                  <td>{test.takenOn}</td>
                  {DAT_SECTIONS.map((section) => <td key={section}>{test.sections[section] ?? '-'}</td>)}
                  <td>{test.notes || '-'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => deletePracticeTest(test.id)}
                      style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={DAT_SECTIONS.length + 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No practice tests logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
