import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './lib/useAuth';
import { ChooseFoodPage } from './pages/ChooseFoodPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { LogPortionPage } from './pages/LogPortionPage';
import { LogSnackPage } from './pages/LogSnackPage';
import { SettingsPage } from './pages/SettingsPage';
import { TodayPage } from './pages/TodayPage';

const RequireAuth = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="status-text">Checking session...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      element={
        <RequireAuth>
          <Layout />
        </RequireAuth>
      }
    >
      <Route path="/" element={<TodayPage />} />
      <Route path="/choose-food" element={<ChooseFoodPage />} />
      <Route path="/log-portion" element={<LogPortionPage />} />
      <Route path="/log-snack" element={<LogSnackPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
