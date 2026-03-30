import { useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { ERROR_CATEGORIES, SECTIONS } from '../../data/seedData';

const GLOBAL_INSIGHTS = [
  { id: 'i1', pattern: 'QR Decision Latency', instances: 7, fix: '90-sec hard cap + guess protocol eliminates pacing collapse in 5/7 cases', category: '3' },
  { id: 'i2', pattern: 'Keyword Anchoring in Bio', instances: 9, fix: 'Force verbalization of mechanism BEFORE answer selection. 3-session drill cycle.', category: '4' },
  { id: 'i3', pattern: 'SN1/SN2 Rule Inversion', instances: 5, fix: 'Rebuild nucleophilic sub decision tree from carbocation stability first principles', category: '2' },
  { id: 'i4', pattern: 'Confidence/Accuracy Gap', instances: 4, fix: 'Confidence calibration: predict score before test, compare after. Repeat 3x.', category: '3' },
  { id: 'i5', pattern: 'PAT Time Sink on 3D Items', instances: 6, fix: 'Hard 30-sec cap, flag and move. Never sacrifice 3 easy items for 1 hard one.', category: '5' },
];

function ErrorCatBar({ errors }) {
  const total = errors.length || 1;
  return (
    <div>
      {Object.entries(ERROR_CATEGORIES).map(([key, cat]) => {
        const count = errors.filter(e => e.category === String(key)).length;
        const pct = Math.round(count / total * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div className="error-cat-badge" style={{ background: cat.bg, border: `1px solid ${cat.color}40`, color: cat.color }}>
              {key}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{cat.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: pct > 30 ? cat.color : 'var(--text-lo)' }}>
                  {pct}%{pct > 30 ? ' ⚡' : ''}
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CoachDiagnostic() {
  const { mqlErrors, addMqlError, students = [] } = usePortal();
  const [activeStudent, setActiveStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ section: 'Bio', category: '', reasoning: '', pattern: '', intervention: '' });
  const [flash, setFlash] = useState(false);
  const [insightForm, setInsightForm] = useState(false);
  const [insights, setInsights] = useState(GLOBAL_INSIGHTS);
  const [newInsight, setNewInsight] = useState({ pattern: '', fix: '', category: '', instances: 1 });

  const student = students.find(s => s.id === activeStudent) || students[0];

  const handleSubmitError = () => {
    if (!form.category || !form.reasoning) return;
    addMqlError({ ...form, studentId: activeStudent });
    setForm({ section: 'Bio', category: '', reasoning: '', pattern: '', intervention: '' });
    setShowForm(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 3000);
  };

  const addInsight = () => {
    if (!newInsight.pattern || !newInsight.fix) return;
    setInsights([...insights, { ...newInsight, id: `i${Date.now()}`, studentIds: [] }]);
    setNewInsight({ pattern: '', fix: '', category: '', instances: 1 });
    setInsightForm(false);
  };

  const totalErrors = mqlErrors.length;
  const totalSessions = 0;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">Diagnostic Engine</div>
        <div className="section-header-sub">Classify every miss. Know exactly why scores stall. Build your pattern database.</div>
      </div>

      {/* Student Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {students.map(s => (
          <button key={s.id} className={`btn ${activeStudent === s.id ? 'btn-gold' : 'btn-ghost'}`}
            onClick={() => setActiveStudent(s.id)}>
            {s.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stat-grid stat-grid-4">
        <div className="stat-card">
          <div className="stat-card-label">Errors Logged</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{totalErrors}</div>
          <div className="stat-card-sub">across all students</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Insights</div>
          <div className="stat-card-value" style={{ color: '#a78bfa' }}>{insights.length}</div>
          <div className="stat-card-sub">in pattern database</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Sessions</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{totalSessions}</div>
          <div className="stat-card-sub">total completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Students</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{students.length}</div>
          <div className="stat-card-sub">enrolled</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Error Distribution */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Error Category Distribution</span>
            <span className="tag tag-muted">{mqlErrors.length} logged</span>
          </div>
          <ErrorCatBar errors={mqlErrors} />
        </div>

        {/* Active Triggers */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Active Protocol Triggers</span>
          </div>
          {Object.entries(ERROR_CATEGORIES).map(([key, cat]) => {
            const count = mqlErrors.filter(e => e.category === String(key)).length;
            const pct = mqlErrors.length > 0 ? Math.round(count / mqlErrors.length * 100) : 0;
            const thresholds = { 1: 40, 2: 30, 3: 30, 4: 20, 5: 20 };
            const fired = pct >= (thresholds[key] || 30);
            if (!fired) return null;
            const actions = {
              1: 'Reteach fundamentals — content review before drilling',
              2: 'Targeted correction drills — rebuild mental model from first principles',
              3: 'Timed drills + protocol training — execution, not content',
              4: 'Slow down protocol — enforce re-read before committing',
              5: 'Pacing drills — enforce hard time caps per question',
            };
            return (
              <div key={key} style={{ marginBottom: 10, padding: '12px 14px', borderRadius: 10, background: cat.bg, border: `1px solid ${cat.color}30` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: cat.color, marginBottom: 4 }}>
                  ⚡ {cat.label} — {pct}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{actions[key]}</div>
              </div>
            );
          })}
          {mqlErrors.length === 0 && (
            <div style={{ color: 'var(--text-lo)', fontSize: 13, padding: '12px 0' }}>
              No errors logged yet. Log errors to see trigger analysis.
            </div>
          )}
        </div>
      </div>

      {/* Error Log */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="panel-title">Error Log</span>
            <span className="tag tag-muted">{mqlErrors.length} logged</span>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Log Error'}
          </button>
        </div>

        {flash && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: 12, marginBottom: 12 }}>
            ✓ Error logged and classified.
          </div>
        )}

        {showForm && (
          <div style={{ padding: 18, borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Step 1 — Get Student Reasoning First
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="form-label">Section</label>
                <select className="form-select" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Error Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select...</option>
                  {Object.entries(ERROR_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{key}. {cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Student's Reasoning (verbatim — before correction)</label>
              <textarea className="form-textarea" value={form.reasoning} onChange={e => setForm({ ...form, reasoning: e.target.value })}
                placeholder="What did they say when asked to explain their thinking?" rows={2} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="form-label">Pattern Name (short)</label>
                <input className="form-input" value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })}
                  placeholder="e.g. Keyword anchor, Rule inversion" />
              </div>
              <div>
                <label className="form-label">Intervention</label>
                <input className="form-input" value={form.intervention} onChange={e => setForm({ ...form, intervention: e.target.value })}
                  placeholder="Specific fix, not 'study more'" />
              </div>
            </div>
            <button className="btn btn-gold" onClick={handleSubmitError}>Log Error →</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...mqlErrors].reverse().map(err => {
            const cat = ERROR_CATEGORIES[err.category];
            return (
              <div key={err.id} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'start' }}>
                <div className="error-cat-badge" style={{ background: cat?.bg, border: `1px solid ${cat?.color}40`, color: cat?.color }}>
                  {err.category}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span className="tag tag-muted">{err.section}</span>
                    {err.pattern && <span className="tag" style={{ background: cat?.bg, borderColor: `${cat?.color}30`, color: cat?.color }}>{err.pattern}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)', fontStyle: 'italic', marginBottom: 4 }}>"{err.reasoning}"</div>
                  {err.intervention && <div style={{ fontSize: 12, color: 'var(--success)' }}>↳ {err.intervention}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{err.date}</div>
              </div>
            );
          })}
          {mqlErrors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No errors logged yet. Start logging to build the diagnostic engine.
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Compounding - Pattern Database */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="panel-title">Failure Mode Database</span>
            <span className="tag tag-purple">{insights.length} patterns</span>
          </div>
          <button className="btn btn-ghost" onClick={() => setInsightForm(!insightForm)}>
            {insightForm ? 'Cancel' : '+ Log Insight'}
          </button>
        </div>

        {insightForm && (
          <div style={{ padding: 16, background: 'var(--bg-panel-hover)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label className="form-label">Pattern Name</label>
                <input className="form-input" value={newInsight.pattern} onChange={e => setNewInsight({ ...newInsight, pattern: e.target.value })}
                  placeholder="e.g. QR Decision Latency" />
              </div>
              <div>
                <label className="form-label">Error Category</label>
                <select className="form-select" value={newInsight.category} onChange={e => setNewInsight({ ...newInsight, category: e.target.value })}>
                  <option value="">Select...</option>
                  {Object.entries(ERROR_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{key}. {cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label className="form-label">Best Fix (be specific)</label>
              <textarea className="form-textarea" value={newInsight.fix} onChange={e => setNewInsight({ ...newInsight, fix: e.target.value })}
                placeholder="Exact intervention that worked, not general advice" rows={2} />
            </div>
            <button className="btn btn-gold" onClick={addInsight}>Save to Database →</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map(ins => {
            const cat = ERROR_CATEGORIES[ins.category];
            return (
              <div key={ins.id} style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>{ins.pattern}</span>
                    {cat && <span className="tag" style={{ background: cat.bg, borderColor: `${cat.color}30`, color: cat.color }}>{cat.label}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 6 }}>{ins.fix}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{ins.instances}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>instances</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
