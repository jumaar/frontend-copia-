import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <button onClick={onToggleSidebar} className="sidebar-toggle-button">
            {/* Icono de hamburguesa (placeholder) */}
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          {pageTitle && <h2 className="header-page-title">{pageTitle}</h2>}
        </div>
        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu">
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