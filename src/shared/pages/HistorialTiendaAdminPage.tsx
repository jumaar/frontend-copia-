import React, { useEffect } from 'react';
import { useHistorialTienda } from '../hooks/useHistorialTienda';
import HistorialTiendaView from '../../shared/components/HistorialTiendaView/HistorialTiendaView';
import '../../shared/components/TablaTransacciones/TablaTransacciones.css';

const HistorialTiendaAdminPage: React.FC = () => {
  const {
    usuariosTienda,
    ciudades,
    ciudadSeleccionada,
    usuarioSeleccionado,
    busquedaNevera,
    showTiendaMenu,
    showCiudadMenu,
    loadingUsuarios,
    setCiudadSeleccionada,
    setUsuarioSeleccionado,
    setBusquedaNevera,
    setShowTiendaMenu,
    setShowCiudadMenu,
    buscarNevera,

    historial,
    loading,
    error,
    successMessage,
    setError,
    setSuccessMessage,

    mesesHistoricos,
    mesSeleccionado,
    showMesesMenu,
    setShowMesesMenu,
    consultarMesEspecifico,
    cargarHistorial,

    expandedNeveras,
    expandedConsolidados,
    expandedProductos,
    toggleNevera,
    toggleConsolidado,
    toggleProducto,

    resumenGlobal,
  } = useHistorialTienda({ mode: 'admin' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
        setShowMesesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowCiudadMenu, setShowTiendaMenu, setShowMesesMenu]);

  if (loadingUsuarios) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios de tienda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        <h1>Historial Tienda</h1>
        <p className="subtitle">
          Consulta el historial completo de movimientos por nevera en el mes seleccionado
        </p>

        <div className="usuario-selector">
          <div className="selector-container">
            <h3 style={{ color: 'var(--color-text-primary)' }}>SELECCIONAR USUARIO TIENDA:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ flex: '1 1 100%', marginBottom: '1rem' }}>
                <label className="selector-label">🔍 Buscar por ID de Nevera:</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="usuario-select"
                    value={busquedaNevera}
                    onChange={e => setBusquedaNevera(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); buscarNevera(); }
                    }}
                    placeholder="Ingresa el ID de la nevera..."
                    style={{
                      flex: '1', padding: '0.75rem', borderRadius: '4px',
                      border: '2px solid #666',
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-text-primary)',
                      fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', outline: 'none',
                    }}
                  />
                  <button
                    className="btn-consultar"
                    onClick={buscarNevera}
                    disabled={!busquedaNevera.trim() || loading}
                    style={{
                      backgroundColor: 'var(--color-success)', color: 'white',
                      border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px',
                      cursor: (!busquedaNevera.trim() || loading) ? 'not-allowed' : 'pointer',
                      opacity: (!busquedaNevera.trim() || loading) ? 0.5 : 1,
                      fontSize: '1rem', fontWeight: '500',
                    }}
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <label className="selector-label">1. Filtrar por Ciudad:</label>
                  <div className="meses-dropdown" style={{ marginTop: '0.5rem' }}>
                    <button
                      className="dropdown-toggle"
                      onClick={() => {
                        setShowCiudadMenu(!showCiudadMenu);
                        setShowTiendaMenu(false);
                      }}
                      disabled={loadingUsuarios}
                      style={{ opacity: loadingUsuarios ? 0.7 : 1, cursor: loadingUsuarios ? 'not-allowed' : 'pointer' }}
                    >
                      {ciudadSeleccionada
                        ? `${ciudades.find((c: any) => c.nombre_ciudad === ciudadSeleccionada)?.nombre_ciudad || ciudadSeleccionada} - ${ciudades.find((c: any) => c.nombre_ciudad === ciudadSeleccionada)?.departamento || ''}`
                        : <span>Selecciona una ciudad...</span>}
                      <span className="dropdown-arrow">▼</span>
                    </button>
                    {showCiudadMenu && !loadingUsuarios && (
                      <div className="dropdown-menu">
                        <div className="dropdown-item">
                          <span className="mes-fecha">Todas las ciudades</span>
                          <button
                            className={`btn-consultar ${!ciudadSeleccionada ? 'activo' : ''}`}
                            onClick={() => {
                              setCiudadSeleccionada(null);
                              setUsuarioSeleccionado(null);
                              setShowCiudadMenu(false);
                            }}
                            disabled={loading}
                          >
                            {loading ? 'Cargando...' : 'Seleccionar'}
                          </button>
                        </div>
                        {ciudades.map((ciudad: any) => (
                          <div key={ciudad.id_ciudad} className="dropdown-item">
                            <span className="mes-fecha">{ciudad.nombre_ciudad} - {ciudad.departamento}</span>
                            <button
                              className={`btn-consultar ${ciudadSeleccionada === ciudad.nombre_ciudad ? 'activo' : ''}`}
                              onClick={() => {
                                setCiudadSeleccionada(ciudad.nombre_ciudad);
                                setUsuarioSeleccionado(null);
                                setShowCiudadMenu(false);
                              }}
                              disabled={loading}
                            >
                              {loading ? 'Cargando...' : 'Seleccionar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ flex: '1 1 350px' }}>
                  <label className="selector-label">2. Seleccionar Usuario Tienda:</label>
                  <div className="meses-dropdown">
                    <button
                      className="dropdown-toggle"
                      onClick={() => setShowTiendaMenu(!showTiendaMenu)}
                      disabled={loadingUsuarios}
                      style={{ opacity: loadingUsuarios ? 0.7 : 1, cursor: loadingUsuarios ? 'not-allowed' : 'pointer' }}
                    >
                      {usuarioSeleccionado
                        ? (() => {
                            const u = usuariosTienda.find((ut: any) => ut.id_usuario === usuarioSeleccionado);
                            if (u) return <span>👤 {u.nombre_usuario} {u.apellido_usuario} (ID: {u.id_usuario})</span>;
                            return <span>Selecciona un usuario...</span>;
                          })()
                        : <span>Selecciona un usuario...</span>}
                      <span className="dropdown-arrow">▼</span>
                    </button>
                    {showTiendaMenu && !loadingUsuarios && (
                      <div className="dropdown-menu">
                        {usuariosTienda.map((u: any) => {
                          const tiendasFiltradas = u.tiendas?.filter((t: any) => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada) || [];
                          if (tiendasFiltradas.length === 0) return null;
                          const totalNeveras = tiendasFiltradas.reduce((sum: number, t: any) => sum + (t.neveras?.length || 0), 0);
                          return (
                            <div key={u.id_usuario} className="dropdown-item">
                              <span className="mes-fecha">
                                👤 {u.nombre_usuario} {u.apellido_usuario} (ID: {u.id_usuario})
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                                  {tiendasFiltradas.length} tienda{tiendasFiltradas.length !== 1 ? 's' : ''} · {totalNeveras} nevera{totalNeveras !== 1 ? 's' : ''}
                                </span>
                              </span>
                              <button
                                className={`btn-consultar ${usuarioSeleccionado === u.id_usuario ? 'activo' : ''}`}
                                onClick={() => {
                                  setUsuarioSeleccionado(u.id_usuario);
                                  setShowTiendaMenu(false);
                                  cargarHistorial(u.id_usuario, mesSeleccionado?.mes, mesSeleccionado?.año);
                                }}
                                disabled={loading}
                              >
                                {loading && usuarioSeleccionado === u.id_usuario ? 'Consultando...' : 'Seleccionar'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {loading && usuarioSeleccionado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Consultando historial...</span>
              </div>
            )}

            {!loading && usuarioSeleccionado && (() => {
              const userSelected = usuariosTienda.find((u: any) => u.id_usuario === usuarioSeleccionado);
              if (!userSelected) return null;
              const tiendasVisibles = userSelected.tiendas?.filter((t: any) => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada) || [];
              return (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                    👤 {userSelected.nombre_usuario} {userSelected.apellido_usuario} (ID: {userSelected.id_usuario})
                  </h4>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    <strong>Contacto:</strong> {userSelected.email} | {userSelected.celular}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tiendasVisibles.map((store: any) => (
                      <div key={store.id_tienda} style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>🏪 {store.nombre_tienda}</h5>
                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                          {store.direccion} — {store.ciudad}, {store.departamento}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          <strong>❄️ Neveras:</strong> {store.neveras?.length || 0}
                          {store.neveras && store.neveras.length > 0 && (
                            <span style={{ marginLeft: '0.5rem' }}>
                              {store.neveras.map((n: any, _i: any) => (
                                <span key={n.id_nevera} style={{
                                  display: 'inline-block', marginRight: '0.35rem',
                                  padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.75rem',
                                  backgroundColor: n.id_estado_nevera === 2 ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                                  color: n.id_estado_nevera === 2 ? 'var(--color-success)' : 'var(--color-error)',
                                }}>
                                  #{n.id_nevera}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {historial && (
        <HistorialTiendaView
          historial={historial}
          loading={loading}
          error={error}
          successMessage={successMessage}
          mesesHistoricos={mesesHistoricos}
          mesSeleccionado={mesSeleccionado}
          showMesesMenu={showMesesMenu}
          expandedNeveras={expandedNeveras}
          expandedConsolidados={expandedConsolidados}
          expandedProductos={expandedProductos}
          resumenGlobal={resumenGlobal}
          toggleNevera={toggleNevera}
          toggleConsolidado={toggleConsolidado}
          toggleProducto={toggleProducto}
          consultarMesEspecifico={consultarMesEspecifico}
          setShowMesesMenu={setShowMesesMenu}
          setError={setError}
          setSuccessMessage={setSuccessMessage}
        />
      )}
    </div>
  );
};

export default HistorialTiendaAdminPage;
