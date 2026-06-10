import React from 'react';
import { useFinanzas } from './useFinanzas';
import FinanzasView from './FinanzasView/FinanzasView';

const FinanzasAdminPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    successMessage,
    setSuccessMessage,
    selectedMonth,
    selectedYear,
    isAdmin,
    logisticas,
    selectedLogistica,
    loadingHermanos,
    showModal,
    modalType,
    montoMovimiento,
    setMontoMovimiento,
    notaMovimiento,
    setNotaMovimiento,
    confirmText,
    setConfirmText,
    procesando,
    monthOptions,
    handleSelectLogistica,
    handleMonthYearChange,
    retryFetch,
    openModal,
    closeModal,
    handleSubmitMovimiento,
    exportToCSV,
    exportToExcel,
  } = useFinanzas({ mode: 'admin' });

  if (loadingHermanos) {
    return (
      <div className="management-page">
        <div className="finanzas-loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="management-page finanzas-page">
      <div className="cuentas-header">
        <h1>Finanzas</h1>
        <p>Gestión financiera y libro mayor de movimientos</p>
      </div>

      <section className="finanzas-selector card">
        <div className="card-header">
          <h2>Seleccionar Logístico</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          {logisticas.length === 0 ? (
            <p>No hay usuarios logísticos disponibles.</p>
          ) : (
            <div className="finanzas-logisticas-grid">
              {logisticas.map((logistica) => (
                <div
                  key={logistica.id_usuario}
                  className={`finanzas-logistica-card ${selectedLogistica?.id_usuario === logistica.id_usuario ? 'selected' : ''}`}
                  onClick={() => handleSelectLogistica(logistica)}
                >
                  <h4>{logistica.nombre_usuario} {logistica.apellido_usuario}</h4>
                  <p>{logistica.email}</p>
                  <p>{logistica.celular}</p>
                  {logistica.empresas && logistica.empresas.length > 0 && (
                    <p className="finanzas-empresa">
                      {logistica.empresas[0].nombre_empresa} — {logistica.empresas[0].placa_vehiculo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {!selectedLogistica && (
        <div className="finanzas-empty-state">
          <p>Selecciona un usuario logístico para ver sus finanzas.</p>
        </div>
      )}

      {selectedLogistica && (
        <FinanzasView
          data={data}
          loading={loading}
          error={error}
          successMessage={successMessage}
          setSuccessMessage={setSuccessMessage}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          isAdmin={isAdmin}
          selectedLogistica={selectedLogistica}
          showModal={showModal}
          modalType={modalType}
          montoMovimiento={montoMovimiento}
          setMontoMovimiento={setMontoMovimiento}
          notaMovimiento={notaMovimiento}
          setNotaMovimiento={setNotaMovimiento}
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          procesando={procesando}
          monthOptions={monthOptions}
          handleMonthYearChange={handleMonthYearChange}
          retryFetch={retryFetch}
          openModal={openModal}
          closeModal={closeModal}
          handleSubmitMovimiento={handleSubmitMovimiento}
          exportToCSV={exportToCSV}
          exportToExcel={exportToExcel}
        />
      )}
    </div>
  );
};

export default FinanzasAdminPage;
