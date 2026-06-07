import React from 'react';
import { useHistorialTienda } from '../../../shared/componentscoped/admin-superadmin-logistica-tienda/useHistorialTienda';
import HistorialTiendaView from '../../../shared/componentscoped/admin-superadmin-logistica-tienda/HistorialTiendaView/HistorialTiendaView';

const HistorialTiendaPage: React.FC = () => {
  const {
    loading,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    historial,
    mesesHistoricos,
    mesSeleccionado,
    consultarMesEspecifico,
    expandedNeveras,
    expandedConsolidados,
    expandedProductos,
    toggleNevera,
    toggleConsolidado,
    toggleProducto,
    resumenGlobal,
  } = useHistorialTienda({ mode: 'self' });

  if (!historial && loading) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <HistorialTiendaView
      historial={historial!}
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
  );
};

export default HistorialTiendaPage;
