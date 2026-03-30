import { LogOut, Menu } from 'lucide-react';
import { formatDate } from '../../utils/date';
import { Button } from '../common/Button';

export function PortalHeader({ coachNotifications, currentProfile, onLogout, onToggleSidebar }) {
  return (
    <header className="portal-header">
      <div className="portal-header__left">
        <button className="icon-button portal-header__menu" onClick={onToggleSidebar} type="button">
          <Menu size={18} />
        </button>
        <div>
          <h1>{currentProfile?.role === 'coach' ? 'Coach workspace' : `${currentProfile?.name} portal`}</h1>
        </div>
      </div>

      <div className="portal-header__right">
        <div className="portal-header__date">{formatDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        {coachNotifications}
        <Button tone="neutral" variant="outline" size="sm" onClick={onLogout}>
          <LogOut size={16} />
          Log out
        </Button>
      </div>
    </header>
  );
}
