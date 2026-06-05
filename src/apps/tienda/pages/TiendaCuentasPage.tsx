import React from 'react';
import { useCuentasTienda } from '../../../shared/hooks/useCuentasTienda';
import CuentasTiendaView from '../../../shared/components/CuentasTiendaView/CuentasTiendaView';
import '../../../shared/components/TablaTransacciones/TablaTransacciones.css';

const TiendaCuentasPage: React.FC = () => {
  const {
    transacciones,
    loading,
    error,
    neveraSeleccionada,
    tiendaSeleccionada,
    expandedProductos,
    mesesHistoricos,
    mesSeleccionado,
    saldoTotalLiquidar,
    setExpandedProductos,
    consultarMesEspecifico,
  } = useCuentasTienda({ mode: 'self' });

  const toggleProducto = (id: number) => {
    const next = new Set(expandedProductos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProductos(next);
  };

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        <h1>Mis Cuentas</h1>
        <p className="subtitle">
          Consulta tus transacciones de productos pendientes y consolidados
        </p>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
            <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
            <span>Cargando transacciones...</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

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

      {!transacciones && !loading && !error && (
        <div className="no-selection-message">
          <div className="no-selection-content">
            <span className="no-selection-icon">📋</span>
            <h3>No hay datos disponibles</h3>
            <p>No se encontraron transacciones para tu cuenta.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiendaCuentasPage;
