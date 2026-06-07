import React from 'react';
import { useLogisticaInventario } from '../../admin-superadmin-logistica/useLogisticaInventario';
import InventarioView from '../../admin-superadmin-logistica/InventarioView/InventarioView';

const InventarioAdminPage: React.FC = () => {
  const hook = useLogisticaInventario({ mode: 'admin' });
  const {
    inventarioData,
    loading,
    error,
    loadingUsuarios,
    esAdmin,
    selectedUserId,
    usuariosLogistica,
    showUserDropdown,
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
    handleCloseSurtirModal,
    handleBuscar,
    handleValidarEmpaques,
    handleConsultarNeveras,
    handleSeleccionarLogistica,
    handleDarDeBaja,
    esValidacionDelDia,
    setSearchId,
    setShowUserDropdown,
  } = hook;

  if (loadingUsuarios) {
    return <div className="management-page">Cargando usuarios logística...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventario de Logística</h1>
        <p>Selecciona un usuario logística para consultar su inventario</p>
      </div>

      <div className="usuario-selector" style={{ marginBottom: '1.5rem' }}>
        <div className="selector-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            SELECCIONAR LOGÍSTICA:
          </h3>
          {usuariosLogistica.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              No hay usuarios logística relacionados disponibles.
            </p>
          ) : (
            <div className="meses-dropdown">
              <button
                className="dropdown-toggle"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                {selectedUserId && usuariosLogistica.length > 0 ? (
                  <span>
                    {(() => {
                      const usuario = usuariosLogistica.find(u => u.id_usuario === selectedUserId);
                      return usuario ? `${usuario.nombre_usuario} ${usuario.apellido_usuario} (ID: ${usuario.id_usuario})` : 'Selecciona una logística...';
                    })()}
                  </span>
                ) : (
                  <span>Selecciona una logística...</span>
                )}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showUserDropdown && (
                <div className="dropdown-menu">
                  {usuariosLogistica.map(usuario => (
                    <div key={usuario.id_usuario} className="dropdown-item">
                      <span className="mes-fecha">
                        {usuario.nombre_usuario} {usuario.apellido_usuario} (ID: {usuario.id_usuario})
                      </span>
                      <button
                        className={`btn-consultar ${selectedUserId === usuario.id_usuario ? 'activo' : ''}`}
                        onClick={() => handleSeleccionarLogistica(usuario.id_usuario)}
                        disabled={loading}
                      >
                        {loading && selectedUserId === usuario.id_usuario ? 'Consultando...' : 'Consultar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedUserId && usuariosLogistica.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              {(() => {
                const usuario = usuariosLogistica.find(u => u.id_usuario === selectedUserId);
                return usuario ? (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                      {usuario.nombre_usuario} {usuario.apellido_usuario}
                    </h4>
                    <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      ID: {usuario.id_usuario} | Email: {usuario.email} | Celular: {usuario.celular}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>

      {!selectedUserId && !loading ? (
        <div className="no-selection-message">
          <div className="no-selection-content">
            <span className="no-selection-icon">📋</span>
            <h3>Selecciona un usuario logística para ver su inventario</h3>
            <p>Elige un usuario de la lista desplegable para consultar sus productos en inventario.</p>
          </div>
        </div>
      ) : selectedUserId ? (
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
          handleCloseSurtirModal={handleCloseSurtirModal}
          handleBuscar={handleBuscar}
          handleValidarEmpaques={handleValidarEmpaques}
          handleConsultarNeveras={handleConsultarNeveras}
          handleDarDeBaja={handleDarDeBaja}
          esValidacionDelDia={esValidacionDelDia}
          setSearchId={setSearchId}
        />
      ) : null}
    </div>
  );
};

export default InventarioAdminPage;
