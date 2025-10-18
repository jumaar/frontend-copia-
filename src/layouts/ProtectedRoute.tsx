import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Este componente actúa como un "guardia" para las rutas privadas.
// Verifica el estado de autenticación antes de renderizar el contenido protegido.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // isLoading se asegura de que el estado de autenticación se haya cargado.
  // Mientras se carga, no renderizamos nada para evitar un parpadeo.
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, lo redirigimos a la página de inicio de sesión.
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  // Si el usuario está autenticado, renderizamos el contenido protegido.
  return <>{children}</>;
}
