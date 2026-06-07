import React, { useEffect } from 'react';
import { useCuentasTienda } from '../../../shared/scoped/admin-superadmin-logistica-tienda/useCuentasTienda';
import CuentasTiendaView from '../../../shared/scoped/admin-superadmin-logistica-tienda/CuentasTiendaView/CuentasTiendaView';
import TiendaSelector from '../../../shared/scoped/admin-superadmin-logistica-tienda/TiendaSelector';
import '../../../shared/components/TablaTransacciones/TablaTransacciones.css';

const TiendaCuentasPage: React.FC = () => {
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
    saldoTotalLiquidar,
    showTiendaMenu,
    showCiudadMenu,
    expandedProductos,
    setCiudadSeleccionada,
    setBusquedaNevera,
    setShowTiendaMenu,
    setShowCiudadMenu,
    setExpandedProductos,
    setError,
    setSuccessMessage,
    setTiendaSeleccionada,
    setNeveraSeleccionada,
    buscarNevera,
    consultarMesEspecifico,
    cargarTransacciones,
  } = useCuentasTienda({ mode: 'self' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowCiudadMenu, setShowTiendaMenu]);

  const toggleProducto = (id: number) => {
    const next = new Set(expandedProductos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProductos(next);
  };

  const handleNeveraConsultar = (_usuarioId: number, neveraId: number) => {
    setNeveraSeleccionada(neveraId);
    cargarTransacciones(usuariosTienda[0]?.id_usuario || 0, neveraId);
  };

  if (loadingUsuarios) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando tus tiendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        <h1>Mis Cuentas</h1>
        <p className="subtitle">
          Consulta tus transacciones de productos pendientes y consolidados
        </p>

        {usuariosTienda.length > 0 && (
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
            onToggleCiudadMenu={() => { setShowCiudadMenu(!showCiudadMenu); setShowTiendaMenu(false); }}
            loading={loadingUsuarios}
            usuariosTienda={usuariosTienda}
            tiendaSeleccionada={tiendaSeleccionada}
            neveraSeleccionada={neveraSeleccionada}
            showTiendaMenu={showTiendaMenu}
            onToggleTiendaMenu={() => setShowTiendaMenu(!showTiendaMenu)}
            onTiendaSelect={(idTienda) => { setTiendaSeleccionada(idTienda); setNeveraSeleccionada(null); }}
            onNeveraConsultar={handleNeveraConsultar}
          />
        )}
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
    </div>
  );
};

export default TiendaCuentasPage;
