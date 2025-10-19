import React from 'react';
import './ManagementPage.css';

// Mock data based on the seed file
const mockProducts = [
  { id: 1, name: 'lomo cerdo', description: 'lomo cerdo', price: 10000, cost: 9500 },
  { id: 2, name: 'lomo cerdo', description: 'lomo cerdo', price: 2500, cost: 2375 },
  { id: 3, name: 'costilla cerdo', description: 'costilla cerdo', price: 2500, cost: 2450 },
  { id: 4, name: 'costilla cerdo', description: 'costilla cerdo', price: 5000, cost: 4900 },
  { id: 5, name: 'costilla cerdo', description: 'costilla cerdo', price: 10000, cost: 9800 },
  { id: 6, name: 'panceta', description: 'panceta', price: 10000, cost: 9500 },
  { id: 7, name: 'chorizo', description: 'de cerdo *3', price: 9000, cost: 8550 },
  { id: 8, name: 'chorizo', description: 'de cerdo *7', price: 19000, cost: 18050 },
];

const ProductManagementPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Productos</h1>
        <p>Administrar el catálogo de productos del sistema.</p>
        <button className="button button-primary">Añadir Producto</button>
      </header>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio Venta (gramo)</th>
              <th>Precio Costo (gramo)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>${product.price.toLocaleString()}</td>
                <td>${product.cost.toLocaleString()}</td>
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

export default ProductManagementPage;