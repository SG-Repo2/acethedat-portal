import { useEffect, useMemo, useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { formatCurrency } from '../../utils/formatters';

function EmptyPaymentForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    method: 'Manual',
    kind: 'Payment',
    note: '',
  };
}

function EmptyTeamForm() {
  return {
    payee: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    note: '',
  };
}

export function CoachPaymentsPage() {
  const {
    students,
    studentPayments,
    teamPayments,
    updateStudentPaymentSummary,
    saveStudentPayment,
    deleteStudentPayment,
    saveTeamPayment,
    deleteTeamPayment,
  } = usePortal();

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [summaryForm, setSummaryForm] = useState({ amountPaid: '', remainingBalance: '', nextPaymentDate: '' });
  const [paymentForm, setPaymentForm] = useState(EmptyPaymentForm());
  const [teamForm, setTeamForm] = useState(EmptyTeamForm());

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || null;

  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  useEffect(() => {
    if (!selectedStudent) return;
    setSummaryForm({
      amountPaid: selectedStudent.amountPaid || 0,
      remainingBalance: selectedStudent.remainingBalance || 0,
      nextPaymentDate: selectedStudent.nextPaymentDate || '',
    });
  }, [selectedStudent]);

  const totalOutstanding = useMemo(
    () => students.reduce((sum, student) => sum + (Number(student.remainingBalance) || 0), 0),
    [students],
  );

  const totalCollected = useMemo(
    () => students.reduce((sum, student) => sum + (Number(student.amountPaid) || 0), 0),
    [students],
  );

  function handleSaveSummary() {
    if (!selectedStudent) return;
    updateStudentPaymentSummary(selectedStudent.id, summaryForm);
  }

  function handleAddPayment() {
    if (!selectedStudent) return;
    if (!paymentForm.amount) return;
    saveStudentPayment(selectedStudent.id, {
      ...paymentForm,
      amount: Number(paymentForm.amount) || 0,
    });
    setPaymentForm(EmptyPaymentForm());
  }

  function handleAddTeamPayment() {
    if (!teamForm.payee || !teamForm.amount) return;
    saveTeamPayment({
      ...teamForm,
      amount: Number(teamForm.amount) || 0,
    });
    setTeamForm(EmptyTeamForm());
  }

  return (
    <div className="animate-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-header-title">Payment Tracking</div>
          <div className="section-header-sub">
            Manual payment summaries for students, plus internal payouts to the team.
          </div>
        </div>
      </div>

      <div className="stat-grid stat-grid-3" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card-label">Students Tracked</div>
          <div className="stat-card-value" style={{ color: 'var(--gold)' }}>{students.length}</div>
          <div className="stat-card-sub">manual payment records</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Collected</div>
          <div className="stat-card-value" style={{ color: 'var(--text-hi)' }}>{formatCurrency(totalCollected)}</div>
          <div className="stat-card-sub">from student summary fields</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Remaining Balance</div>
          <div className="stat-card-value" style={{ color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="stat-card-sub">outstanding across roster</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 1fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Student Payment Summary</span>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="form-label">Student</label>
                <select className="form-select" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label">Amount Paid</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={summaryForm.amountPaid}
                        onChange={(event) => setSummaryForm((current) => ({ ...current, amountPaid: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Remaining Balance</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={summaryForm.remainingBalance}
                        onChange={(event) => setSummaryForm((current) => ({ ...current, remainingBalance: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Next Payment Date</label>
                      <input
                        className="form-input"
                        type="date"
                        value={summaryForm.nextPaymentDate}
                        onChange={(event) => setSummaryForm((current) => ({ ...current, nextPaymentDate: event.target.value }))}
                      />
                    </div>
                  </div>
                  <button className="btn btn-gold" onClick={handleSaveSummary}>
                    Save Student Summary
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Add Student Payment Entry</span>
            </div>
            {selectedStudent ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={paymentForm.date}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, date: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Amount</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Method</label>
                    <input
                      className="form-input"
                      value={paymentForm.method}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Kind</label>
                    <input
                      className="form-input"
                      value={paymentForm.kind}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, kind: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Note</label>
                    <input
                      className="form-input"
                      value={paymentForm.note}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))}
                    />
                  </div>
                </div>
                <button className="btn btn-subtle" onClick={handleAddPayment}>
                  Add Student Payment
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Select a student first.
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Student Payment Log</span>
            </div>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Kind</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {studentPayments.map((payment) => {
                    const studentName = students.find((student) => student.id === payment.studentId)?.name || payment.studentId;
                    return (
                      <tr key={payment.id}>
                        <td>{payment.date}</td>
                        <td>{studentName}</td>
                        <td>{payment.kind}</td>
                        <td>{payment.method}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>
                          <button className="btn btn-subtle" onClick={() => deleteStudentPayment(payment.id)} style={{ padding: '4px 10px', fontSize: 11 }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {studentPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student payments logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Internal Payouts</span>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="form-label">Payee</label>
                <input
                  className="form-input"
                  value={teamForm.payee}
                  onChange={(event) => setTeamForm((current) => ({ ...current, payee: event.target.value }))}
                  placeholder="Farwan, Sarah, etc."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={teamForm.date}
                    onChange={(event) => setTeamForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={teamForm.amount}
                    onChange={(event) => setTeamForm((current) => ({ ...current, amount: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Note</label>
                <input
                  className="form-input"
                  value={teamForm.note}
                  onChange={(event) => setTeamForm((current) => ({ ...current, note: event.target.value }))}
                />
              </div>
              <button className="btn btn-gold" onClick={handleAddTeamPayment}>
                Add Internal Payment
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Internal Payment Log</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {teamPayments.length > 0 ? teamPayments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-panel-hover)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>{payment.payee}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>{payment.date}</div>
                      {payment.note && <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>{payment.note}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>{formatCurrency(payment.amount)}</div>
                      <button className="btn btn-subtle" onClick={() => deleteTeamPayment(payment.id)} style={{ marginTop: 8, padding: '4px 10px', fontSize: 11 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No internal payouts logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
