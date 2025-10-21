import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RootLayout from './layouts/RootLayout';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
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

const getDashboardPath = (role: string): string => {
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

  if (auth.isLoading) {
    return (
      <div className="loading-overlay">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'frigorifico', 'logistica', 'tienda']}>
            <RootLayout isLoading={false}>
              <Routes>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/tiendas" element={<StoreManagementPage />} />
                <Route path="/admin/frigorificos" element={<FrigorificoManagementPage />} />
                <Route path="/admin/logistica" element={<LogisticaManagementPage />} />
                <Route path="/admin/productos" element={<ProductManagementPage />} />
                <Route path="/admin/neveras" element={<FridgeManagementPage />} />
                <Route path="/admin/accounts" element={<GlobalAccountsPage />} />
                <Route path="/frigorifico" element={<FrigorificoPage />} />
                <Route path="/logistica" element={<LogisticaPage />} />
                <Route path="/tienda" element={<TiendaDashboardPage />} />
              </Routes>
            </RootLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          auth?.isAuthenticated && auth.user ? (
            <Navigate to={getDashboardPath(auth.user.role)} replace />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      
      <Route
        path="*"
        element={
          auth?.isAuthenticated && auth.user ? (
            <Navigate to={getDashboardPath(auth.user.role)} replace />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
    </Routes>
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