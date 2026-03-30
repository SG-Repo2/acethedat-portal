import { Link } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { getCoachDashboardSnapshot } from '../../utils/selectors';
import { formatCurrency } from '../../utils/formatters';

export function CoachDashboardPage() {
  const { students, payments, weeklyPlans, practiceTests, mqlEntries } = usePortal();
  const dashboard = getCoachDashboardSnapshot({ students, payments, weeklyPlans, practiceTests, mqlEntries });

  return (
    <div className="animate-in">
      <div style={{
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
        borderRadius: 'var(--r-xl)',
        padding: '30px 34px',
        marginBottom: 24,
      }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 12 }}>
          Coach Dashboard
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
          Manual DAT Operations
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-lo)', lineHeight: 1.7 }}>
          Roster, plans, practice tests, MQLs, and payments. No predictions, no demo analytics, no generated summaries.
        </div>
      </div>

      <div className="stat-grid stat-grid-4" style={{ marginBottom: 18 }}>
        {dashboard.metrics.map((metric) => (
          <div key={metric.label} className="stat-card">
            <div className="stat-card-label">{metric.label}</div>
            <div className="stat-card-value" style={{ color: metric.label === 'Outstanding balance' ? 'var(--danger)' : 'var(--gold)' }}>
              {typeof metric.value === 'number' && metric.label !== 'Student roster' && metric.label !== 'Practice tests logged'
                ? formatCurrency(metric.value)
                : metric.value}
            </div>
            <div className="stat-card-sub">{metric.helper}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 18, alignItems: 'start' }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Student Roster</span>
            <Link className="btn btn-gold" to="/coach/students">Manage Students</Link>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {dashboard.roster.map((student) => (
              <Link
                key={student.id}
                to={`/coach/students/${student.id}`}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel-hover)',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>
                      Last practice test: {student.latestPracticeTest ? `PT ${student.latestPracticeTest.testNumber} on ${student.latestPracticeTest.date || student.latestPracticeTest.takenOn}` : 'none'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                      Next payment due: {student.nextPaymentDate || 'not set'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>
                      {student.currentPlan?.status || 'no plan'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: (student.remainingBalance || 0) > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
                      {formatCurrency(student.remainingBalance || 0)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Planning</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <Link className="btn btn-subtle" to="/coach/planning-hub">Open Planning Hub</Link>
              <div style={{ fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.7 }}>
                Use Planning Hub to assign Monday-Sunday tasks and review DAT-aware suggested section hours before saving.
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Payments & Calendar</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <Link className="btn btn-subtle" to="/coach/payments">Open Payment Tracker</Link>
              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px dashed var(--border)',
                background: 'var(--bg-panel-hover)',
                color: 'var(--text-lo)',
                fontSize: 13,
                lineHeight: 1.7,
              }}
              >
                Calendar integration remains a placeholder, but the dashboard keeps the link point visible so scheduling can be added later without changing the manual data model.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
