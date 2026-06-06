import React, { useEffect } from 'react';
import { useHistorialTienda } from '../../../shared/hooks/useHistorialTienda';
import HistorialTiendaView from '../../../shared/components/HistorialTiendaView/HistorialTiendaView';

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
    showMesesMenu,
    setShowMesesMenu,
    consultarMesEspecifico,
    expandedNeveras,
    expandedConsolidados,
    expandedProductos,
    toggleNevera,
    toggleConsolidado,
    toggleProducto,
    resumenGlobal,
  } = useHistorialTienda({ mode: 'self' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowMesesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowMesesMenu]);

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
  );
};

export default HistorialTiendaPage;
