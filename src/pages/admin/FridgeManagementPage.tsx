import React from 'react';
import './ManagementPage.css';

// Mock data based on the seed file
const mockFridges = [
  { id: 1, storeId: 1, status: 'Activa', version: '0.3', lastConnection: '2025-01-01T00:00:00Z' },
  { id: 2, storeId: 1, status: 'En Inventario', version: '0.3', lastConnection: '2025-01-01T00:00:00Z' },
  { id: 3, storeId: 2, status: 'En Bodega', version: '0.3', lastConnection: '2025-01-01T00:00:00Z' },
];

const FridgeManagementPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Neveras</h1>
        <p>Administrar todas las neveras inteligentes del sistema.</p>
        <button className="button button-primary">Añadir Nevera</button>
      </header>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID Nevera</th>
              <th>ID Tienda</th>
              <th>Estado</th>
              <th>Versión Software</th>
              <th>Última Conexión</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockFridges.map((fridge) => (
              <tr key={fridge.id}>
                <td>{fridge.id}</td>
                <td>{fridge.storeId}</td>
                <td>{fridge.status}</td>
                <td>{fridge.version}</td>
                <td>{new Date(fridge.lastConnection).toLocaleString()}</td>
                <td>
                  <button className="action-button">Editar</button>
                  <button className="action-button">Ver Reportes</button>
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

export default FridgeManagementPage;