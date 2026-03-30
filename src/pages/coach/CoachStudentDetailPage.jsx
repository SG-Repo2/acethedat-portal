import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { PracticeTestTrendChart } from '../../components/charts/PracticeTestTrendChart';
import { DAT_SECTIONS, MQL_ERROR_TYPES, WEEKDAY_META } from '../../data/manualWorkflow';
import { formatCurrency } from '../../utils/formatters';

function buildMqlSummary(entries) {
  return DAT_SECTIONS.map((section) => {
    const sectionEntries = entries.filter((entry) => entry.section === section);
    const errorCounts = MQL_ERROR_TYPES.reduce((collection, errorType) => {
      collection[errorType] = sectionEntries.filter((entry) => entry.errorType === errorType).length;
      return collection;
    }, {});
    return {
      section,
      total: sectionEntries.length,
      errorCounts,
    };
  }).filter((summary) => summary.total > 0);
}

export function CoachStudentDetailPage() {
  const { studentId } = useParams();
  const {
    students,
    getWeeklyPlan,
    getStudentPracticeTests,
    getStudentMqlEntries,
    getStudentPayments,
  } = usePortal();

  const student = students.find((entry) => entry.id === studentId) || null;
  const weeklyPlan = student ? getWeeklyPlan(student.id) : null;
  const practiceTests = student ? getStudentPracticeTests(student.id) : [];
  const mqlEntries = student ? getStudentMqlEntries(student.id) : [];
  const payments = student ? getStudentPayments(student.id) : [];

  const mqlSummary = useMemo(() => buildMqlSummary(mqlEntries), [mqlEntries]);
  const totalPlanTasks = weeklyPlan?.days?.reduce((sum, day) => sum + day.tasks.length, 0) || 0;

  if (!student) {
    return (
      <div style={{ padding: 28, color: 'var(--text-muted)' }}>
        Student not found.
      </div>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 12 }}>
              Student Detail
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
              {student.name}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tag tag-muted">{student.id}</span>
              <span className="tag tag-gold">{student.program || 'DAT Coaching'}</span>
              <span className={`tag ${student.status === 'Active' ? 'tag-success' : 'tag-muted'}`}>{student.status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-subtle" to={`/coach/planning-hub?student=${student.id}`}>
              Open Planning Hub
            </Link>
            <Link className="btn btn-gold" to="/coach/payments">
              Open Payments
            </Link>
          </div>
        </div>
      </div>

      <div className="stat-grid stat-grid-4" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card-label">Weekly Plan</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{weeklyPlan?.status || 'none'}</div>
          <div className="stat-card-sub">{totalPlanTasks} tasks in current view</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Practice Tests</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{practiceTests.length}</div>
          <div className="stat-card-sub">manual test records</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">MQL Entries</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{mqlEntries.length}</div>
          <div className="stat-card-sub">manual missed question log entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Remaining Balance</div>
          <div className="stat-card-value" style={{ color: student.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(student.remainingBalance || 0)}
          </div>
          <div className="stat-card-sub">next payment {student.nextPaymentDate || 'not set'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 18, alignItems: 'start', marginBottom: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Current Weekly Plan</span>
          </div>
          {weeklyPlan ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {WEEKDAY_META.map((dayMeta) => {
                const day = weeklyPlan.days.find((entry) => entry.id === dayMeta.key);
                const taskCount = day?.tasks?.length || 0;
                return (
                  <div key={dayMeta.key} style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-panel-hover)',
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: dayMeta.color }}>{dayMeta.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{taskCount} tasks</div>
                    </div>
                    {taskCount > 0 ? (
                      <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                        {day.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                            {task.text}
                          </div>
                        ))}
                        {taskCount > 3 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            +{taskCount - 3} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        No tasks set.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No weekly plan has been created for this student yet.
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Payment Snapshot</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>Amount Paid</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-hi)', marginTop: 6 }}>
                {formatCurrency(student.amountPaid || 0)}
              </div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>Remaining Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: student.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 6 }}>
                {formatCurrency(student.remainingBalance || 0)}
              </div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>Next Payment Date</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', marginTop: 6 }}>
                {student.nextPaymentDate || 'Not scheduled'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Practice Test Trends</span>
        </div>
        <PracticeTestTrendChart tests={practiceTests} />
        {practiceTests.length > 0 && (
          <div style={{ marginTop: 16 }} className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PT</th>
                  <th>Date</th>
                  {DAT_SECTIONS.map((section) => <th key={section}>{section}</th>)}
                </tr>
              </thead>
              <tbody>
                {practiceTests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.testNumber}</td>
                    <td>{test.takenOn}</td>
                    {DAT_SECTIONS.map((section) => <td key={section}>{test.sections[section] ?? '-'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">MQL Patterns</span>
          </div>
          {mqlSummary.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {mqlSummary.map((summary) => (
                <div key={summary.section} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
                    {summary.section} ({summary.total})
                  </div>
                  <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-lo)' }}>
                    {MQL_ERROR_TYPES.map((errorType) => (
                      <div key={errorType} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span>{errorType}</span>
                        <strong style={{ color: 'var(--text-hi)' }}>{summary.errorCounts[errorType]}</strong>
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
            <span className="panel-title">Recent MQL Entries</span>
          </div>
          {mqlEntries.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {mqlEntries.slice(0, 8).map((entry) => (
                <div key={entry.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-panel-hover)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span className="tag tag-muted">{entry.section}</span>
                    <span className="tag tag-gold">{entry.errorType}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-hi)', marginBottom: 6 }}>
                    {entry.questionReference || 'Question reference not set'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                    Action: {entry.actionItem || 'Not set'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No MQL entries yet.
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-header">
          <span className="panel-title">Student Payment Entries</span>
        </div>
        {payments.length > 0 ? (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Kind</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.date}</td>
                    <td>{payment.kind}</td>
                    <td>{payment.method}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No payment entries logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
