import React from 'react';
import SummaryCard from '../../components/SummaryCard';
import './FrigorificoPage.css';

// Mock data for demonstration
const mockLots = [
  { id: 'LOTE-001', product: 'Lomo de Cerdo', quantity: 50, date: '2023-10-26', status: 'En Stock' },
  { id: 'LOTE-002', product: 'Costilla de Cerdo', quantity: 100, date: '2023-10-26', status: 'En Stock' },
  { id: 'LOTE-003', product: 'Chorizo', quantity: 200, date: '2023-10-25', status: 'Despachado' },
  { id: 'LOTE-004', product: 'Panceta', quantity: 75, date: '2023-10-24', status: 'Despachado' },
];

const FrigorificoPage: React.FC = () => {
  return (
    <div className="frigorifico-page">
      <header className="dashboard-header">
        <h1>Portal del Frigorífico</h1>
        <p>Registro y gestión de lotes de producción.</p>
      </header>

      <section className="dashboard-summary">
        <SummaryCard title="Lotes en Stock" value="2" description="Listos para despacho" />
        <SummaryCard title="Lotes Despachados Hoy" value="5" description="Entregados a logística" />
        <SummaryCard title="Producción Total (kg)" value="150 kg" description="Peso total de lotes en stock" />
      </section>

      <section className="lots-section card">
        <h2>Últimos Lotes Creados</h2>
        <table className="lots-table">
          <thead>
            <tr>
              <th>ID Lote</th>
              <th>Producto</th>
              <th>Cantidad (unidades)</th>
              <th>Fecha de Empaque</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockLots.map((lot).map((lot) => (
              <tr key={lot.id}>
                <td>{lot.id}</td>
                <td>{lot.product}</td>
                <td>{lot.quantity}</td>
                <td>{lot.date}</td>
                <td>
                  <span className={`status-chip status-${lot.status.toLowerCase()}`}>
                    {lot.status}
                  </span>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default FrigorificoPage;