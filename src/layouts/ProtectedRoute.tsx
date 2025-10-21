import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth) {
    // This can happen if the context is not yet available.
    // You might want to show a loading spinner here.
    return <div>Loading...</div>;
  }

  const { isAuthenticated, user, isLoading } = auth;

  if (isLoading) {
    // Show a loading indicator while checking auth status
    return <div>Verifying authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /sign-in page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they log in.
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.map(role => role.toLowerCase()).includes(user.role.toLowerCase())) {
    // If the user is authenticated but doesn't have the required role,
    // redirect them to an unauthorized page.
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;