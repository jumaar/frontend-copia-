import React, { useState, useEffect } from 'react';
import SummaryCard from '../../components/SummaryCard';
import { getActiveFridgesCount } from '../../services/api';
import './AdminDashboardPage.css';

const AdminDashboardPage: React.FC = () => {
  const [activeFridgesCount, setActiveFridgesCount] = useState<string>('...');

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await getActiveFridgesCount();
        setActiveFridgesCount(data.count.toString());
      } catch (error) {
        setActiveFridgesCount('Error');
      }
    };

    fetchCount();
  }, []);

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
          value={activeFridgesCount}
          description="Total de neveras actualmente en funcionamiento."
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