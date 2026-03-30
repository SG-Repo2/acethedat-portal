import { NavLink } from 'react-router-dom';

export function PortalSidebar({ navigation, open, onClose, profile }) {
  return (
    <>
      <div className={['sidebar-backdrop', open ? 'sidebar-backdrop--visible' : ''].filter(Boolean).join(' ')} onClick={onClose} />
      <aside className={['portal-sidebar', open ? 'portal-sidebar--open' : ''].filter(Boolean).join(' ')}>
        <div className="portal-sidebar__brand">
          <p className="portal-sidebar__eyebrow">AceTheDAT</p>
          <h2>Portal</h2>
          <p className="portal-sidebar__profile">{profile?.role === 'coach' ? 'Coach operations workspace' : `${profile?.name} student dashboard`}</p>
        </div>

        <nav className="portal-sidebar__nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  ['nav-link', isActive ? 'nav-link--active' : ''].filter(Boolean).join(' ')
                }
                key={item.to}
                onClick={onClose}
                to={item.to}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
