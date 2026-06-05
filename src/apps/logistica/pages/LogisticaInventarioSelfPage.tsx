import React from 'react';
import { useLogisticaInventario } from '../../../shared/hooks/useLogisticaInventario';
import InventarioView from '../../../shared/components/InventarioView/InventarioView';

const LogisticaInventarioSelfPage: React.FC = () => {
  const hook = useLogisticaInventario({ mode: 'self' });
  const {
    inventarioData,
    loading,
    error,
    esAdmin,
    selectedLogisticaId,
    lastDistributionTime,
    expandedProducts,
    expandedVencidosProducts,
    expandedCities,
    expandedPrioridadCities,
    expandedPrioridadNeveras,
    expandedVencidosCities,
    expandedVencidosNeveras,
    neverasData,
    loadingNeveras,
    errorNeveras,
    searchId,
    showNeverasSection,
    isSurtirModalOpen,
    selectedNeveraId,
    isParametrosSurtirModalOpen,
    surtirParamsNevera,
    validandoEmpaques,
    toggleProductExpansion,
    toggleVencidosProductExpansion,
    toggleCityExpansion,
    togglePrioridadCity,
    togglePrioridadNevera,
    toggleVencidosCity,
    toggleVencidosNevera,
    handleSurtir,
    handleSurtirFlujo,
    handleConfirmParametrosSurtir,
    handleCloseSurtirModal,
    handleCloseParametrosSurtirModal,
    handleBuscar,
    handleValidarEmpaques,
    handleConsultarNeveras,
    handleDarDeBaja,
    esValidacionDelDia,
    setSearchId,
  } = hook;

  if (loading && !esAdmin) {
    return <div className="management-page">Cargando inventario...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventario Recibido</h1>
        <p>Empaques listos y confirmados para entregas en tiendas</p>
      </div>

      <InventarioView
        inventarioData={inventarioData}
        loading={loading}
        error={error}
        neverasData={neverasData}
        loadingNeveras={loadingNeveras}
        errorNeveras={errorNeveras}
        expandedProducts={expandedProducts}
        expandedVencidosProducts={expandedVencidosProducts}
        expandedCities={expandedCities}
        expandedPrioridadCities={expandedPrioridadCities}
        expandedPrioridadNeveras={expandedPrioridadNeveras}
        expandedVencidosCities={expandedVencidosCities}
        expandedVencidosNeveras={expandedVencidosNeveras}
        lastDistributionTime={lastDistributionTime}
        selectedLogisticaId={selectedLogisticaId}
        validandoEmpaques={validandoEmpaques}
        showNeverasSection={showNeverasSection}
        isSurtirModalOpen={isSurtirModalOpen}
        selectedNeveraId={selectedNeveraId}
        isParametrosSurtirModalOpen={isParametrosSurtirModalOpen}
        surtirParamsNevera={surtirParamsNevera}
        searchId={searchId}
        esAdmin={esAdmin}
        toggleProductExpansion={toggleProductExpansion}
        toggleVencidosProductExpansion={toggleVencidosProductExpansion}
        toggleCityExpansion={toggleCityExpansion}
        togglePrioridadCity={togglePrioridadCity}
        togglePrioridadNevera={togglePrioridadNevera}
        toggleVencidosCity={toggleVencidosCity}
        toggleVencidosNevera={toggleVencidosNevera}
        handleSurtir={handleSurtir}
        handleSurtirFlujo={handleSurtirFlujo}
        handleConfirmParametrosSurtir={handleConfirmParametrosSurtir}
        handleCloseSurtirModal={handleCloseSurtirModal}
        handleCloseParametrosSurtirModal={handleCloseParametrosSurtirModal}
        handleBuscar={handleBuscar}
        handleValidarEmpaques={handleValidarEmpaques}
        handleConsultarNeveras={handleConsultarNeveras}
        handleDarDeBaja={handleDarDeBaja}
        esValidacionDelDia={esValidacionDelDia}
        setSearchId={setSearchId}
      />
    </div>
  );
};

export default LogisticaInventarioSelfPage;
