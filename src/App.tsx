import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChooseFoodPage } from './pages/ChooseFoodPage';
import { HistoryPage } from './pages/HistoryPage';
import { LogPortionPage } from './pages/LogPortionPage';
import { LogSnackPage } from './pages/LogSnackPage';
import { SettingsPage } from './pages/SettingsPage';
import { TodayPage } from './pages/TodayPage';

export const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<TodayPage />} />
      <Route path="/choose-food" element={<ChooseFoodPage />} />
      <Route path="/log-portion" element={<LogPortionPage />} />
      <Route path="/log-snack" element={<LogSnackPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
