import React from 'react';
import { useLogisticaGestion } from '../hooks/useLogisticaGestion';
import ProveedorSelector from '../../../shared/components/ProveedorSelector/ProveedorSelector';
import FrigorificoCard from '../../../shared/scoped/admin-superadmin-frigorifico-logistica/components/FrigorificoCard/FrigorificoCard';
import EPCSearchBar from '../../../shared/scoped/admin-superadmin-frigorifico-logistica/components/EPCSearchBar/EPCSearchBar';
import EmpaqueSearchResult from '../../../shared/scoped/admin-superadmin-frigorifico-logistica/components/EmpaqueSearchResult/EmpaqueSearchResult';
import Alert from '../../../shared/components/Alert/Alert';

const LogisticaGestionPage: React.FC = () => {
  const {
    hermanos,
    loading,
    consultingUser,
    loadingDetalle,
    error,
    setError,
    hasLogisticaData,
    selectedUserName,
    selectedUserData,
    frigorificoSeleccionado,
    frigorificoDetallado,
    searchEPC,
    setSearchEPC,
    searchResult,
    expandedProducts,
    confirmedProducts,
    handleConsultUser,
    cargarDetalleFrigorifico,
    handleSearch,
    handleKeyPress,
    toggleProductExpansion,
    handleConfirmarCambioEstado,
  } = useLogisticaGestion();

  const handleSelectProveedor = (id: string | number) => {
    const numId = Number(id);
    const hermano = hermanos.find(h => h.id_usuario === numId);
    if (hermano) {
      handleConsultUser(numId, `${hermano.nombre_usuario} ${hermano.apellido_usuario}`);
    }
  };

  const handleSelectFrigorifico = (id: string | number) => {
    cargarDetalleFrigorifico(Number(id));
  };

  const proveedorActual = React.useMemo(() => {
    return hermanos.find(h => `${h.nombre_usuario} ${h.apellido_usuario}` === selectedUserName) ?? null;
  }, [hermanos, selectedUserName]);

  if (loading && hermanos.length === 0) {
    return <div className="management-page">Cargando...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventarios en Frigoríficos</h1>
        <p>Empaques por estación pendientes de recogida</p>
      </div>

      <ProveedorSelector
        title="SELECCIONAR PROVEEDOR:"
        options={hermanos.map(h => ({ id: h.id_usuario, label: `${h.nombre_usuario} ${h.apellido_usuario}` }))}
        selectedId={null}
        onSelect={handleSelectProveedor}
        placeholder="Selecciona un proveedor..."
        disabled={!hasLogisticaData}
        loading={consultingUser !== null}
        actionLabel="Consultar"
        renderLabel={(option, _isSelected) => {
          const hermano = hermanos.find(h => h.id_usuario === option.id);
          return (
            <span>
              ❄️ {option.label}
              {hermano?.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({hermano.email})</span>}
            </span>
          );
        }}
      />

      {error && !selectedUserData && (
        <Alert type="error" message={error} onDismiss={() => setError(null)} />
      )}

      {selectedUserData && selectedUserData.frigorificos.length > 0 && (
        <ProveedorSelector
          title="SELECCIONAR FRIGORÍFICO:"
          options={selectedUserData.frigorificos.map(f => ({
            id: f.id_frigorifico,
            label: `${f.nombre_frigorifico} — ${f.ciudad?.nombre_ciudad || 'Sin ciudad'}`,
          }))}
          selectedId={frigorificoSeleccionado}
          onSelect={handleSelectFrigorifico}
          placeholder="Selecciona un frigorífico..."
          loading={loadingDetalle}
          actionLabel="Ver"
        />
      )}

      {error && selectedUserData && (
        <Alert type="error" message={error} onDismiss={() => setError(null)} />
      )}

      {searchResult && (
        <EmpaqueSearchResult result={searchResult} userName={selectedUserName} />
      )}

      {frigorificoDetallado && (
        <>
          <EPCSearchBar
            searchEPC={searchEPC}
            onSearchEPCChange={setSearchEPC}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
            disabled={consultingUser !== null}
            label="Búsqueda por EPC"
            proveedorNombre={selectedUserData?.usuario_actual?.nombre_completo}
            proveedorEmail={proveedorActual?.email}
            proveedorCelular={proveedorActual?.celular ? String(proveedorActual.celular) : undefined}
            frigorificoNombre={frigorificoDetallado.nombre_frigorifico}
            frigorificoDireccion={frigorificoDetallado.direccion}
          />

          <FrigorificoCard
            frigorifico={frigorificoDetallado}
            expandedProducts={expandedProducts}
            confirmedProducts={confirmedProducts}
            onToggleProduct={toggleProductExpansion}
            onConfirmar={handleConfirmarCambioEstado}
          />
        </>
      )}
    </div>
  );
};

export default LogisticaGestionPage;
