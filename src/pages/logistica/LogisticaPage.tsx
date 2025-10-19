import React from 'react';
import SummaryCard from '../../components/SummaryCard';
import './LogisticaPage.css';

// Mock data for demonstration
const mockShipments = [
  { id: 'XYZ123', destination: 'Tienda El Tesoro', status: 'En Ruta', items: 5 },
  { id: 'ABC456', destination: 'Tienda Las Delicias', status: 'Entregado', items: 8 },
  { id: 'DEF789', destination: 'El Bolivar', status: 'Pendiente', items: 12 },
  { id: 'GHI012', destination: 'Tienda El Tesoro', status: 'En Ruta', items: 3 },
];

const LogisticaPage: React.FC = () => {
  return (
    <div className="logistica-page">
      <header className="dashboard-header">
        <h1>Portal de Logística</h1>
        <p>Gestión y seguimiento de entregas.</p>
      </header>

      <section className="dashboard-summary">
        <SummaryCard title="Entregas en Ruta" value="2" description="Paquetes actualmente en tránsito" />
        <SummaryCard title="Entregas Pendientes" value="1" description="Listas para ser despachadas" />
        <SummaryCard title="Total Items Hoy" value="28" description="Suma de productos en todos los envíos" />
      </section>

      <section className="shipments-section card">
        <h2>Envíos de Hoy</h2>
        <div className="shipments-list">
          {mockShipments.map((shipment) => (
            <div key={shipment.id} className="shipment-item">
              <div className="shipment-info">
                <h4>Destino: {shipment.destination}</h4>
                <p>ID de Envío: {shipment.id} | Items: {shipment.items}</p>
              </div>
              <div className="shipment-status">
                <span className={`status-label status-${shipment.status.toLowerCase()}`}>
                  {shipment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LogisticaPage;