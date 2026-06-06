import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import HeaderSidebarToggle from './HeaderSidebarToggle';
import HeaderUserMenu from './HeaderUserMenu';
import './Header.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <HeaderSidebarToggle onToggle={onToggleSidebar} />
          {pageTitle && <h2 className="header-page-title">{pageTitle}</h2>}
        </div>
        <div className="header-right">
          {isAuthenticated ? (
            <HeaderUserMenu
              userName={user?.name?.split(' ')[0] || ''}
              onLogout={logout}
            />
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

export type { HeaderProps };
export default Header;
