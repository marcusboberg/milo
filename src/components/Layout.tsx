import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const tabs = [
  { to: '/', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' }
];

export const Layout = () => {
  const { user, logOut } = useAuth();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-overline">Stockholm feeding log</p>
          <p className="brand-name">Milo</p>
        </div>
        <div className="header-right">
          <small className="user-pill">{user?.email ?? 'Signed in'}</small>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logOut()}>
            Log out
          </button>
        </div>
      </header>

      <Outlet />

      <nav className="app-nav">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link-active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </main>
  );
};
