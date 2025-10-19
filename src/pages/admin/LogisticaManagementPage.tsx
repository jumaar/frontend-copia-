import React from 'react';
import './ManagementPage.css';

// Mock data based on the seed file
const mockLogisticas = [
    { id: 1, name: 'Rapido y Furioso', plate: 'XYZ123', userId: 4 },
];

const LogisticaManagementPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Logística</h1>
        <p>Administrar todas las empresas de logística del sistema.</p>
        <button className="button button-primary">Añadir Empresa</button>
      </header>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Empresa</th>
              <th>Placa Vehículo</th>
              <th>ID Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockLogisticas.map((logistica) => (
              <tr key={logistica.id}>
                <td>{logistica.id}</td>
                <td>{logistica.name}</td>
                <td>{logistica.plate}</td>
                <td>{logistica.userId}</td>
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

export default LogisticaManagementPage;