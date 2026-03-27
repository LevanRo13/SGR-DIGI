import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProcessesPage from './pages/ProcessesPage';
import CertificatesPage from './pages/CertificatesPage';
import MarketplacePage from './pages/MarketplacePage';
import ExplorerPage from './pages/ExplorerPage';
import CompaniesPage from './pages/CompaniesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Main routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/guarantee" element={<UploadPage />} />
      <Route path="/upload" element={<Navigate to="/guarantee" replace />} />
      <Route path="/processes" element={<ProcessesPage />} />
      <Route path="/certificates" element={<CertificatesPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/explorer" element={<ExplorerPage />} />
      <Route path="/companies" element={<CompaniesPage />} />
      <Route path="/settings" element={<SettingsPage />} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
