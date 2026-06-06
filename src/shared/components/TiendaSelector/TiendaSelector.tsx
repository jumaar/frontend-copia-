import React, { type ReactNode } from 'react';
import './TiendaSelector.css';

interface TiendaSelectorProps {
  title: string;
  busquedaNevera: string;
  onBusquedaChange: (v: string) => void;
  onBuscar: () => void;
  searchLoading: boolean;
  ciudades: Array<{ id_ciudad: number; nombre_ciudad: string; departamento: string }>;
  ciudadSeleccionada: string | null;
  onCiudadSelect: (ciudad: string | null) => void;
  showCiudadMenu: boolean;
  onToggleCiudadMenu: () => void;
  loading: boolean;
  children: ReactNode;
}

const TiendaSelector: React.FC<TiendaSelectorProps> = ({
  title,
  busquedaNevera,
  onBusquedaChange,
  onBuscar,
  searchLoading,
  ciudades,
  ciudadSeleccionada,
  onCiudadSelect,
  showCiudadMenu,
  onToggleCiudadMenu,
  loading,
  children,
}) => {
  return (
    <div className="usuario-selector">
      <div className="selector-container">
        <h3 className="tienda-selector-title">{title}</h3>
        <div className="tienda-selector-body">
          <div className="tienda-selector-search">
            <label className="selector-label">🔍 Buscar por ID de Nevera:</label>
            <div className="tienda-selector-search-row">
              <input
                type="text"
                className="usuario-select tienda-selector-input"
                value={busquedaNevera}
                onChange={e => onBusquedaChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onBuscar(); } }}
                placeholder="Ingresa el ID de la nevera..."
              />
              <button
                className="btn-consultar tienda-selector-buscar-btn"
                onClick={onBuscar}
                disabled={!busquedaNevera.trim() || loading}
              >
                {searchLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
          <div className="tienda-selector-filters">
            <div className="tienda-selector-ciudad">
              <label className="selector-label">1. Filtrar por Ciudad:</label>
              <div className="meses-dropdown" style={{ marginTop: '0.5rem' }}>
                <button
                  className="dropdown-toggle"
                  onClick={onToggleCiudadMenu}
                  disabled={loading}
                >
                  {ciudadSeleccionada
                    ? `${ciudades.find(c => c.nombre_ciudad === ciudadSeleccionada)?.nombre_ciudad || ciudadSeleccionada} - ${ciudades.find(c => c.nombre_ciudad === ciudadSeleccionada)?.departamento || ''}`
                    : <span>Selecciona una ciudad...</span>}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showCiudadMenu && !loading && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">
                      <span className="mes-fecha">Todas las ciudades</span>
                      <button className="btn-consultar" onClick={() => onCiudadSelect(null)}>Seleccionar</button>
                    </div>
                    {ciudades.map(ciudad => (
                      <div key={ciudad.id_ciudad} className="dropdown-item">
                        <span className="mes-fecha">{ciudad.nombre_ciudad} - {ciudad.departamento}</span>
                        <button
                          className={`btn-consultar ${ciudadSeleccionada === ciudad.nombre_ciudad ? 'activo' : ''}`}
                          onClick={() => onCiudadSelect(ciudad.nombre_ciudad)}
                        >
                          Seleccionar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="tienda-selector-children">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export type { TiendaSelectorProps };
export default TiendaSelector;
