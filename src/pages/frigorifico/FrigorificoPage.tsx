import React, { useState } from 'react';
import SummaryCard from '../../components/SummaryCard';
import ProductionHierarchy from '../../components/ProductionHierarchy';
import type { ProductionItem } from '../../components/ProductionHierarchy';
import StationModal from '../../components/StationModal';
import type { StationData } from '../../components/StationModal';
import ScaleModal from '../../components/ScaleModal';
import './FrigorificoPage.css';

// Mock data for demonstration
const mockLots = [
  { id: 'LOTE-001', product: 'Lomo de Cerdo', quantity: 50, date: '2023-10-26', status: 'En Stock' },
  { id: 'LOTE-002', product: 'Costilla de Cerdo', quantity: 100, date: '2023-10-26', status: 'En Stock' },
  { id: 'LOTE-003', product: 'Chorizo', quantity: 200, date: '2023-10-25', status: 'Despachado' },
  { id: 'LOTE-004', product: 'Panceta', quantity: 75, date: '2023-10-24', status: 'Despachado' },
];

const mockProductionItems: ProductionItem[] = [
  {
    id: 'station-1',
    type: 'station',
    name: 'Frigorífico Principal',
    details: { address: 'Calle Falsa 123', city: 'Springfield' },
    children: [
      { id: 'scale-1-1', type: 'scale', name: 'Báscula 1', details: { key: 'ABC-123' } },
      { id: 'scale-1-2', type: 'scale', name: 'Báscula 2', details: { key: 'DEF-456' } },
    ],
  },
];

const FrigorificoPage: React.FC = () => {
  const [productionItems, setProductionItems] = useState<ProductionItem[]>(mockProductionItems);
  const [isStationModalOpen, setStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<ProductionItem | null>(null);
  const [isScaleModalOpen, setScaleModalOpen] = useState(false);
  const [stationForScale, setStationForScale] = useState<ProductionItem | null>(null);

  const handleOpenCreateStationModal = () => {
    setEditingStation(null);
    setStationModalOpen(true);
  };

  const handleOpenEditStationModal = (station: ProductionItem) => {
    setEditingStation(station);
    setStationModalOpen(true);
  };

  const handleCloseStationModal = () => {
    setStationModalOpen(false);
    setEditingStation(null);
  };

  const handleSaveStation = (stationData: StationData) => {
    if (editingStation) {
      // Update existing station
      const updatedItems = productionItems.map(item =>
        item.id === editingStation.id ? { ...item, name: stationData.name, details: { address: stationData.address, city: stationData.city } } : item
      );
      setProductionItems(updatedItems);
    } else {
      // Create new station
      const newStation: ProductionItem = {
        id: `station-${Date.now()}`,
        type: 'station',
        name: stationData.name,
        details: { address: stationData.address, city: stationData.city },
        children: [],
      };
      setProductionItems([...productionItems, newStation]);
    }
  };

  const handleOpenScaleModal = (station: ProductionItem) => {
    setStationForScale(station);
    setScaleModalOpen(true);
  };

  const handleCloseScaleModal = (newScale?: { id: string; key: string }) => {
    if (newScale && stationForScale) {
      const newScaleItem: ProductionItem = {
        id: newScale.id,
        type: 'scale',
        name: `Báscula ${stationForScale.children ? stationForScale.children.length + 1 : 1}`,
        details: { key: newScale.key },
      };

      const updatedItems = productionItems.map(item =>
        item.id === stationForScale.id
          ? { ...item, children: [...(item.children || []), newScaleItem] }
          : item
      );
      setProductionItems(updatedItems);
    }
    setScaleModalOpen(false);
    setStationForScale(null);
  };

  return (
    <>
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

        <section className="production-section card">
          <div className="card-header">
            <h2>Gestión de Producción</h2>
            <button className="button button-primary" onClick={handleOpenCreateStationModal}>
              Crear Estación de Producción
            </button>
          </div>
          <ProductionHierarchy
            items={productionItems}
            onEditStation={handleOpenEditStationModal}
            onCreateScale={handleOpenScaleModal}
          />
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
              {mockLots.map((lot) => (
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
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <StationModal
        isOpen={isStationModalOpen}
        onClose={handleCloseStationModal}
        stationData={editingStation ? { 
          id: editingStation.id, 
          name: editingStation.name, 
          address: editingStation.details.address, 
          city: editingStation.details.city 
        } : null}
        onSave={handleSaveStation}
      />
      <ScaleModal
        isOpen={isScaleModalOpen}
        onClose={handleCloseScaleModal}
        stationName={stationForScale ? stationForScale.name : ''}
      />
    </>
  );
};

export default FrigorificoPage;