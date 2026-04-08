import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Konsultasi from './pages/Konsultasi';
import StatusAudit from './pages/StatusAudit';
import ProsesAudit from './pages/ProsesAudit';
import ProfilSPI from './pages/ProfilSPI';
import KelolaUser from './pages/KelolaUser';
import AjukanTindakLanjut from './pages/AjukanTindakLanjut';
import AuditeeList from './pages/AuditeeList';
import BuatUser from './pages/BuatUser';
import Profile from './pages/Profile';
import LogAktivitas from './pages/LogAktivitas';
import PengaturanSistem from './pages/PengaturanSistem';
import ManajemenRole from './pages/ManajemenRole';
import BackupRestore from './pages/BackupRestore';
import Laporan from './pages/Laporan';
import MainLayout from './components/layout/MainLayout';
import ForcePasswordChange from './components/ForcePasswordChange';
import NotificationHost from './components/NotificationHost';
import { UXProvider } from './contexts/UXContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ─── Role-based Route Protection ───
// Defines which roles can access which routes
const ROLE_ACCESS = {
  auditee:    ['dashboard', 'konsultasi', 'ajukan', 'status-audit', 'proses-audit', 'profil-spi'],
  auditor:    ['dashboard', 'konsultasi', 'auditee-list', 'status-audit', 'proses-audit', 'laporan', 'profil-spi', 'profile'],
  admin:      ['dashboard', 'kelola-user', 'buat-user', 'manajemen-role', 'log-aktivitas', 'pengaturan-sistem', 'backup-restore', 'profile'],
  // Manajemen sub-roles
  kspi:           ['dashboard', 'status-audit', 'proses-audit', 'laporan', 'profil-spi', 'profile'],
  komite:         ['dashboard', 'profile'],
};

const RoleRoute = ({ route, children }) => {
  const { user } = useAuth();
  const currentUser = user;
  const role = currentUser?.role;
  const subRole = currentUser?.sub_role;

  // Determine access key
  const accessKey = (role === 'manajemen' && subRole) ? subRole : role;
  const allowedRoutes = ROLE_ACCESS[accessKey] || [];

  if (!allowedRoutes.includes(route)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <UXProvider>
        <NotificationHost />
        <BrowserRouter>
          <ForcePasswordChange />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="konsultasi" element={<RoleRoute route="konsultasi"><Konsultasi /></RoleRoute>} />
              <Route path="ajukan" element={<RoleRoute route="ajukan"><AjukanTindakLanjut /></RoleRoute>} />
              <Route path="status-audit" element={<RoleRoute route="status-audit"><StatusAudit /></RoleRoute>} />
              <Route path="proses-audit" element={<RoleRoute route="proses-audit"><ProsesAudit /></RoleRoute>} />
              <Route path="laporan" element={<RoleRoute route="laporan"><Laporan /></RoleRoute>} />
              <Route path="profil-spi" element={<RoleRoute route="profil-spi"><ProfilSPI /></RoleRoute>} />
              <Route path="kelola-user" element={<RoleRoute route="kelola-user"><KelolaUser /></RoleRoute>} />
              <Route path="auditee-list" element={<RoleRoute route="auditee-list"><AuditeeList /></RoleRoute>} />
              <Route path="buat-user" element={<RoleRoute route="buat-user"><BuatUser /></RoleRoute>} />
              <Route path="log-aktivitas" element={<RoleRoute route="log-aktivitas"><LogAktivitas /></RoleRoute>} />
              <Route path="pengaturan-sistem" element={<RoleRoute route="pengaturan-sistem"><PengaturanSistem /></RoleRoute>} />
              <Route path="manajemen-role" element={<RoleRoute route="manajemen-role"><ManajemenRole /></RoleRoute>} />
              <Route path="backup-restore" element={<RoleRoute route="backup-restore"><BackupRestore /></RoleRoute>} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UXProvider>
    </AuthProvider>
  );
}

export default App;
