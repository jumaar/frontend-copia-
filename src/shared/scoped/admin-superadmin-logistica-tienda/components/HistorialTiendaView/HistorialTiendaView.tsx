import React, { useMemo } from 'react';
import type {
  HistorialTiendaResponse,
  HistorialNeveraData,
  MesItem,
  ResumenGlobal,
} from '../../../../types/historial-tienda.types';
import {
  formatMoneda,
  agruparConsolidados,
  filtrarPendientes,
} from '../../hooks/useHistorialTienda';
import TransaccionesHeader from '../../../../components/TransaccionesHeader/TransaccionesHeader';
import SummaryCard from '../../../../components/SummaryCard/SummaryCard';
import LibroMayor from '../../../../components/LibroMayor/LibroMayor';
import Alert from '../../../../components/Alert/Alert';
import './HistorialTiendaView.css';

interface HistorialTiendaViewProps {
  historial: HistorialTiendaResponse;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  mesesHistoricos: MesItem[];
  mesSeleccionado: { mes: number; año: number } | null;
  expandedNeveras: Set<number>;
  expandedConsolidados: Set<number>;
  expandedProductos: Map<number, Set<number>>;
  resumenGlobal: ResumenGlobal | null;
  toggleNevera: (id: number) => void;
  toggleConsolidado: (id: number) => void;
  toggleProducto: (neveraId: number, idProducto: number) => void;
  consultarMesEspecifico: (mes: number, año: number) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
}

interface TiendaGroup {
  id_tienda: number;
  nombre_tienda: string;
  neveras: HistorialNeveraData[];
}

function agruparNeverasPorTienda(neveras: HistorialNeveraData[]): TiendaGroup[] {
  const groupsMap = new Map<number, TiendaGroup>();
  neveras.forEach(neveraData => {
    const tiendaId = neveraData.nevera.id_tienda;
    const tiendaNombre = neveraData.nevera.nombre_tienda;
    if (!groupsMap.has(tiendaId)) {
      groupsMap.set(tiendaId, { id_tienda: tiendaId, nombre_tienda: tiendaNombre, neveras: [] });
    }
    groupsMap.get(tiendaId)!.neveras.push(neveraData);
  });
  return Array.from(groupsMap.values());
}

const HistorialTiendaView: React.FC<HistorialTiendaViewProps> = ({
  historial,
  loading,
  error,
  successMessage,
  mesesHistoricos,
  mesSeleccionado,
  expandedNeveras,
  expandedProductos,
  resumenGlobal,
  toggleNevera,
  toggleProducto,
  consultarMesEspecifico,
  setError,
  setSuccessMessage,
}) => {
  const infoUsuario = historial;
  const neveras = historial?.neveras || [];
  const tiendaGroups = useMemo(() => agruparNeverasPorTienda(neveras), [neveras]);

  return (
    <div className="cuentas-page">
      {successMessage && (
        <Alert message={successMessage} onDismiss={() => setSuccessMessage(null)} type="success" />
      )}

      {error && (
        <Alert message={error} onDismiss={() => setError(null)} type="error" />
      )}

      {historial && infoUsuario && (
        <div className="tabla-transacciones">
          <TransaccionesHeader
            title={`${infoUsuario.nombre_usuario} ${infoUsuario.apellido_usuario}`}
            titleSize="large"
            periodo={infoUsuario.periodo}
            esPeriodoActual={infoUsuario.parametros_usados?.es_periodo_actual || false}
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={consultarMesEspecifico}
            loading={loading}
          />

          {resumenGlobal && (
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'calc(var(--spacing-unit) * 2)', marginBottom: 'calc(var(--spacing-unit) * 3)' }}>
              <SummaryCard title="Empaques Pend." value={String(resumenGlobal.totalEmpaquesPendientes)} description={formatMoneda(resumenGlobal.montoTotalEmpaques)} variant="warning" />
              <SummaryCard title="Consolidados" value={String(resumenGlobal.totalConsolidados)} description={formatMoneda(resumenGlobal.montoTotalConsolidados)} variant="success" />
              <SummaryCard title="Monto Pend." value={formatMoneda(resumenGlobal.montoTotalPendientes)} description="Saldo pendiente" variant="danger" />
            </section>
          )}

          {neveras.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              <p>No se encontraron neveras con movimientos en este período.</p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tiendaGroups.map(group => (
              <div key={group.id_tienda} className="historial-tienda-group">
                <div className="historial-tienda-group-header">
                  <h3 className="historial-tienda-group-title">
                    🏪 {group.nombre_tienda}
                  </h3>
                  <span className="historial-tienda-group-meta">
                    {group.neveras.length} nevera{group.neveras.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="historial-tienda-group-neveras">
                  {group.neveras.map(neveraData => {
                    const isExpanded = expandedNeveras.has(neveraData.nevera.id_nevera);
                    const consolidados = agruparConsolidados(neveraData.transacciones);
                    const pendientes = filtrarPendientes(neveraData.transacciones);

                    return (
                      <div key={neveraData.nevera.id_nevera} className="historial-nevera-card">
                        <button type="button" className="historial-nevera-header-btn" onClick={() => toggleNevera(neveraData.nevera.id_nevera)}>
                          <div>
                            <h3 className="historial-nevera-title">
                              ❄️ Nevera #{neveraData.nevera.id_nevera}
                            </h3>
                            <div className="historial-nevera-stats">
                              <span>📦 {neveraData.empaques?.length || 0} empaques pendientes</span>
                              <span>✅ {consolidados.length} consolidados</span>
                              <span>⏳ {pendientes.length} transacciones pendientes</span>
                            </div>
                          </div>
                          <span className="historial-nevera-toggle">{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isExpanded && (
                          <div className="historial-nevera-body">
                            {neveraData.transacciones && neveraData.transacciones.length > 0 && (
                              <LibroMayor
                                transactions={neveraData.transacciones}
                                selectedMonth={infoUsuario.periodo.mes}
                                selectedYear={infoUsuario.periodo.año}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export type { HistorialTiendaViewProps };
export default HistorialTiendaView;
