import { usePortal } from '../../app/providers/PortalProvider';
import { TrendChart } from '../../components/charts/TrendChart';
import { EmptyState } from '../../components/common/EmptyState';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { formatDate } from '../../utils/date';
import { formatHours } from '../../utils/formatters';
import { getStudentProgressSeries, getStudentSessions } from '../../utils/selectors';

export function StudentSessionsPage() {
  const { currentStudent, sessions } = usePortal();

  if (!currentStudent) {
    return <EmptyState description="Choose a student demo profile to view session history." title="Student profile missing" />;
  }

  const studentSessions = getStudentSessions(sessions, currentStudent.id);
  const progressSeries = getStudentProgressSeries(currentStudent).map((point) => ({ label: point.label, score: point.score }));

  return (
    <div className="page-stack">
      <PageIntro
        description="Session history and score trajectory come from the same shared demo repository used across the coach portal."
        eyebrow="Student Portal"
        title="Sessions"
      />

      <SectionCard title="Progress trend">
        <TrendChart color="#1f6a4d" data={progressSeries} dataKey="score" />
      </SectionCard>

      <SectionCard title="Session history">
        <div className="stack-list">
          {studentSessions.map((session) => (
            <div className="list-row" key={session.id}>
              <div>
                <p className="list-row__title">{session.topicSummary}</p>
                <p className="list-row__meta">
                  {formatDate(session.date)} · {session.homework || 'Homework shared in session'}
                </p>
              </div>
              <div className="list-row__meta">
                {formatHours(session.hours)} · {session.status}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
