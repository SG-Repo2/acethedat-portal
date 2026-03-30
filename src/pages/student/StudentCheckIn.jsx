import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { normalizeScore, roundToTen } from '../../lib/scoreConversion';

const SECTIONS = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC'];

const CONFIDENCE_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
};

const MOOD_OPTIONS = [
  { value: 'great', label: 'ð Great', color: 'var(--accent-green)' },
  { value: 'good', label: 'ð Good', color: 'var(--accent-blue)' },
  { value: 'okay', label: 'ð Okay', color: 'var(--accent-yellow)' },
  { value: 'tired', label: 'ð´ Tired', color: 'var(--text-muted)' },
  { value: 'stressed', label: 'ð° Stressed', color: 'var(--accent-orange)' },
  { value: 'struggling', label: 'ð£ Struggling', color: 'var(--accent-red)' },
];

export default function StudentCheckIn({ studentId }) {
  const { students, addCheckIn, currentStudent } = usePortal();
  const student = studentId ? students.find((s) => s.id === studentId) : currentStudent;

  const [step, setStep] = useState(0); // 0=mood, 1=scores, 2=confidence, 3=notes, 4=done
  const [mood, setMood] = useState('');
  const [scores, setScores] = useState(
    Object.fromEntries(SECTIONS.map(s => [s, '']))
  );
  const [confidence, setConfidence] = useState(
    Object.fromEntries(SECTIONS.map(s => [s, 3]))
  );
  const [sessionNotes, setSessionNotes] = useState('');
  const [hoursStudied, setHoursStudied] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!student) {
    return (
      <div className="check-in-page">
        <p className="text-muted">Student not found.</p>
      </div>
    );
  }

  function handleScoreChange(section, raw) {
    setScores(prev => ({ ...prev, [section]: raw }));
  }

  function validateScores() {
    for (const section of SECTIONS) {
      const val = scores[section];
      if (val === '' || val === undefined) continue; // optional
      const num = Number(val);
      if (isNaN(num)) return `${section}: not a number`;
      // Accept old scale 1â30 or new scale 200â600
      if (num < 1 || num > 600) return `${section}: score out of range`;
    }
    return null;
  }

  function handleNext() {
    if (step === 1) {
      const err = validateScores();
      if (err) { setError(err); return; }
      setError('');
    }
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      // Normalize all entered scores to 200â600 scale
      const normalizedScores = {};
      for (const section of SECTIONS) {
        const raw = scores[section];
        if (raw === '' || raw === undefined) continue;
        const num = Number(raw);
        normalizedScores[section] = normalizeScore(num, section);
      }

      const checkIn = {
        id: `ci-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        mood,
        hoursStudied: hoursStudied ? Number(hoursStudied) : null,
        scores: normalizedScores,
        confidence: { ...confidence },
        notes: sessionNotes.trim(),
        studentId: student.id,
      };

      await addCheckIn(student.id, checkIn);
      setStep(4);
    } catch (e) {
      setError(e.message || 'Failed to save check-in');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStep(0);
    setMood('');
    setScores(Object.fromEntries(SECTIONS.map(s => [s, ''])));
    setConfidence(Object.fromEntries(SECTIONS.map(s => [s, 3])));
    setSessionNotes('');
    setHoursStudied('');
    setError('');
  }

  return (
    <div className="check-in-page">
      <div className="check-in-header">
        <h2>Session Check-In</h2>
        <p className="text-muted">
          {student.name} â {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="check-in-progress">
          {['Mood', 'Scores', 'Confidence', 'Notes'].map((label, i) => (
            <div
              key={label}
              className={`progress-step ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}
              onClick={() => step > i && setStep(i)}
            >
              <span className="step-dot">{step > i ? 'â' : i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="check-in-body">
        {/* Step 0: Mood */}
        {step === 0 && (
          <div className="check-in-step">
            <h3>How are you feeling today?</h3>
            <div className="mood-grid">
              {MOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`mood-btn ${mood === opt.value ? 'selected' : ''}`}
                  style={mood === opt.value ? { borderColor: opt.color, background: opt.color + '22' } : {}}
                  onClick={() => setMood(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="hours-row">
              <label>Hours studied since last check-in</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursStudied}
                onChange={e => setHoursStudied(e.target.value)}
                placeholder="e.g. 2.5"
                className="hours-input"
              />
            </div>
            <button
              className="btn-primary step-btn"
              disabled={!mood}
              onClick={handleNext}
            >
              Next â
            </button>
          </div>
        )}

        {/* Step 1: Practice Scores */}
        {step === 1 && (
          <div className="check-in-step">
            <h3>Practice Scores</h3>
            <p className="text-muted step-hint">
              Enter any scores from today's practice. Leave blank if not practiced.
              Scores on either scale (1â30 or 200â600) are accepted.
            </p>
            <div className="score-grid">
              {SECTIONS.map(section => {
                const raw = scores[section];
                const num = raw !== '' ? Number(raw) : null;
                const preview =
                  num !== null && !isNaN(num) && num >= 1
                    ? ' â ' + (normalizeScore(num, section) || 'â')
                    : '';
                return (
                  <div key={section} className="score-row">
                    <label className="score-label">{section}</label>
                    <input
                      type="number"
                      value={raw}
                      onChange={e => handleScoreChange(section, e.target.value)}
                      placeholder="â"
                      className="score-input"
                      min="1"
                      max="600"
                    />
                    {preview && (
                      <span className="score-preview">{preview}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="step-actions">
              <button className="btn-ghost" onClick={() => setStep(0)}>â Back</button>
              <button className="btn-primary" onClick={handleNext}>Next â</button>
            </div>
          </div>
        )}

        {/* Step 2: Confidence */}
        {step === 2 && (
          <div className="check-in-step">
            <h3>How confident do you feel in each section?</h3>
            <div className="confidence-grid">
              {SECTIONS.map(section => (
                <div key={section} className="confidence-row">
                  <label className="conf-label">{section}</label>
                  <div className="conf-slider-wrap">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={confidence[section]}
                      onChange={e =>
                        setConfidence(prev => ({ ...prev, [section]: Number(e.target.value) }))
                      }
                      className="conf-slider"
                    />
                    <span className="conf-value">
                      {confidence[section]} â {CONFIDENCE_LABELS[confidence[section]]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="step-actions">
              <button className="btn-ghost" onClick={() => setStep(1)}>â Back</button>
              <button className="btn-primary" onClick={handleNext}>Next â</button>
            </div>
          </div>
        )}

        {/* Step 3: Notes */}
        {step === 3 && (
          <div className="check-in-step">
            <h3>Session Notes</h3>
            <p className="text-muted step-hint">
              Anything you want to note â what clicked, what's still fuzzy, how the session felt.
            </p>
            <textarea
              className="notes-area"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="e.g. Finally understood resonance structures. QR timing was rough â need more timed sets."
              rows={6}
            />
            {error && <p className="error-msg">{error}</p>}
            <div className="step-actions">
              <button className="btn-ghost" onClick={() => setStep(2)}>â Back</button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Savingâ¦' : 'Submit Check-In â'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="check-in-step check-in-done">
            <div className="done-icon">â</div>
            <h3>Check-in saved!</h3>
            <p className="text-muted">
              Great work today, {student.name.split(' ')[0]}. Your coach can see this and will plan accordingly.
            </p>
            <div className="done-summary">
              {mood && (
                <p>
                  <strong>Mood:</strong>{' '}
                  {MOOD_OPTIONS.find(m => m.value === mood)?.label}
                </p>
              )}
              {hoursStudied && (
                <p>
                  <strong>Hours studied:</strong> {hoursStudied}h
                </p>
              )}
              {Object.entries(scores).some(([, v]) => v !== '') && (
                <div>
                  <strong>Scores recorded:</strong>
                  <ul>
                    {SECTIONS.filter(s => scores[s] !== '').map(s => {
                      const raw = Number(scores[s]);
                      const norm = normalizeScore(raw, s);
                      return (
                        <li key={s}>
                          {s}: {norm}
                          {raw !== norm ? ` (entered ${raw})` : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <button className="btn-ghost" onClick={handleReset}>
              + New Check-In
            </button>
          </div>
        )}
      </div>

      <style>{`
        .check-in-page {
          max-width: 640px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .check-in-header {
          margin-bottom: 2rem;
        }
        .check-in-header h2 {
          margin: 0 0 0.25rem;
          font-size: 1.6rem;
        }
        .check-in-progress {
          display: flex;
          gap: 0;
          margin-top: 1.5rem;
          border-radius: 8px;
          overflow: hidden;
          background: var(--surface-2);
        }
        .progress-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.6rem 0.5rem;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          cursor: default;
          transition: background 0.2s;
        }
        .progress-step.active {
          background: var(--accent-blue);
          color: #fff;
        }
        .progress-step.done {
          background: var(--accent-green);
          color: #fff;
          cursor: pointer;
        }
        .step-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .progress-step:not(.active):not(.done) .step-dot {
          background: var(--surface-3);
          color: var(--text-muted);
        }
        .check-in-body {
          background: var(--surface-1);
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid var(--border);
        }
        .check-in-step h3 {
          margin: 0 0 1rem;
          font-size: 1.15rem;
        }
        .step-hint {
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
        }
        .mood-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .mood-btn {
          padding: 0.75rem 0.5rem;
          border-radius: 8px;
          border: 2px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .mood-btn:hover {
          border-color: var(--accent-blue);
        }
        .mood-btn.selected {
          font-weight: 600;
        }
        .hours-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .hours-row label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          flex: 1;
        }
        .hours-input {
          width: 90px;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .step-btn {
          width: 100%;
        }
        .score-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .score-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .score-label {
          width: 60px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .score-input {
          width: 90px;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .score-preview {
          font-size: 0.85rem;
          color: var(--accent-green);
          font-weight: 600;
        }
        .confidence-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .confidence-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .conf-label {
          width: 60px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .conf-slider-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .conf-slider {
          flex: 1;
          accent-color: var(--accent-blue);
        }
        .conf-value {
          font-size: 0.8rem;
          color: var(--text-muted);
          min-width: 110px;
        }
        .notes-area {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
          margin-bottom: 1.25rem;
          box-sizing: border-box;
        }
        .step-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }
        .check-in-done {
          text-align: center;
        }
        .done-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .done-summary {
          text-align: left;
          background: var(--surface-2);
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin: 1.25rem 0;
          font-size: 0.9rem;
        }
        .done-summary p { margin: 0.25rem 0; }
        .done-summary ul { margin: 0.25rem 0 0 1rem; padding: 0; }
        .error-msg {
          color: var(--accent-red);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
        .btn-primary {
          padding: 0.6rem 1.25rem;
          background: var(--accent-blue);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          padding: 0.6rem 1.25rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-ghost:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export { StudentCheckIn };
