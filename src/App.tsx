import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SurtidoProvider } from './apps/logistica/contexts/SurtidoContext';
import SignInPage from './shared/public/SignInPage';
import SignUpPage from './shared/public/SignUpPage';
import UnauthorizedPage from './shared/public/UnauthorizedPage';
import RootLayout from './shared/layouts/RootLayout';
import ProtectedRoute from './shared/public/ProtectedRoute';
import { getDashboardPath } from './shared/config/roles';

const AdminApp = React.lazy(() => import('./apps/admin/AdminApp'));
const SuperAdminApp = React.lazy(() => import('./apps/superadmin/SuperAdminApp'));
const LogisticaApp = React.lazy(() => import('./apps/logistica/LogisticaApp'));
const FrigorificoApp = React.lazy(() => import('./apps/frigorifico/FrigorificoApp'));
const TiendaApp = React.lazy(() => import('./apps/tienda/TiendaApp'));
const TrazabilidadEmpaquePage = React.lazy(() => import('./shared/components/TrazabilidadEmpaque/TrazabilidadEmpaquePage'));

const LoadingFallback = () => (
  <div className="loading-overlay">
    <div>Cargando...</div>
  </div>
);


const AppContent: React.FC = () => {
  const auth = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminApp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminApp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/frigorifico/*"
          element={
            <ProtectedRoute allowedRoles={['frigorifico', 'logistica', 'admin', 'superadmin']}>
              <FrigorificoApp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/logistica/*"
          element={
            <ProtectedRoute allowedRoles={['logistica']}>
              <LogisticaApp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tienda/*"
          element={
            <ProtectedRoute allowedRoles={['tienda']}>
              <TiendaApp />
            </ProtectedRoute>
          }
        />

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
    </Suspense>
  );
};

const AppRouter: React.FC = () => {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="loading-overlay">
        <div>Cargando...</div>
      </div>
    );
  }

  return <AppContent />;
};

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
