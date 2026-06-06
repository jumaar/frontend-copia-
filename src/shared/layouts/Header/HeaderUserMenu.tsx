import React from 'react';

interface HeaderUserMenuProps {
  userName: string;
  onLogout: () => void;
}

const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({ userName, onLogout }) => (
  <div className="user-menu">
    <span className="user-name">{userName}</span>
      <button onClick={onLogout} className="button button-success logout-button">
      Cerrar Sesión
    </button>
  </div>
);

export default HeaderUserMenu;
