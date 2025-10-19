import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Acceso Denegado</h1>
      <p>No tienes permiso para ver esta página.</p>
      <Link to="/dashboard">Volver al Dashboard</Link>
    </div>
  );
};

export default UnauthorizedPage;