import React, { useState, useEffect } from 'react';
import { getLogisticaSurtir } from '../../../../services/api';
import '../../../../shared/scoped/admin-superadmin-logistica/CreateTokenModal/CreateTokenModal.css';
import './ParametrosSurtirModal.css';

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

interface ParametrosSurtirModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (idCiudades: number[], diasExcluir: number) => void;
  idNevera: number;
}

const ParametrosSurtirModal: React.FC<ParametrosSurtirModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  idNevera,
}) => {
  const [neverasData, setNeverasData] = useState<LogisticaSurtirResponse | null>(null);
  const [selectedCities, setSelectedCities] = useState<Set<number>>(new Set());
  const [diasExcluir, setDiasExcluir] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedCities(new Set());
      setDiasExcluir(1);
      setError(null);
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
        setError("Error al cargar los datos. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Extraer lista única de ciudades
  const ciudadesMap = new Map<number, { nombre: string; neveras: string[]; count: number }>();
  neverasData?.neveras_activas.forEach((nevera) => {
    if (!ciudadesMap.has(nevera.id_ciudad)) {
      ciudadesMap.set(nevera.id_ciudad, {
        nombre: nevera.ciudad || 'Sin Ciudad',
        neveras: [],
        count: 0,
      });
    }
    const entry = ciudadesMap.get(nevera.id_ciudad)!;
    entry.neveras.push(nevera.nombre_tienda);
    entry.count++;
  });
  const ciudadesUnicas = Array.from(ciudadesMap.entries()).sort((a, b) =>
    a[1].nombre.localeCompare(b[1].nombre)
  );

  const handleCityToggle = (idCiudad: number) => {
    const newSelected = new Set(selectedCities);
    if (newSelected.has(idCiudad)) {
      newSelected.delete(idCiudad);
    } else {
      newSelected.add(idCiudad);
    }
    setSelectedCities(newSelected);
    setError(null);
  };

  const handleSelectAll = () => {
    const allCityIds = new Set(ciudadesUnicas.map(([id]) => id));
    setSelectedCities(allCityIds);
    setError(null);
  };

  const handleDeselectAll = () => {
    setSelectedCities(new Set());
    setError(null);
  };

  const handleConfirm = () => {
    if (selectedCities.size === 0) {
      setError('Selecciona al menos una ciudad para continuar.');
      return;
    }
    onConfirm(Array.from(selectedCities), diasExcluir);
  };

  if (!isOpen) {
    return null;
  }

  const totalNeverasSeleccionadas = neverasData?.neveras_activas.filter(
    (n) => selectedCities.has(n.id_ciudad)
  ).length || 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content parametros-surtir-modal modal-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>Parámetros de Surtido</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </header>

        <div className="modal-body modal-body-scrollable">
          {loading ? (
            <div className="modal-loading">
              Cargando ciudades disponibles...
            </div>
          ) : error ? (
            <div className="modal-inline-error">
              {error}
            </div>
          ) : neverasData ? (
            <>
              <div className="modal-instructions">
                <p>
                  <strong>Nevera #{idNevera}</strong> — Selecciona las ciudades para el surtido:
                </p>
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

              {/* Selección de ciudades */}
              <div className="role-selection-list">
                {ciudadesUnicas.map(([idCiudad, data]) => {
                  const isSelected = selectedCities.has(idCiudad);
                  return (
                    <div
                      key={idCiudad}
                      className="role-selection-item"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-hover-bg)' : 'var(--color-card-bg)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleCityToggle(idCiudad)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCityToggle(idCiudad)}
                          style={{ marginRight: '1rem', accentColor: 'var(--color-primary-start)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div className="role-name">
                            {data.nombre} ({data.count} neveras)
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                            {data.neveras.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Días a excluir */}
              <div
              className="dias-excluir-section"
            >
              <label>
                Días a excluir:
                </label>
<div className="dias-excluir-row">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={diasExcluir}
                  onChange={(e) => setDiasExcluir(Math.max(0, parseInt(e.target.value) || 0))}
                  className="dias-input"
                />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    día(s) — Excluir neveras surtidas recientemente
                  </span>
                </div>
                <p className="dias-hint">
                  0 = incluir todas las neveras, incluso las surtidas hoy.
                  1 = excluir neveras surtidas en las últimas 24h (recomendado).
                </p>
              </div>
            </>
          ) : (
            <p>No se encontraron datos para mostrar.</p>
          )}
        </div>

        {selectedCities.size > 0 && (
          <div className="resumen-panel">
            <strong>Resumen:</strong> Surtir nevera #{idNevera} —{' '}
            {selectedCities.size} ciudad(es) seleccionada(s), {totalNeverasSeleccionadas} nevera(s) (días excluir: {diasExcluir})
          </div>
        )}

        <footer className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleConfirm}
            disabled={loading || selectedCities.size === 0}
          >
            {loading ? 'Cargando...' : 'Confirmar'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ParametrosSurtirModal;
