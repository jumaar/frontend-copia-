import React, { useState, useEffect } from 'react';
import { getLogisticaSurtir, distribuirNeveras } from '../../../services/api';
import '../CreateTokenModal/CreateTokenModal.css';
import './DistribuirInventarioModal.css';

interface Nevera {
  id_nevera: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  id_ciudad: number;
}

interface LogisticaSurtirResponse {
  neveras_activas: Nevera[];
  total_neveras: number;
}

interface DistribuirInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistribuir: () => void;
  lastDistributionTime?: string | null;
}

const DistribuirInventarioModal: React.FC<DistribuirInventarioModalProps> = ({
  isOpen,
  onClose,
  onDistribuir,
  lastDistributionTime
}) => {
  const [neverasData, setNeverasData] = useState<LogisticaSurtirResponse | null>(null);
  const [selectedCities, setSelectedCities] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: LogisticaSurtirResponse = await getLogisticaSurtir();
      setNeverasData(response);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        setError("Sesión expirada. Redirigiendo al login...");
        window.location.href = "/login";
      } else {
        setError(
          "Error al cargar los datos. Inténtalo de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // Agrupar neveras por ciudad
  const neverasPorCiudad: Record<string, { neveras: Nevera[], id_ciudad: number }> = {};
  neverasData?.neveras_activas.forEach((nevera) => {
    const ciudad = nevera.ciudad || "Sin Ciudad";
    if (!neverasPorCiudad[ciudad]) {
      neverasPorCiudad[ciudad] = { neveras: [], id_ciudad: nevera.id_ciudad };
    }
    neverasPorCiudad[ciudad].neveras.push(nevera);
  });

  const ciudadesOrdenadas = Object.keys(neverasPorCiudad).sort();

  const handleCityToggle = (id_ciudad: number) => {
    const newSelected = new Set(selectedCities);
    if (newSelected.has(id_ciudad)) {
      newSelected.delete(id_ciudad);
    } else {
      newSelected.add(id_ciudad);
    }
    setSelectedCities(newSelected);
  };

  const handleSelectAll = () => {
    const allCityIds = new Set(
      Object.values(neverasPorCiudad).map(item => item.id_ciudad)
    );
    setSelectedCities(allCityIds);
  };

  const handleDeselectAll = () => {
    setSelectedCities(new Set());
  };

  const handleDistribuir = async () => {
    if (selectedCities.size === 0) {
      setError("Selecciona al menos una ciudad para distribuir.");
      return;
    }

    try {
      setDistributing(true);
      setError(null);
      
      const cityIds = Array.from(selectedCities);
      await distribuirNeveras(cityIds);
      
      alert("✅ Distribución realizada exitosamente");
      onDistribuir();
      onClose();
    } catch (err: any) {
      console.error('Error al distribuir:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Error al realizar la distribución. Inténtalo de nuevo.");
      }
    } finally {
      setDistributing(false);
    }
  };

  const totalNeverasSeleccionadas = neverasData?.neveras_activas.filter(
    nevera => selectedCities.has(nevera.id_ciudad)
  ).length || 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content distribuir-modal modal-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>Distribuir Inventario por Ciudades</h2>
          <button onClick={onClose} className="modal-close-button" disabled={distributing}>&times;</button>
        </header>

        <div className="modal-body modal-body-scrollable">
          {loading ? (
            <div className="modal-loading">
              Cargando datos de distribución...
            </div>
          ) : error ? (
            <div className="modal-inline-error">
              {error}
            </div>
          ) : neverasData ? (
            <>
              <div className="modal-instructions">
                <p>Selecciona las ciudades para distribuir el inventario:</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="button button-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    Seleccionar Todas
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="button button-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    Deseleccionar Todas
                  </button>
                </div>
              </div>

              <div className="role-selection-list">
                {ciudadesOrdenadas.map((ciudad) => {
                  const { neveras, id_ciudad } = neverasPorCiudad[ciudad];
                  const isSelected = selectedCities.has(id_ciudad);

                  return (
                    <div
                      key={ciudad}
                      className="role-selection-item"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-hover-bg)' : 'var(--color-card-bg)'
                      }}
                    >
<div className="ciudad-row">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCityToggle(id_ciudad)}
                        disabled={distributing}
                      />
                        <div style={{ flex: 1 }}>
                          <div className="role-name">
                            {ciudad} ({neveras.length} neveras)
                          </div>
                          <div className="ciudad-detail">
                            {neveras.map(nevera => `${nevera.nombre_tienda}`).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCities.size > 0 && (
                <div className="distribucion-resumen">
                  <strong>
                    Total de neveras seleccionadas: {totalNeverasSeleccionadas}
                  </strong>
                  <br />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Ciudades seleccionadas: {selectedCities.size}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p>No se encontraron datos para mostrar.</p>
          )}
        </div>

        {lastDistributionTime && (
          <div className="distribucion-timestamp">
            Última distribución: {new Date(lastDistributionTime).toLocaleString('es-CO')}
          </div>
        )}

        <footer className="modal-footer">
          <button 
            type="button" 
            className="button button-secondary" 
            onClick={onClose} 
            disabled={distributing}
          >
            Cerrar
          </button>
          <button 
            type="button" 
            className="button button-primary" 
            onClick={handleDistribuir}
            disabled={distributing || selectedCities.size === 0}
          >
            {distributing ? 'Distribuyendo...' : 'Distribuir'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DistribuirInventarioModal;