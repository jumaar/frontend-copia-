import React from 'react';
import type { UsuarioTienda, Tienda } from '../../types/cuentas-tienda.types';
import '../MesesDropdown/MesesDropdown.css';
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
  usuariosTienda: UsuarioTienda[];
  tiendaSeleccionada: number | null;
  showTiendaMenu: boolean;
  neveraSeleccionada: number | null;
  showUserInfo?: boolean;
  mode?: 'consulta' | 'historial';
  onToggleTiendaMenu: () => void;
  onTiendaSelect: (idTienda: number) => void;
  onNeveraConsultar?: (usuarioId: number, neveraId: number) => void;
}

function findTienda(usuarios: UsuarioTienda[], idTienda: number): { user: UsuarioTienda; tienda: Tienda } | null {
  for (const u of usuarios) {
    const t = u.tiendas?.find(ti => ti.id_tienda === idTienda);
    if (t) return { user: u, tienda: t };
  }
  return null;
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
  usuariosTienda,
  tiendaSeleccionada,
  showTiendaMenu,
  showUserInfo = false,
  mode = 'consulta',
  onToggleTiendaMenu,
  onTiendaSelect,
  onNeveraConsultar,
}) => {
  const isConsulta = mode === 'consulta';
  const selected = tiendaSeleccionada ? findTienda(usuariosTienda, tiendaSeleccionada) : null;

  const tiendasFiltradas = usuariosTienda.flatMap(usr =>
    (usr.tiendas || [])
      .filter(t => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada)
      .map(tienda => ({ ...tienda, _userId: usr.id_usuario }))
  );

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
            <div className="tienda-selector-children">
              <div style={{ flex: '1 1 350px' }}>
                <label className="selector-label">2. Seleccionar Tienda:</label>
                <div className="meses-dropdown">
                  <button className="dropdown-toggle" onClick={onToggleTiendaMenu} disabled={loading}>
                    {selected
                      ? <span>🏪 {selected.tienda.nombre_tienda}</span>
                      : <span>Selecciona una tienda...</span>}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {showTiendaMenu && !loading && (
                    <div className="dropdown-menu">
                      {tiendasFiltradas.map(tienda => {
                        const tienePendientes = tienda.neveras?.some(n => n.pendientes_pago) || false;
                        return (
                          <div key={tienda.id_tienda} className="dropdown-item">
                            <span className="mes-fecha" style={{ color: tienePendientes ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                              🏪 {tienda.nombre_tienda}
                              {tienePendientes && <span style={{ color: 'var(--color-error)', fontWeight: 'bold', marginLeft: '8px' }}>💰 Pendientes</span>}
                            </span>
                            <button
                              className={`btn-consultar ${tiendaSeleccionada === tienda.id_tienda ? 'activo' : ''}`}
                              onClick={() => { onTiendaSelect(tienda.id_tienda); onToggleTiendaMenu(); }}
                              disabled={loading}
                            >
                              Seleccionar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {isConsulta && loading && tiendaSeleccionada && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                  <span>Consultando transacciones...</span>
                </div>
              )}

              {!loading && selected && (
                <div className="tienda-info-card">
                  <h4>🏪 {selected.tienda.nombre_tienda}</h4>
                  <p>
                    <strong>Dirección:</strong> {selected.tienda.direccion} - {selected.tienda.ciudad}, {selected.tienda.departamento}
                  </p>
                  {showUserInfo && (
                    <p>
                      <strong>Usuario:</strong> {selected.user.nombre_usuario} {selected.user.apellido_usuario} (ID: {selected.user.id_usuario})<br />
                      <strong>Contacto:</strong> {selected.user.email} | {selected.user.celular}
                    </p>
                  )}
                  <div className="tienda-neveras-section">
                    <h5>❄️ Neveras ({selected.tienda.neveras?.length || 0})</h5>
                    {selected.tienda.neveras && selected.tienda.neveras.length > 0 ? (
                      <div className="tienda-neveras-list">
                        {selected.tienda.neveras.map(nevera => (
                          <div
                            key={nevera.id_nevera}
                            className={`tienda-nevera-item ${nevera.pendientes_pago ? 'pendiente' : nevera.id_estado_nevera === 2 ? 'activa' : 'inactiva'}`}
                          >
                            <div className="tienda-nevera-info">
                              <span>❄️</span>
                              <div>
                                <div className="tienda-nevera-id">ID: {nevera.id_nevera}</div>
                                <div className="tienda-nevera-estado">
                                  {nevera.id_estado_nevera === 2 ? '✅ Activa' : '❌ Inactiva'} {nevera.pendientes_pago ? '💰 Pendientes' : '✅ Al día'}
                                </div>
                              </div>
                            </div>
                            {isConsulta && (
                              <button
                                className="btn-consultar tienda-nevera-consultar-btn"
                                onClick={() => onNeveraConsultar?.(selected.user.id_usuario, nevera.id_nevera)}
                                disabled={loading}
                              >
                                Consultar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="tienda-neveras-empty">No hay neveras registradas para esta tienda.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { TiendaSelectorProps };
export default TiendaSelector;
