import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SurtidoProvider } from './contexts/SurtidoContext';
import RootLayout from './layouts/RootLayout';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import FridgeManagementPage from './pages/admin/FridgeManagementPage';
import GlobalAccountsPage from './pages/admin/GlobalAccountsPage';
import FrigorificoPage from './pages/frigorifico/FrigorificoPage';
import FrigorificoLogisticaPage from './pages/frigorifico/LogisticaPage';
import FrigorificoProductosPage from './pages/frigorifico/ProductosPage';
import FrigorificoCuentasPage from './pages/frigorifico/CuentasPage';
import LogisticaPage from './pages/logistica/LogisticaPage';
import LogisticaGestionPage from './pages/logistica/LogisticaGestionPage';
import LogisticaInventarioPage from './pages/logistica/LogisticaInventarioPage';
import LogisticaFinanzasPage from './pages/logistica/LogisticaFinanzasPage';
import TiendaDashboardPage from './pages/tienda/TiendaDashboardPage';
import TiendaInventarioPage from './pages/tienda/TiendaInventarioPage';
import CuentasTiendaPage from './pages/tienda/CuentasTiendaPage';
import HistorialTiendaPage from './pages/tienda/HistorialTiendaPage';
import TrazabilidadEmpaquePage from './pages/trazabilidad/TrazabilidadEmpaquePage';
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
                <Route path="logistica" element={<LogisticaInventarioPage />} />
                <Route path="productos" element={<FrigorificoProductosPage />} />
                <Route path="neveras" element={<FridgeManagementPage />} />
                <Route path="accounts" element={<GlobalAccountsPage />} />
                <Route path="cuentas-tiendas" element={<CuentasTiendaPage />} />
                <Route path="historial-tienda" element={<HistorialTiendaPage />} />
                <Route path="finanzas-logistica" element={<LogisticaFinanzasPage />} />
              </Routes>
            </RootLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Frigorífico - Solo frigorifico, logistica, admin, superadmin */}
      <Route
        path="/frigorifico/*"
        element={
          <ProtectedRoute allowedRoles={['frigorifico', 'logistica', 'admin', 'superadmin']}>
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
        path="/logistica/*"
        element={
          <ProtectedRoute allowedRoles={['logistica']}>
            <RootLayout>
              <Routes>
                <Route index element={<LogisticaPage />} />
                <Route path="gestion" element={<LogisticaGestionPage />} />
                <Route path="inventario" element={<LogisticaInventarioPage />} />
                <Route path="finanzas" element={<LogisticaFinanzasPage />} />
                <Route path="cuentas-tiendas" element={<CuentasTiendaPage />} />
                <Route path="historial-tienda" element={<HistorialTiendaPage />} />
              </Routes>
            </RootLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Tienda - Solo tienda */}
      <Route
        path="/tienda/*"
        element={
          <ProtectedRoute allowedRoles={['tienda']}>
            <RootLayout>
              <Routes>
                <Route index element={<TiendaDashboardPage />} />
                <Route path="inventario" element={<TiendaInventarioPage />} />
                <Route path="cuentas" element={<CuentasTiendaPage />} />
                <Route path="historial" element={<HistorialTiendaPage />} />
              </Routes>
            </RootLayout>
          </ProtectedRoute>
        }
      />

      {/* Trazabilidad de empaques - accesible por todos los roles */}
      <Route
        path="/trazabilidad"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'frigorifico', 'logistica', 'tienda']}>
            <RootLayout>
              <TrazabilidadEmpaquePage />
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <SurtidoProvider>
          <Router>
            <AppRouter />
          </Router>
        </SurtidoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}