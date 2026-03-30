import { useMemo, useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { Badge } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { formatDate } from '../../utils/date';
import { formatHours } from '../../utils/formatters';

const statusOptions = ['All', 'Completed', 'Scheduled'];

export function CoachSessionsPage() {
  const { sessions } = usePortal();
  const [status, setStatus] = useState('All');

  const filteredSessions = useMemo(
    () => sessions.filter((session) => status === 'All' || session.status === status),
    [sessions, status],
  );

  const deliveredHours = sessions.reduce((sum, session) => sum + session.hours, 0);
  const scheduledSessions = sessions.filter((session) => session.status === 'Scheduled').length;

  return (
    <div className="page-stack">
      <PageIntro
        description="Session history stays local and read-only for now, but the table shape mirrors what a real sessions repository would return."
        eyebrow="Coach Portal"
        title="Sessions"
      />

      <div className="metric-grid metric-grid--three">
        <MetricCard helper="Across the seeded log" label="Total sessions" value={sessions.length} />
        <MetricCard helper="Completed and scheduled" label="Hours delivered" value={formatHours(deliveredHours)} />
        <MetricCard helper="Needs confirmation / future handling" label="Scheduled follow-ups" value={scheduledSessions} />
      </div>

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

      <SectionCard title="Session log">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Topics</th>
                <th>Coach</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td>{formatDate(session.date)}</td>
                  <td>{session.studentName}</td>
                  <td>{session.topicSummary}</td>
                  <td>{session.coach}</td>
                  <td>{formatHours(session.hours)}</td>
                  <td>
                    <Badge tone={session.status === 'Completed' ? 'success' : 'warning'}>{session.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
