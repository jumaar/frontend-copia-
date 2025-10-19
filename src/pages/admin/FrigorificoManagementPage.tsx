import React from 'react';
import './ManagementPage.css';

// Mock data based on the seed file
const mockFrigorificos = [
    { id: 1, name: 'tienda el tesoro', address: 'calle 24 15 59', userId: 1 },
    { id: 2, name: 'tienda las delicias', address: 'cra 356 23', userId: 2 },
    { id: 3, name: 'el bolivar', address: 'cll 34 56', userId: 3 },
];

const FrigorificoManagementPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Frigoríficos</h1>
        <p>Administrar todos los frigoríficos del sistema.</p>
        <button className="button button-primary">Añadir Frigorífico</button>
      </header>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>ID Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockFrigorificos.map((frigorifico) => (
              <tr key={frigorifico.id}>
                <td>{frigorifico.id}</td>
                <td>{frigorifico.name}</td>
                <td>{frigorifico.address}</td>
                <td>{frigorifico.userId}</td>
                <td>
                  <button className="action-button">Editar</button>
                  <button className="action-button delete">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FrigorificoManagementPage;