import React from 'react';
import './ManagementPage.css';

// Mock data based on the seed file
const mockStores = [
    { id: 1, name: 'tienda el tesoro', address: 'calle 24 15 59', cityId: 1, userId: 1 },
    { id: 2, name: 'tienda las delicias', address: 'cra 356 23', cityId: 1, userId: 2 },
    { id: 3, name: 'el bolivar', address: 'cll 34 56', cityId: 1, userId: 3 },
];

const StoreManagementPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Tiendas</h1>
        <p>Administrar todas las tiendas del sistema.</p>
        <button className="button button-primary">Añadir Tienda</button>
      </header>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>ID Ciudad</th>
              <th>ID Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockStores.map((store) => (
              <tr key={store.id}>
                <td>{store.id}</td>
                <td>{store.name}</td>
                <td>{store.address}</td>
                <td>{store.cityId}</td>
                <td>{store.userId}</td>
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

export default StoreManagementPage;