import React, { useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasTienda } from '../../admin-superadmin-logistica-tienda/useCuentasTienda';
import CuentasTiendaView from '../../admin-superadmin-logistica-tienda/CuentasTiendaView/CuentasTiendaView';
import GestionCobro from '../GestionCobro/GestionCobro';
import TiendaSelector from '../../admin-superadmin-logistica-tienda/TiendaSelector/TiendaSelector';
import Alert from '../../../components/Alert/Alert';

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
      if (!(event.target as Element).closest('.dropdown')) {
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

  const handleTiendaSelect = (idTienda: number) => {
    setTiendaSeleccionada(idTienda);
    setNeveraSeleccionada(null);
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
          usuariosTienda={usuariosTienda}
          tiendaSeleccionada={tiendaSeleccionada}
          neveraSeleccionada={neveraSeleccionada}
          showTiendaMenu={showTiendaMenu}
          showUserInfo
          onToggleTiendaMenu={() => setShowTiendaMenu(!showTiendaMenu)}
          onTiendaSelect={handleTiendaSelect}
          onNeveraConsultar={handleSeleccionarNevera}
        />
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

      {tiendaSeleccionada && neveraSeleccionada && transacciones && (
        <GestionCobro
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          montoPago={montoPago}
          setMontoPago={setMontoPago}
          notaPago={notaPago}
          setNotaPago={setNotaPago}
          procesandoPago={procesandoPago}
          onProcesarPago={manejarPago}
          userName={user?.name || ''}
          saldoTotalLiquidar={saldoTotalLiquidar}
        />
      )}
    </div>
  );
};

export default CuentasTiendaAdminPage;
