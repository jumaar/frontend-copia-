import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCuentasTienda, filtrarUsuariosPorNevera } from '../../shared/hooks/useCuentasTienda';
import CuentasTiendaView from '../../shared/components/CuentasTiendaView/CuentasTiendaView';
import GestionCobro from '../../shared/components/GestionCobro';
import TiendaSelector from '../../shared/components/TiendaSelector';
import '../../shared/components/TablaTransacciones/TablaTransacciones.css';
import type { UsuarioTienda } from '../../shared/types/cuentas-tienda.types';

const CuentasTiendaAdminPage: React.FC = () => {
  const { user } = useAuth();
  const {
    usuariosTienda,
    ciudades,
    transacciones,
    loading,
    loadingUsuarios,
    error,
    successMessage,
    ciudadSeleccionada,
    tiendaSeleccionada,
    neveraSeleccionada,
    busquedaNevera,
    mesesHistoricos,
    mesSeleccionado,
    tipoPago,
    montoPago,
    notaPago,
    procesandoPago,
    saldoTotalLiquidar,
    showTiendaMenu,
    showCiudadMenu,
    showTipoMenu,
    expandedProductos,
    setCiudadSeleccionada,
    setBusquedaNevera,
    setShowTiendaMenu,
    setShowCiudadMenu,
    setShowTipoMenu,
    setTipoPago,
    setMontoPago,
    setNotaPago,
    setExpandedProductos,
    setError,
    setSuccessMessage,
    setTiendaSeleccionada,
    setNeveraSeleccionada,
    buscarNevera,
    consultarMesEspecifico,
    manejarPago,
    cargarTransacciones,
  } = useCuentasTienda({ mode: 'admin' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
        setShowTipoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowCiudadMenu, setShowTiendaMenu, setShowTipoMenu]);

  const toggleProducto = (id: number) => {
    const next = new Set(expandedProductos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProductos(next);
  };

  const handleSeleccionarNevera = (idUsuario: number, idNevera: number) => {
    setExpandedProductos(new Set());
    setNeveraSeleccionada(idNevera);
    cargarTransacciones(idUsuario, idNevera);
  };

  const findUserForTienda = (idTienda: number): UsuarioTienda | undefined => {
    for (const u of usuariosTienda) {
      if (u.tiendas?.find(t => t.id_tienda === idTienda)) return u;
    }
    return undefined;
  };

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
        <h1>Cuentas de Neveras</h1>
        <p className="subtitle">
          Consulta las transacciones de productos pendientes y consolidados por nevera específica
        </p>

        <TiendaSelector
          title="SELECCIONAR TIENDA:"
          busquedaNevera={busquedaNevera}
          onBusquedaChange={setBusquedaNevera}
          onBuscar={buscarNevera}
          searchLoading={loading}
          ciudades={ciudades}
          ciudadSeleccionada={ciudadSeleccionada}
          onCiudadSelect={(c) => { setCiudadSeleccionada(c); setShowCiudadMenu(false); }}
          showCiudadMenu={showCiudadMenu}
          onToggleCiudadMenu={() => { setShowCiudadMenu(!showCiudadMenu); setShowTiendaMenu(false); setShowTipoMenu(false); }}
          loading={loadingUsuarios}
        >
          <div style={{ flex: '1 1 350px' }}>
            <label className="selector-label">2. Seleccionar Tienda:</label>
            <div className="meses-dropdown">
              <button className="dropdown-toggle" onClick={() => setShowTiendaMenu(!showTiendaMenu)} disabled={loadingUsuarios}>
                {tiendaSeleccionada
                  ? (() => {
                      const u = findUserForTienda(tiendaSeleccionada);
                      const t = u?.tiendas?.find(ti => ti.id_tienda === tiendaSeleccionada);
                      return t ? <span>🏪 {t.nombre_tienda}</span> : <span>Selecciona una tienda...</span>;
                    })()
                  : <span>Selecciona una tienda...</span>}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showTiendaMenu && !loadingUsuarios && (
                <div className="dropdown-menu">
                  {filtrarUsuariosPorNevera(usuariosTienda, busquedaNevera).map(usr => {
                    const tiendasFiltradas = usr.tiendas?.filter(t => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada) || [];
                    if (tiendasFiltradas.length === 0) return null;
                    return tiendasFiltradas.map(tienda => {
                      const tienePendientes = tienda.neveras?.some(n => n.pendientes_pago) || false;
                      return (
                        <div key={tienda.id_tienda} className="dropdown-item">
                          <span className="mes-fecha" style={{ color: tienePendientes ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                            🏪 {tienda.nombre_tienda}
                            {tienePendientes && <span style={{ color: 'var(--color-error)', fontWeight: 'bold', marginLeft: '8px' }}>💰 Pendientes</span>}
                          </span>
                          <button className={`btn-consultar ${tiendaSeleccionada === tienda.id_tienda ? 'activo' : ''}`}
                            onClick={() => { setShowTiendaMenu(false); setTiendaSeleccionada(tienda.id_tienda); setNeveraSeleccionada(null); }}
                            disabled={loading}>
                            Seleccionar
                          </button>
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          </div>

          {loading && tiendaSeleccionada && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              <span>Consultando transacciones...</span>
            </div>
          )}

          {!loading && tiendaSeleccionada && (() => {
            const u = findUserForTienda(tiendaSeleccionada);
            const t = u?.tiendas?.find(ti => ti.id_tienda === tiendaSeleccionada);
            if (!u || !t) return null;
            return (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>🏪 {t.nombre_tienda}</h4>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  <strong>Dirección:</strong> {t.direccion} - {t.ciudad}, {t.departamento}<br />
                  <strong>Usuario:</strong> {u.nombre_usuario} {u.apellido_usuario} (ID: {u.id_usuario})<br />
                  <strong>Contacto:</strong> {u.email} | {u.celular}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                    ❄️ Neveras ({t.neveras?.length || 0})
                  </h5>
                  {t.neveras && t.neveras.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {t.neveras.map(nevera => (
                        <div key={nevera.id_nevera} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.75rem', borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: nevera.pendientes_pago ? 'var(--color-error-bg)' : (nevera.id_estado_nevera === 2 ? 'var(--color-success-bg)' : 'var(--color-error-bg)'),
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>❄️</span>
                            <div>
                              <div style={{ color: 'var(--color-text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>ID: {nevera.id_nevera}</div>
                              <div style={{ color: nevera.pendientes_pago ? 'var(--color-error)' : (nevera.id_estado_nevera === 2 ? 'var(--color-success)' : 'var(--color-error)'), fontSize: '0.8rem', fontWeight: '500' }}>
                                {nevera.id_estado_nevera === 2 ? '✅ Activa' : '❌ Inactiva'} {nevera.pendientes_pago ? '💰 Pendientes' : '✅ Al día'}
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn-consultar"
                            onClick={() => handleSeleccionarNevera(u.id_usuario, nevera.id_nevera)}
                            disabled={loading}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', minWidth: '100px', backgroundColor: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                          >
                            Consultar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No hay neveras registradas para esta tienda.</p>
                  )}
                </div>
              </div>
            );
          })()}
        </TiendaSelector>
      </div>

      {successMessage && (
        <div className="success-message" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}>
          <div className="success-content">
            <span className="success-icon">✅</span>
            <p>{successMessage}</p>
            <button className="success-close-btn" onClick={() => setSuccessMessage(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="error-retry-btn" onClick={() => setError(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {transacciones && (
        <CuentasTiendaView
          transacciones={transacciones}
          loading={loading}
          error={error}
          neveraSeleccionada={neveraSeleccionada}
          tiendaSeleccionada={tiendaSeleccionada}
          expandedProductos={expandedProductos}
          mesesHistoricos={mesesHistoricos}
          mesSeleccionado={mesSeleccionado}
          saldoTotalLiquidar={saldoTotalLiquidar}
          onToggleProducto={toggleProducto}
          onConsultarMes={consultarMesEspecifico}
        />
      )}

      {tiendaSeleccionada && neveraSeleccionada && transacciones && (
        <GestionCobro
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          montoPago={montoPago}
          setMontoPago={setMontoPago}
          notaPago={notaPago}
          setNotaPago={setNotaPago}
          procesandoPago={procesandoPago}
          showTipoMenu={showTipoMenu}
          setShowTipoMenu={setShowTipoMenu}
          onProcesarPago={manejarPago}
          userName={user?.name || ''}
          saldoTotalLiquidar={saldoTotalLiquidar}
        />
      )}
    </div>
  );
};

export default CuentasTiendaAdminPage;
