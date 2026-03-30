import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { formatDate } from '../../utils/date';

export function CoachNotifications({ notifications, onMarkReviewed, open, onToggle, onClose }) {
  const unreadCount = notifications.length;
  const notificationCenterRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!open || !notificationCenterRef.current?.contains(event.target)) {
        if (open) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose, open]);

  return (
    <div className="notification-center" ref={notificationCenterRef}>
      <button className={['icon-button', 'notification-trigger', open ? 'notification-trigger--active' : ''].filter(Boolean).join(' ')} onClick={onToggle} type="button">
        <Bell size={18} />
        {unreadCount ? <span className="notification-trigger__count">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-panel">
          <div className="notification-panel__header">
            <div>
              <p className="section-label">Coach notifications</p>
              <p className="list-row__meta">
                {unreadCount ? `${unreadCount} student evaluation${unreadCount > 1 ? 's' : ''} waiting` : 'No unread evaluation alerts'}
              </p>
            </div>
          </div>

          {notifications.length ? (
            <div className="stack-list">
              {notifications.map((notification) => (
                <div className="notification-item" key={notification.id}>
                  <div>
                    <p className="list-row__title">{notification.studentName} submitted an evaluation</p>
                    <p className="list-row__meta">
                      {formatDate(notification.submittedAt)} ·
                      {notification.weakAreaLabels.length ? ` flagged ${notification.weakAreaLabels.join(', ')}` : ' new issue areas available'}
                    </p>
                  </div>
                  <div className="notification-item__actions">
                    <Link className="text-link" to={`/coach/students/${notification.studentId}`}>
                      Open
                    </Link>
                    <Button onClick={() => onMarkReviewed(notification.studentId)} size="sm" tone="neutral" variant="outline">
                      Mark reviewed
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state empty-state--compact">
              <h3>All caught up</h3>
              <p>New student evaluation submissions will appear here.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
