import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../app/providers/PortalProvider';
import { Badge } from '../../components/common/Badge';
import { PageIntro } from '../../components/common/PageIntro';
import { getStudentDirectory } from '../../utils/selectors';
import { formatCurrency, formatHours } from '../../utils/formatters';

const statusOptions = ['All', 'Active', 'Pending', 'Completed', 'Cleared'];

export function CoachStudentsPage() {
  const { students, sessions, payments, weeklyPlans, selfAssessments } = usePortal();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const roster = useMemo(
    () => getStudentDirectory(students, sessions, payments, weeklyPlans, selfAssessments),
    [payments, selfAssessments, sessions, students, weeklyPlans],
  );

  const filteredStudents = roster.filter((student) => {
    const matchesStatus = status === 'All' || student.status === status;
    const matchesQuery =
      !query ||
      [student.name, student.focusArea, student.primaryCoach, student.supportCoach]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query.toLowerCase()));

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="page-stack">
      <PageIntro
        description="The student roster is backed by normalized seed modules instead of a monolithic page component."
        eyebrow="Coach Portal"
        title="Students"
      />

      <div className="toolbar">
        <label className="input-shell">
          <span>Search</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search by student, coach, or focus area" value={query} />
        </label>

        <div className="segmented-control">
          {statusOptions.map((option) => (
            <button
              className={['segmented-control__item', option === status ? 'segmented-control__item--active' : ''].filter(Boolean).join(' ')}
              key={option}
              onClick={() => setStatus(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="student-grid">
        {filteredStudents.map((student) => (
          <Link className="student-card" key={student.id} to={`/coach/students/${student.id}`}>
            <div className="student-card__header">
              <div className="student-card__avatar" style={{ backgroundColor: student.accentColor }}>
                {student.initials}
              </div>
              <Badge tone={student.amountOwed > 0 ? 'warning' : 'success'}>{student.status}</Badge>
            </div>

            <div className="student-card__body">
              <h3>{student.name}</h3>
              <p>{student.focusArea}</p>
            </div>

            <dl className="student-card__stats">
              <div>
                <dt>Hours</dt>
                <dd>{formatHours(student.hoursUsed)}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>{formatCurrency(student.amountPaid)}</dd>
              </div>
              <div>
                <dt>Owed</dt>
                <dd>{formatCurrency(student.amountOwed)}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{student.currentPlan?.published ? 'Published' : 'Draft / none'}</dd>
              </div>
              <div>
                <dt>Issues</dt>
                <dd>{student.assessmentSummary?.weakAreaLabels?.join(', ') || 'Not submitted'}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
