import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css'; // Estilos CSS para el header

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>Mi App con JWT</h1>
        <div>
          {!isAuthenticated ? (
            // Mostrar botón de Registro cuando no está autenticado
            <button
              onClick={() => navigate('/sign-up')}
              className="sign-in-button"
            >
              Registro
            </button>
          ) : (
            // Mostrar UserButton (menú de perfil y logout) cuando está autenticado (equivalente a SignedIn)
            <div className="user-info">
              <span className="welcome-text">Bienvenido, {user?.name || user?.email}</span>
              <span className="user-role">Rol: {user?.role}</span>
              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
