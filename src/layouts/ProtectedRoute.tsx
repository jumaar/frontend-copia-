import React, { useContext } from 'react';
import { Navigate, useLocation} from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth) {
    return <div>Loading...</div>;
  }

  const { isAuthenticated, user, isLoading } = auth;

  // Si está cargando la verificación de sesión, mostrar un indicador de carga
 if (isLoading) {
    return <div>Verifying authentication...</div>;
  }

  // Si no está autenticado después de completar la verificación, redirigir al login
 if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Si está autenticado pero no tiene un rol válido, redirigir al acceso no autorizado
  if (!user || !allowedRoles.map(role => role.toLowerCase()).includes(user.role.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;