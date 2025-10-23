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

  if (isLoading) {
    return <div>Verifying authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.map(role => role.toLowerCase()).includes(user.role.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;