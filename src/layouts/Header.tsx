import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          {/* Search bar can be added here */}
        </div>
        <div className="header-right">
          {isAuthenticated && user ? (
            <div className="user-menu">
              <span className="user-name">Hola, {user.name || user.email}</span>
              <button onClick={logout} className="button button-secondary">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link to="/sign-in" className="button button-primary">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;