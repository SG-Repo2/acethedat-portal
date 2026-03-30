import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';

export function CoachScheduleBuilder() {
  const { students } = usePortal() || {};
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const selectedStudentRecord = students?.find((student) => student.id === selectedStudent) || null;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary, #f1f5f9)' }}>
        Schedule Builder
      </h1>
      <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '2rem' }}>
        Schedule Builder is now a legacy entry point. Manual day-by-day planning now happens in Planning Hub.
      </p>
      {students && students.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: 520 }}>
          <select
            value={selectedStudent || ''}
            onChange={e => setSelectedStudent(e.target.value || null)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--surface-2, #1e293b)', color: 'var(--text-primary, #f1f5f9)', border: '1px solid var(--border, #334155)' }}
          >
            <option value="">Select a student...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border, #334155)', background: 'var(--surface-1, #111827)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary, #f8fafc)', marginBottom: '0.35rem' }}>
              {selectedStudentRecord ? `${selectedStudentRecord.name}'s plan workflow moved` : 'Use Planning Hub for plan management'}
            </div>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.6 }}>
              {selectedStudentRecord
                ? 'Open Planning Hub to assign daily tasks and publish the weekly plan for this student.'
                : 'Select a student, then jump into Planning Hub to manage the plan.'}
            </p>
            <button
              type="button"
              onClick={() => navigate(selectedStudentRecord ? `/coach/planning-hub?student=${selectedStudentRecord.id}` : '/coach/planning-hub')}
              style={{ marginTop: '1rem', padding: '0.65rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--gold, #C9A84C)', color: '#101828', fontWeight: '700', cursor: 'pointer' }}
            >
              {selectedStudentRecord ? `Open Planning Hub for ${selectedStudentRecord.name}` : 'Open Planning Hub'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachScheduleBuilder;
