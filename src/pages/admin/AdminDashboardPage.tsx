import React from 'react';
import SummaryCard from '../../components/SummaryCard';
import './AdminDashboardPage.css';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de Administración</h1>
        <p>Bienvenido al panel de administración del sistema.</p>
      </header>

      <section className="dashboard-summary">
        <SummaryCard
          title="Tiendas Registradas"
          value="12"
          description="Total de tiendas activas en el sistema."
        />
        <SummaryCard
          title="Neveras Activas"
          value="25"
          description="Neveras actualmente en operación."
        />
        <SummaryCard
          title="Paquetes en Tránsito"
          value="8"
          description="Productos en ruta de entrega."
        />
      </section>
    </div>
  );
};

export default AdminDashboardPage;