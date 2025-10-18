import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#1a1a1a', /* Gris muy oscuro casi negro */
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Mensaje de bienvenida personalizado usando el hook useUser (equivalente a useAuth) */}
      <h1 style={{ color: '#e57373' }}>Hola {user?.name || 'Usuario'}, estás en el Dashboard Protegido</h1>

      {user && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#2a2a2a', /* Tono rojo carne */
          borderRadius: '8px',
          border: '1px solid #444'
        }}>
          <h2 style={{ color: '#e57373' }}>Información del Usuario</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Rol:</strong> {user.role}</p>
          {user.name && <p><strong>Nombre:</strong> {user.name}</p>}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={logout}
          className="btn btn-danger"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
