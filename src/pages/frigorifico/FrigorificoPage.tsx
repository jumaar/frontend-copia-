import React, { useState, useEffect } from 'react';
import SummaryCard from '../../components/SummaryCard';
import ProductionHierarchy from '../../components/ProductionHierarchy';
import type { ProductionItem } from '../../components/ProductionHierarchy';
import StationModal from '../../components/StationModal';
import type { StationData } from '../../components/StationModal';
import ScaleModal from '../../components/ScaleModal';
import { getFrigorificoData, createFrigorifico, updateFrigorifico, createEstacion, deleteEstacion, deleteFrigorifico } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './FrigorificoPage.css';

interface Frigorifico {
  id_frigorifico: number;
  nombre_frigorifico: string;
  direccion: string;
  ciudad: {
    id_ciudad: number;
    nombre_ciudad: string;
    departamento: {
      id__departamento: number;
      nombre_departamento: string;
    };
  };
  estaciones: Array<{
    id_estacion: number;
    clave_vinculacion: string;
  }>;
}

interface FrigorificoData {
  frigorificos: Frigorifico[];
  ciudades_disponibles: Array<{
    id_ciudad: number;
    nombre_ciudad: string;
  }>;
  lotes_en_stock: {
    cantidad: number;
    peso_total_g: number;
  };
  lotes_despachados: {
    cantidad: number;
    peso_total_g: number;
  };
  total_transacciones: number;
  inventario_por_producto: Array<{
    id_producto: number;
    nombre_producto: string;
    peso_nominal_g: number;
    cantidad: number;
    ultima_fecha: string;
    epc_id_ultimo: string;
  }>;
}


