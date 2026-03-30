import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePortal } from '../app/providers/PortalProvider';
import { studentNavigation, coachNavigation } from '../config/navigation';
import { LogOut } from 'lucide-react';

export function PortalLayout() {
  const { currentProfile, logout } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();
  const nav = currentProfile?.role === 'coach' ? coachNavigation : studentNavigation;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="nav">
        <div className="nav-logo">Ace The <em>DAT</em></div>
        <div className="nav-right">
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-lo)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {currentProfile?.name}
          </span>
          <span className="tag tag-muted" style={{ fontSize: 9 }}>
            {currentProfile?.role === 'coach' ? 'Coach' : 'Student'}
          </span>
          <button onClick={handleLogout} className="btn btn-subtle" style={{ padding: '5px 12px', fontSize: 11 }}>
            <LogOut size={13} /> Log out
          </button>
        </div>
      </nav>
      <div className="portal-shell">
        <aside className="portal-sidebar">
          <div className="portal-sidebar-label">
            {currentProfile?.role === 'coach' ? 'Coach Tools' : 'Study Portal'}
          </div>
          {nav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <div
                key={item.to}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.to)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </aside>
        <main className="portal-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
