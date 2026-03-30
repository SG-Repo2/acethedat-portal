import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Plus, UserPlus } from 'lucide-react';
import { usePortal } from '../../app/providers/PortalProvider';

const PROGRAMS = ['DAT Coaching', 'DAT Biology', 'DAT Chemistry', 'DAT Reading', 'DAT QR', 'Application Support'];
const PHASES = ['Foundation', 'Practice', 'Peak', 'Test Week', 'Review'];

function AddStudentModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    testDate: '',
    program: 'DAT Coaching',
    phase: 'Foundation',
    weeklyCommitmentHours: 15,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    const result = await onSubmit(form);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Unable to create student.');
      return;
    }
    onClose();
  }

  return createPortal(
    <div
      onClick={(event) => event.target === event.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 18,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: 28,
      }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 6 }}>
          Create Student
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 20 }}>
          This creates the student record and login. Everything else can be added manually afterward.
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(event) => update('name', event.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Test Date</label>
              <input className="form-input" type="date" value={form.testDate} onChange={(event) => update('testDate', event.target.value)} />
            </div>
            <div>
              <label className="form-label">Program</label>
              <select className="form-select" value={form.program} onChange={(event) => update('program', event.target.value)}>
                {PROGRAMS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Phase</label>
              <select className="form-select" value={form.phase} onChange={(event) => update('phase', event.target.value)}>
                {PHASES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Weekly Commitment Hours</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="60"
              value={form.weeklyCommitmentHours}
              onChange={(event) => update('weeklyCommitmentHours', Number(event.target.value) || 15)}
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
            fontSize: 12,
          }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-subtle" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={handleSubmit} style={{ flex: 1 }} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CoachStudents() {
  const { students, addStudent, weeklyPlans, practiceTests, mqlEntries } = usePortal();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const roster = useMemo(() => (
    [...students].sort((left, right) => left.name.localeCompare(right.name))
  ), [students]);

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">Students</div>
          <div className="section-header-sub">
            Create student records, then click into a student to manage plans, tests, MQL, and payments.
          </div>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {roster.map((student) => {
          const studentPlans = Object.values(weeklyPlans || {}).filter((plan) => plan.studentId === student.id);
          const studentTests = practiceTests.filter((test) => test.studentId === student.id);
          const studentMql = mqlEntries.filter((entry) => entry.studentId === student.id);

          return (
            <button
              key={student.id}
              type="button"
              onClick={() => navigate(`/coach/students/${student.id}`)}
              style={{
                width: '100%',
                padding: '18px 20px',
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--bg-panel)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: `${student.color}20`,
                  border: `1px solid ${student.color}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: student.color,
                  fontWeight: 700,
                }}
                >
                  {student.initials}
                </div>

                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 4 }}>
                    {student.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="tag tag-muted">{student.id}</span>
                    <span className="tag tag-gold">{student.program || 'DAT Coaching'}</span>
                    <span className={`tag ${student.status === 'Active' ? 'tag-success' : 'tag-muted'}`}>{student.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-lo)' }}>
                    <span>{studentPlans.length} plans</span>
                    <span>{studentTests.length} practice tests</span>
                    <span>{studentMql.length} MQL entries</span>
                    <span>Balance: ${Number(student.remainingBalance || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)' }}>
                  <Plus size={16} style={{ opacity: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Open</span>
                </div>
              </div>
            </button>
          );
        })}

        {roster.length === 0 && (
          <div style={{
            padding: '28px 20px',
            borderRadius: 16,
            border: '1px dashed var(--border)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
          >
            No students yet. Create a student to begin the manual workflow.
          </div>
        )}
      </div>

      {showModal && (
        <AddStudentModal
          onClose={() => setShowModal(false)}
          onSubmit={addStudent}
        />
      )}
    </div>
  );
}
