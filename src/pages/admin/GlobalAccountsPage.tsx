import React from 'react';
import SummaryCard from '../../components/SummaryCard';
import './ManagementPage.css'; // Reusing styles for consistency
import './GlobalAccountsPage.css';

// Mock data based on the seed file
const mockTransactions = [
  { id: 1, type: 'Costo Frigorífico', amount: -525, user: 'evaristo', status: 'Consolidado', date: '2025-09-17' },
  { id: 4, type: 'Pago Realizado', amount: -981, user: 'evaristo', status: 'Pagado', date: '2025-09-17' },
  { id: 5, type: 'Pago Recibido', amount: 981, user: 'juan', status: 'Pagado', date: '2025-09-17' },
  { id: 6, type: 'Venta', amount: 100, user: 'oscar', status: 'Consolidado', date: '2025-09-17' },
  { id: 10, type: 'Pago Realizado', amount: -350, user: 'oscar', status: 'Pagado', date: '2025-09-17' },
  { id: 11, type: 'Pago Recibido', amount: 350, user: 'emanuel', status: 'Pagado', date: '2025-09-17' },
];

const GlobalAccountsPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="dashboard-header">
        <h1>Cuentas Globales</h1>
        <p>Visión general de todas las transacciones financieras del sistema.</p>
      </header>

      <section className="dashboard-summary">
        <SummaryCard title="Ingresos Totales" value="$1,431" description="Suma de todos los pagos recibidos" />
        <SummaryCard title="Egresos Totales" value="-$1,856" description="Suma de todos los pagos y costos" />
        <SummaryCard title="Balance Neto" value="-$425" description="Diferencia entre ingresos y egresos" />
      </section>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID Transacción</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Usuario Afectado</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.type}</td>
                <td className={tx.amount > 0 ? 'amount-positive' : 'amount-negative'}>
                  ${tx.amount.toLocaleString()}
                </td>
                <td>{tx.user}</td>
                <td>{tx.date}</td>
                <td>{tx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlobalAccountsPage;