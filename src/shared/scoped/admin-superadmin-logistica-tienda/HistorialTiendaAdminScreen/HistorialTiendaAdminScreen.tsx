import React, { useEffect } from 'react';
import { useHistorialTienda } from '../hooks/useHistorialTienda';
import HistorialTiendaView from '../components/HistorialTiendaView/HistorialTiendaView';
import TiendaSelector from '../components/TiendaSelector/TiendaSelector';

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
      if (!(event.target as Element).closest('.dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowCiudadMenu, setShowTiendaMenu]);

  const handleUsuarioTiendaSelect = (idUsuario: number) => {
    setUsuarioSeleccionado(idUsuario);
    cargarHistorial(idUsuario, mesSeleccionado?.mes, mesSeleccionado?.año);
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
        <h1>Historial Tienda</h1>
        <p className="subtitle">
          Consulta el historial completo de movimientos por nevera en el mes seleccionado
        </p>

        <TiendaSelector
          title="SELECCIONAR USUARIO TIENDA:"
          busquedaNevera={busquedaNevera}
          onBusquedaChange={setBusquedaNevera}
          onBuscar={buscarNevera}
          searchLoading={loading}
          ciudades={ciudades}
          ciudadSeleccionada={ciudadSeleccionada}
          onCiudadSelect={(c) => { setCiudadSeleccionada(c); setUsuarioSeleccionado(null); setShowCiudadMenu(false); }}
          showCiudadMenu={showCiudadMenu}
          onToggleCiudadMenu={() => { setShowCiudadMenu(!showCiudadMenu); setShowTiendaMenu(false); }}
          loading={loadingUsuarios}
          mode="historial"
          usuariosTienda={usuariosTienda}
          tiendaSeleccionada={null}
          neveraSeleccionada={null}
          showTiendaMenu={showTiendaMenu}
          showUserInfo
          onToggleTiendaMenu={() => setShowTiendaMenu(!showTiendaMenu)}
          onTiendaSelect={() => {}}
          usuarioTiendaSeleccionado={usuarioSeleccionado}
          onUsuarioTiendaSelect={handleUsuarioTiendaSelect}
        />
      </div>

      {historial && (
        <HistorialTiendaView
          historial={historial}
          loading={loading}
          error={error}
          successMessage={successMessage}
          mesesHistoricos={mesesHistoricos}
          mesSeleccionado={mesSeleccionado}
          expandedNeveras={expandedNeveras}
          expandedConsolidados={expandedConsolidados}
          expandedProductos={expandedProductos}
          resumenGlobal={resumenGlobal}
          toggleNevera={toggleNevera}
          toggleConsolidado={toggleConsolidado}
          toggleProducto={toggleProducto}
          consultarMesEspecifico={consultarMesEspecifico}
          setError={setError}
          setSuccessMessage={setSuccessMessage}
        />
      )}
    </div>
  );
};

export default HistorialTiendaAdminPage;
