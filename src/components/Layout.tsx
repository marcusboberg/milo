import { Link, Outlet, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' }
];

export const Layout = () => {
  const location = useLocation();

  return (
    <main style={{ margin: '0 auto', maxWidth: 480, padding: 16, fontFamily: 'system-ui' }}>
      <Outlet />
      <nav style={{ position: 'sticky', bottom: 0, marginTop: 20, background: '#fff', borderTop: '1px solid #ddd', padding: 12, display: 'flex', justifyContent: 'space-around' }}>
        {tabs.map((tab) => (
          <Link key={tab.to} to={tab.to} style={{ color: location.pathname === tab.to ? '#0f766e' : '#555', fontWeight: 600, textDecoration: 'none' }}>
            {tab.label}
          </Link>
        ))}
      </nav>
    </main>
  );
};
