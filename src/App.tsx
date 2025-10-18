import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RootLayout from './layouts/RootLayout';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './layouts/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <RootLayout>
          <Routes>
            {/* Ruta raíz protegida - redirige a /dashboard si autenticado, sino a /sign-in */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Rutas públicas */}
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            {/* Ruta privada protegida */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </RootLayout>
      </Router>
    </AuthProvider>
  );
}