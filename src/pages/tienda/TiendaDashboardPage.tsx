import React from 'react';
import SummaryCard from '../../components/SummaryCard';
import './TiendaDashboardPage.css';

// Mock data for demonstration
const mockInventory = [
  { id: 1, name: 'Lomo de Cerdo', quantity: 15, status: 'En Stock' },
  { id: 2, name: 'Costilla de Cerdo', quantity: 25, status: 'En Stock' },
  { id: 3, name: 'Chorizo', quantity: 5, status: 'Bajo Stock' },
  { id: 4, name: 'Panceta', quantity: 0, status: 'Agotado' },
];

const TiendaDashboardPage: React.FC = () => {
  return (
    <div className="tienda-dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de la Tienda</h1>
        <p>Vista rápida del inventario y estado de la nevera.</p>
      </header>

      <section className="dashboard-summary">
        <SummaryCard title="Productos en Nevera" value="45" description="Unidades totales" />
        <SummaryCard title="Alertas de Stock" value="1" description="Productos con bajo inventario" />
        <SummaryCard title="Temperatura Nevera" value="2.5°C" description="Estado: Normal" />
      </section>

      <section className="inventory-section card">
        <h2>Inventario Actual</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockInventory.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>
                  <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default TiendaDashboardPage;