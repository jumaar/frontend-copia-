import React, { useEffect } from 'react';
import { useCuentasTienda } from '../../../shared/componentscoped/admin-superadmin-logistica-tienda/useCuentasTienda';
import CuentasTiendaView from '../../../shared/componentscoped/admin-superadmin-logistica-tienda/CuentasTiendaView/CuentasTiendaView';
import TiendaSelector from '../../../shared/componentscoped/admin-superadmin-logistica-tienda/TiendaSelector/TiendaSelector';
import Alert from '../../../shared/components/Alert/Alert';

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
      if (!(event.target as Element).closest('.dropdown')) {
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
        <Alert message={successMessage} onDismiss={() => setSuccessMessage(null)} type="success" />
      )}

      {error && (
        <Alert message={error} onDismiss={() => setError(null)} type="error" />
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