const FrigorificoPage: React.FC = () => {
  const { user } = useAuth();
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([
    {
      id: 'loading',
      type: 'station',
      name: 'Cargando frigoríficos...',
      details: { address: '', city: '' },
      children: []
    }
  ]);
  const [isStationModalOpen, setStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<ProductionItem | null>(null);
  const [isScaleModalOpen, setScaleModalOpen] = useState(false);
  const [stationForScale, setStationForScale] = useState<ProductionItem | null>(null);
  const [frigorificoData, setFrigorificoData] = useState<FrigorificoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          const data = await getFrigorificoData(user.id);
          setFrigorificoData(data);
          // Convertir datos reales a formato ProductionItem
          if (data?.frigorificos && data.frigorificos.length > 0) {
            const realProductionItems: ProductionItem[] = data.frigorificos.map((frigorifico: Frigorifico) => ({
              id: frigorifico.id_frigorifico.toString(),
              type: 'station',
              name: frigorifico.nombre_frigorifico,
              details: {
                address: frigorifico.direccion,
                city: frigorifico.ciudad.nombre_ciudad
              },
              children: frigorifico.estaciones.map((estacion: any) => ({
                id: estacion.id_estacion.toString(),
                type: 'scale' as const,
                name: `Estación ${estacion.id_estacion}`,
                details: { key: estacion.clave_vinculacion }
              }))
            }));
            setProductionItems(realProductionItems);
          } else {
            // Si no hay frigoríficos, mostrar array vacío
            setProductionItems([]);
          }
        } catch (error) {
          console.error('Error fetching frigorifico data:', error);
          setProductionItems([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user?.id, refreshTrigger]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedInventory = React.useMemo(() => {
    if (!frigorificoData?.inventario_por_producto) return [];
    let sortableItems = [...frigorificoData.inventario_por_producto];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [frigorificoData?.inventario_por_producto, sortConfig]);

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

  const handleSaveStation = async (stationData: StationData) => {
    try {
      // Find the selected city ID
      const selectedCity = frigorificoData?.ciudades_disponibles.find(
        ciudad => ciudad.nombre_ciudad === stationData.city
      );

      if (!selectedCity) {
        console.error('Ciudad no encontrada');
        return;
      }

      if (editingStation) {
        // Update existing station
        await updateFrigorifico(user!.id, {
          id_frigorifico: parseInt(editingStation.id.toString()),
          nombre_frigorifico: stationData.name,
          direccion: stationData.address,
          id_ciudad: selectedCity.id_ciudad
        });
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } else {
        // Create new station
        await createFrigorifico(user!.id, {
          nombre_frigorifico: stationData.name,
          direccion: stationData.address,
          id_ciudad: selectedCity.id_ciudad
        });
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error saving station:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // TODO: Show user-friendly error message
    }
  };

  const handleOpenScaleModal = (station: ProductionItem) => {
    setStationForScale(station);
    setScaleModalOpen(true);
  };

  const handleCloseScaleModal = async (newScale?: { id: string; key: string }) => {
    if (newScale && stationForScale) {
      try {
        await createEstacion(stationForScale.id.toString());
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error creating scale:', error);
      }
    }
    setScaleModalOpen(false);
    setStationForScale(null);
  };

  const handleDeleteScale = async (scale: ProductionItem) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la estación "${scale.name}"?`)) {
      try {
        await deleteEstacion(parseInt(scale.id.toString()));
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting scale:', error);
      }
    }
  };

  const handleDeleteStation = async (station: ProductionItem) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el frigorífico "${station.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteFrigorifico(user!.id, parseInt(station.id.toString()));
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting station:', error);
      }
    }
  };

  return (
    <>
      <div className="frigorifico-page">
        <header className="dashboard-header">
          <h1>Portal del Frigorífico</h1>
          <p>Registro y gestión de lotes de producción.</p>
        </header>

        <section className="dashboard-summary">
          <SummaryCard
            title="Lotes en Stock"
            value={loading ? "Cargando..." : frigorificoData?.lotes_en_stock.cantidad.toString() || "0"}
            description={`Peso total: ${loading ? "Cargando..." : ((frigorificoData?.lotes_en_stock.peso_total_g || 0) / 1000).toFixed(2)} kg`}
          />
          <SummaryCard
            title="Lotes Despachados Hoy"
            value={loading ? "Cargando..." : frigorificoData?.lotes_despachados.cantidad.toString() || "0"}
            description={`Peso total: ${loading ? "Cargando..." : ((frigorificoData?.lotes_despachados.peso_total_g || 0) / 1000).toFixed(2)} kg`}
          />
          <SummaryCard
            title="Saldo Total ($)"
            value={loading ? "Cargando..." : `$${frigorificoData?.total_transacciones.toLocaleString('es-CO') || "0"}`}
            description="Saldo a favor del frigorífico"
          />
        </section>

        <section className="production-section card">
          <div className="card-header">
            <h2>Gestión de Producción</h2>
            <button className="button button-primary" onClick={handleOpenCreateStationModal}>
              Crear Frigorífico
            </button>
          </div>
          <ProductionHierarchy
            items={productionItems}
            onEditStation={handleOpenEditStationModal}
            onCreateScale={handleOpenScaleModal}
            onDeleteScale={handleDeleteScale}
            onDeleteStation={handleDeleteStation}
            userRole={user?.role}
          />
        </section>

        <section className="lots-section card">
          <h2>ÚLTIMOS LOTES CREADOS EN STOCK</h2>
          {loading ? (
            <p>Cargando inventario...</p>
          ) : (
            <table className="lots-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('epc_id_ultimo')} style={{ cursor: 'pointer' }}>
                    ID Lote {sortConfig?.key === 'epc_id_ultimo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('nombre_producto')} style={{ cursor: 'pointer' }}>
                    Nombre Producto {sortConfig?.key === 'nombre_producto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('id_producto')} style={{ cursor: 'pointer' }}>
                    ID Producto {sortConfig?.key === 'id_producto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('cantidad')} style={{ cursor: 'pointer' }}>
                    Cantidad {sortConfig?.key === 'cantidad' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('ultima_fecha')} style={{ cursor: 'pointer' }}>
                    Fecha {sortConfig?.key === 'ultima_fecha' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sortedInventory.map((item) => (
                  <tr key={item.epc_id_ultimo}>
                    <td>{item.epc_id_ultimo}</td>
                    <td>{item.nombre_producto}</td>
                    <td>{item.id_producto}</td>
                    <td>{item.cantidad}</td>
                    <td>{new Date(item.ultima_fecha).toLocaleDateString('es-CO')}</td>
                    <td>
                      <span className="status-chip status-en-stock">
                        En Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
        availableCities={frigorificoData?.ciudades_disponibles || []}
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