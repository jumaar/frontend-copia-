import React from 'react';
import { useLogisticaGestion } from '../hooks/useLogisticaGestion';
import UserListItem from '../components/UserListItem/UserListItem';
import FrigorificoHeader from '../components/FrigorificoHeader/FrigorificoHeader';
import EPCSearchBar from '../components/EPCSearchBar/EPCSearchBar';
import EmpaqueSearchResult from '../components/EmpaqueSearchResult/EmpaqueSearchResult';
import StationProductsSection from '../components/StationProductsSection/StationProductsSection';
import SummaryCard from '../../../shared/components/SummaryCard/SummaryCard';
import Alert from '../../../shared/components/Alert/Alert';

const LogisticaGestionPage: React.FC = () => {
  const {
    hermanos,
    loading,
    consultingUser,
    error,
    setError,
    hasLogisticaData,
    selectedFrigorifico,
    selectedUserName,
    selectedUserData,
    productosHoy,
    pesoTotal,
    searchEPC,
    setSearchEPC,
    searchResult,
    expandedProducts,
    confirmedProducts,
    allEstaciones,
    handleConsultUser,
    handleSearch,
    handleKeyPress,
    toggleProductExpansion,
    handleConfirmarCambioEstado,
  } = useLogisticaGestion();

  if (loading && hermanos.length === 0) {
    return <div className="management-page">Cargando...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventarios en Frigoríficos</h1>
        <p>Empaques por estación pendientes de recogida</p>
      </div>

      <section className="card" style={{ marginBottom: '2rem', marginTop: 'calc(var(--spacing-unit) * -4)' }}>
        <div style={{ padding: '1rem' }}>
          {hermanos.length === 0 ? (
            <p>No hay usuarios Frigorificos disponibles.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {hermanos.map((hermano) => (
                <UserListItem
                  key={hermano.id_usuario}
                  hermano={hermano}
                  onConsult={handleConsultUser}
                  consultingUser={consultingUser}
                  hasLogisticaData={hasLogisticaData}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedFrigorifico && (
        <FrigorificoHeader frigorifico={selectedFrigorifico} userName={selectedUserName} />
      )}

      {selectedUserData && (
        <>
          <div className="dashboard-summary" style={{ marginBottom: '2rem' }}>
            <SummaryCard
              title="Productos Hoy"
              value={String(productosHoy)}
              description="Cantidad total de empaques"
            />
            <SummaryCard
              title="Peso Total"
              value={`${pesoTotal.toFixed(2)} kg`}
              description="Suma de pesos en kg"
            />
          </div>

          <EPCSearchBar
            searchEPC={searchEPC}
            onSearchEPCChange={setSearchEPC}
            onSearch={() => handleSearch()}
            onKeyPress={handleKeyPress}
            disabled={consultingUser !== null}
            label={`Búsqueda por EPC - ${selectedUserName}`}
          />

          {error && selectedUserData && (
            <p style={{ color: 'red', padding: '0 1rem' }}>{error}</p>
          )}

          {searchResult && (
            <EmpaqueSearchResult result={searchResult} userName={selectedUserName} />
          )}

          {allEstaciones.map((estacion) => (
            <StationProductsSection
              key={estacion.id_estacion}
              estacion={estacion}
              expandedProducts={expandedProducts}
              confirmedProducts={confirmedProducts}
              onToggleProduct={toggleProductExpansion}
              onConfirmar={handleConfirmarCambioEstado}
            />
          ))}
        </>
      )}

      {error && !selectedUserData && (
        <Alert type="error" message={error} onDismiss={() => setError(null)} />
      )}
    </div>
  );
};

export default LogisticaGestionPage;
