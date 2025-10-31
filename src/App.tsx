import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RootLayout from './layouts/RootLayout';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import StoreManagementPage from './pages/admin/StoreManagementPage';
import FrigorificoManagementPage from './pages/admin/FrigorificoManagementPage';
import LogisticaManagementPage from './pages/admin/LogisticaManagementPage';
import FridgeManagementPage from './pages/admin/FridgeManagementPage';
import GlobalAccountsPage from './pages/admin/GlobalAccountsPage';
import FrigorificoPage from './pages/frigorifico/FrigorificoPage';
import FrigorificoLogisticaPage from './pages/frigorifico/LogisticaPage';
import FrigorificoProductosPage from './pages/frigorifico/ProductosPage';
import FrigorificoCuentasPage from './pages/frigorifico/CuentasPage';
import LogisticaPage from './pages/logistica/LogisticaPage';
import TiendaDashboardPage from './pages/tienda/TiendaDashboardPage';
import ProtectedRoute from './layouts/ProtectedRoute';

export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/dashboard';
    case 'frigorifico':
      return '/frigorifico';
    case 'logistica':
      return '/logistica';
    case 'tienda':
      return '/tienda';
    default:
      return '/sign-in';
  }
};

const AppContent: React.FC = () => {
  const auth = useAuth();

  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Rutas de Admin - Solo superadmin y admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <RootLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="tiendas" element={<StoreManagementPage />} />
                <Route path="frigorificos" element={<FrigorificoManagementPage />} />
                <Route path="logistica" element={<LogisticaManagementPage />} />
                <Route path="productos" element={<FrigorificoProductosPage />} />
                <Route path="neveras" element={<FridgeManagementPage />} />
                <Route path="accounts" element={<GlobalAccountsPage />} />
              </Routes>
            </RootLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Frigorífico - Solo frigorifico */}
      <Route
        path="/frigorifico/*"
        element={
          <ProtectedRoute allowedRoles={['frigorifico']}>
            <RootLayout>
              <Routes>
                <Route index element={<FrigorificoPage />} />
                <Route path="logistica" element={<FrigorificoLogisticaPage />} />
                <Route path="productos" element={<FrigorificoProductosPage />} />
                <Route path="cuentas" element={<FrigorificoCuentasPage />} />
              </Routes>
            </RootLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Logística - Solo logistica */}
      <Route
        path="/logistica"
        element={
          <ProtectedRoute allowedRoles={['logistica']}>
            <RootLayout>
              <LogisticaPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Tienda - Solo tienda */}
      <Route
        path="/tienda"
        element={
          <ProtectedRoute allowedRoles={['tienda']}>
            <RootLayout>
              <TiendaDashboardPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          auth.isAuthenticated && auth.user ? (
            <Navigate to={getDashboardPath(auth.user.role)} replace />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />

      {/* Ruta catch-all para 404 - redirige al dashboard o login */}
      <Route
        path="*"
        element={
          auth.isAuthenticated && auth.user ? (
            <Navigate to={getDashboardPath(auth.user.role)} replace />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      
    </Routes>
  );
};

const AppRouter: React.FC = () => {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="loading-overlay">
        <div>Loading...</div>
      </div>
    );
  }

  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}