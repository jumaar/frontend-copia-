import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import RootLayout from './layouts/RootLayout';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CreateUserTokenPage from './pages/admin/CreateUserTokenPage';
import StoreManagementPage from './pages/admin/StoreManagementPage';
import FrigorificoManagementPage from './pages/admin/FrigorificoManagementPage';
import LogisticaManagementPage from './pages/admin/LogisticaManagementPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import FridgeManagementPage from './pages/admin/FridgeManagementPage';
import GlobalAccountsPage from './pages/admin/GlobalAccountsPage';
import FrigorificoPage from './pages/frigorifico/FrigorificoPage';
import LogisticaPage from './pages/logistica/LogisticaPage';
import TiendaDashboardPage from './pages/tienda/TiendaDashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './layouts/ProtectedRoute';

const AppContent: React.FC = () => {
  const auth = useContext(AuthContext);

  return (
    <RootLayout isLoading={auth?.isLoading ?? true}>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Rutas Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin', 'Frigorifico', 'Logistica', 'Tienda']}><DashboardPage /></ProtectedRoute>} />

        {/* Rutas de Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/create-user-token" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><CreateUserTokenPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Super_Admin']}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/admin/tiendas" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><StoreManagementPage /></ProtectedRoute>} />
        <Route path="/admin/frigorificos" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><FrigorificoManagementPage /></ProtectedRoute>} />
        <Route path="/admin/logistica" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><LogisticaManagementPage /></ProtectedRoute>} />
        <Route path="/admin/productos" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><ProductManagementPage /></ProtectedRoute>} />
        <Route path="/admin/neveras" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><FridgeManagementPage /></ProtectedRoute>} />
        <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={['Super_Admin', 'Admin']}><GlobalAccountsPage /></ProtectedRoute>} />

        {/* Rutas Específicas de Rol */}
        <Route path="/frigorifico/dashboard" element={<ProtectedRoute allowedRoles={['Frigorifico']}><FrigorificoPage /></ProtectedRoute>} />
        <Route path="/logistica/dashboard" element={<ProtectedRoute allowedRoles={['Logistica']}><LogisticaPage /></ProtectedRoute>} />
        <Route path="/store/inventory" element={<ProtectedRoute allowedRoles={['Tienda']}><TiendaDashboardPage /></ProtectedRoute>} />

        {/* Fallback Route */}
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </RootLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}