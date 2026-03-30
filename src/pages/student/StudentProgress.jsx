import { usePortal } from '../../app/providers/PortalProvider';
import { SECTIONS } from '../../data/seedData';

export function StudentProgress() {
  const { currentStudent, weeklyPlan, taskCompletion } = usePortal();

  if (!currentStudent || !weeklyPlan) return <div style={{ color: 'var(--text-lo)', padding: 40 }}>No data available.</div>;

  const allTasks = weeklyPlan.days.flatMap(d => d.tasks);
  const totalDone = allTasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).length;
  const totalTasks = allTasks.length;
  const weekPct = totalTasks > 0 ? Math.round(totalDone / totalTasks * 100) : 0;

  // Section completion
  const sectionStats = {};
  SECTIONS.forEach(sec => {
    const tasks = allTasks.filter(t => t.section === sec);
    const done = tasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).length;
    sectionStats[sec] = { total: tasks.length, done, pct: tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0 };
  });

  // Daily completion
  const dayStats = weeklyPlan.days.map(d => {
    const done = d.tasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).length;
    return { label: d.short, done, total: d.tasks.length, pct: d.tasks.length > 0 ? Math.round(done / d.tasks.length * 100) : 0 };
  });

  const totalMins = allTasks.reduce((a, t) => a + (t.mins || 0), 0);
  const doneMins = allTasks.filter(t => taskCompletion[`${currentStudent?.id}:${t.id}`]).reduce((a, t) => a + (t.mins || 0), 0);
  const daysComplete = dayStats.filter(d => d.total > 0 && d.done === d.total).length;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div className="section-header-title">Progress</div>
        <div className="section-header-sub">Week overview and section breakdown.</div>
      </div>

      <div className="stat-grid stat-grid-4">
        <div className="stat-card">
          <div className="stat-card-label">Week Completion</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{weekPct}%</div>
          <div className="stat-card-sub">{totalDone} of {totalTasks} tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Hours Planned</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{(totalMins / 60).toFixed(1)}h</div>
          <div className="stat-card-sub">{(doneMins / 60).toFixed(1)}h completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Days Complete</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{daysComplete}</div>
          <div className="stat-card-sub">of {dayStats.filter(d => d.total > 0).length} study days</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Predicted Score</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{currentStudent.predicted}</div>
          <div className="stat-card-sub">Target: {currentStudent.targetAA}</div>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Daily Completion</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {dayStats.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>{d.label}</div>
              <div style={{ height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 6, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                <div style={{ height: `${d.pct}%`, background: d.pct === 100 ? 'var(--success)' : 'var(--gold)', borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease', minHeight: d.total > 0 ? 2 : 0 }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: d.pct === 100 ? 'var(--success)' : 'var(--text-mid)', marginTop: 6 }}>
                {d.total === 0 ? 'â' : `${d.pct}%`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section breakdown */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Section Completion</span>
        </div>
        {Object.entries(sectionStats).filter(([, s]) => s.total > 0).map(([sec, s]) => (
          <div key={sec} className="score-bar" style={{ marginBottom: 10 }}>
            <div className="score-bar-label">{sec}</div>
            <div className="score-bar-track" style={{ height: 8 }}>
              <div className="score-bar-fill" style={{ width: `${s.pct}%`, background: s.pct === 100 ? 'var(--success)' : 'var(--gold)' }} />
            </div>
            <div style={{ width: 50, fontSize: 11, fontWeight: 700, color: s.pct === 100 ? 'var(--success)' : 'var(--text-mid)', textAlign: 'right' }}>
              {s.done}/{s.total}
            </div>
          </div>
        ))}
      </div>

      {/* Section scores */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Current Section Scores</span>
          <span className="tag tag-muted">Baseline</span>
        </div>
        {Object.entries(currentStudent.sections).map(([sec, val]) => (
          <div key={sec} className="score-bar">
            <div className="score-bar-label">{sec}</div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width: `${((val - 200) / 400) * 100}%`, background: val >= 400 ? 'var(--success)' : val >= 350 ? 'var(--gold)' : 'var(--danger)' }} />
            </div>
            <div className="score-bar-value">{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
