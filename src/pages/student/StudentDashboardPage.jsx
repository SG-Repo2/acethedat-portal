import { Link } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { PracticeTestTrendChart } from '../../components/charts/PracticeTestTrendChart';
import { getMqlStatsBySection, getMqlStatsBySectionAndErrorType, getStudentTrendSeries } from '../../utils/selectors';
import { formatCurrency } from '../../utils/formatters';

export function StudentDashboardPage() {
  const {
    currentStudent,
    weeklyPlan,
    taskCompletion,
    practiceTests,
    mqlEntries,
    paymentSummaries,
  } = usePortal();

  if (!currentStudent) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>Loading your dashboard...</div>;
  }

  const allTasks = weeklyPlan?.days?.flatMap((day) => day.tasks || []) || [];
  const completedTasks = allTasks.filter((task) => taskCompletion[`${currentStudent.id}:${task.id}`]).length;
  const studentTests = practiceTests.filter((test) => test.studentId === currentStudent.id);
  const studentTestSeries = getStudentTrendSeries(practiceTests, currentStudent.id);
  const mqlBySection = getMqlStatsBySection(mqlEntries, currentStudent.id);
  const mqlBySectionAndErrorType = getMqlStatsBySectionAndErrorType(mqlEntries, currentStudent.id);
  const payment = paymentSummaries[currentStudent.id] || {
    amountPaid: 0,
    amountDue: 0,
    nextPaymentDate: '',
  };

  return (
    <div className="animate-in">
      <div style={{
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
        borderRadius: 'var(--r-xl)',
        padding: '28px 32px',
        marginBottom: 24,
      }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 12 }}>
          Student Dashboard
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
          {currentStudent.name}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-lo)', lineHeight: 1.7 }}>
          Track your DAT progress with real practice tests, MQL patterns, your current plan, and your manual payment status.
        </div>
      </div>

      <div className="stat-grid stat-grid-4" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card-label">Plan Progress</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{completedTasks}/{allTasks.length}</div>
          <div className="stat-card-sub">tasks completed this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Practice Tests</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{studentTests.length}</div>
          <div className="stat-card-sub">{studentTests.length ? `latest PT ${studentTests[studentTests.length - 1].testNumber}` : 'no tests yet'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">MQL Entries</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{Object.values(mqlBySection).reduce((sum, count) => sum + count, 0)}</div>
          <div className="stat-card-sub">manual missed question logs</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Balance</div>
          <div className="stat-card-value" style={{ color: payment.amountDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(payment.amountDue)}
          </div>
          <div className="stat-card-sub">{payment.nextPaymentDate || 'no next payment date set'}</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Practice Test Trends</span>
          <Link className="btn btn-gold" to="/student/practice-tests">Log Practice Test</Link>
        </div>
        <PracticeTestTrendChart tests={studentTests} />
        {studentTestSeries.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-lo)' }}>
            Line chart plots BIO, GCH, OCH, PAT, RCT, and QRT trends across saved practice tests.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">MQL Summary</span>
            <Link className="btn btn-subtle" to="/student/mql">Open MQL</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.keys(mqlBySectionAndErrorType).length > 0 ? Object.entries(mqlBySectionAndErrorType).map(([section, counts]) => (
              <div key={section} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-panel-hover)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
                  {section} ({mqlBySection[section] || 0})
                </div>
                <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-lo)' }}>
                  {Object.entries(counts).map(([errorType, count]) => (
                    <div key={errorType} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>{errorType}</span>
                      <strong style={{ color: 'var(--text-hi)' }}>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No MQL entries yet.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Quick Links</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link className="btn btn-subtle" to="/student/weekly-plan">View Weekly Plan</Link>
            <Link className="btn btn-subtle" to="/student/practice-tests">Add Practice Test</Link>
            <Link className="btn btn-subtle" to="/student/mql">Add MQL Entry</Link>
            <Link className="btn btn-subtle" to="/student/payments">View Payments</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
