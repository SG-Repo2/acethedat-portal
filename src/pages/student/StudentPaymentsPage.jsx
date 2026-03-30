import { useMemo } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { formatCurrency } from '../../utils/formatters';

export function StudentPaymentsPage() {
  const { currentStudent, getStudentPayments } = usePortal();

  const payments = useMemo(
    () => (currentStudent ? getStudentPayments(currentStudent.id) : []),
    [currentStudent, getStudentPayments],
  );

  if (!currentStudent) {
    return <div style={{ padding: 30, color: 'var(--text-muted)' }}>Loading your payments...</div>;
  }

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">Payments</div>
          <div className="section-header-sub">
            Your coach updates this manually so both sides see the same balance and payment log.
          </div>
        </div>
      </div>

      <div className="stat-grid stat-grid-3" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card-label">Amount Paid</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{formatCurrency(currentStudent.amountPaid || 0)}</div>
          <div className="stat-card-sub">recorded to date</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Remaining Balance</div>
          <div className="stat-card-value" style={{ color: currentStudent.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(currentStudent.remainingBalance || 0)}
          </div>
          <div className="stat-card-sub">still outstanding</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Next Payment Date</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{currentStudent.nextPaymentDate || 'Not set'}</div>
          <div className="stat-card-sub">manual schedule</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Payment Log</span>
        </div>
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
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No payment entries logged yet.
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
