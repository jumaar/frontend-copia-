import React, { useMemo } from 'react';
import type {
  HistorialTiendaResponse,
  HistorialNeveraData,
  MesItem,
  ResumenGlobal,
} from '../../../types/historial-tienda.types';
import {
  formatMoneda,
  formatFecha,
  agruparConsolidados,
  filtrarPendientes,
  calcularLiquidacion,
} from '../useHistorialTienda';
import TransaccionesHeader from '../../../components/TransaccionesHeader/TransaccionesHeader';
import ConsolidatedTickets from '../../../components/ConsolidatedTickets/ConsolidatedTickets';
import type { ConsolidatedTicket } from '../../../components/ConsolidatedTickets/ConsolidatedTickets';
import Alert from '../../../components/Alert/Alert';
import './HistorialTiendaView.css';
import '../../../components/TablaTransacciones/TablaTransacciones.css';

interface HistorialTiendaViewProps {
  historial: HistorialTiendaResponse;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  mesesHistoricos: MesItem[];
  mesSeleccionado: { mes: number; año: number } | null;
  expandedNeveras: Set<number>;
  expandedConsolidados: Set<number>;
  expandedProductos: Set<string>;
  resumenGlobal: ResumenGlobal | null;
  toggleNevera: (id: number) => void;
  toggleConsolidado: (id: number) => void;
  toggleProducto: (key: string) => void;
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
  expandedConsolidados,
  expandedProductos,
  resumenGlobal,
  toggleNevera,
  toggleConsolidado,
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
      <div className="cuentas-header">
        <h1>Historial Tienda</h1>
        <p className="subtitle">
          Consulta el historial completo de movimientos por nevera en el mes seleccionado
        </p>
      </div>

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

          {resumenGlobal && neveras.length > 0 && (
            <div className="resumen-financiero">
              <div className="resumen-item">
                <span className="resumen-label">🏪 Tiendas hijas</span>
                <span className="resumen-value">{tiendaGroups.length}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">❄️ Total Neveras</span>
                <span className="resumen-value">{resumenGlobal.totalNeveras}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">📦 Empaques Pendientes</span>
                <span className="resumen-value">
                  {resumenGlobal.totalEmpaquesPendientes}
                  <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    {formatMoneda(resumenGlobal.montoTotalEmpaques)}
                  </span>
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">✅ Consolidados</span>
                <span className="resumen-value">
                  {resumenGlobal.totalConsolidados}
                  <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    {formatMoneda(resumenGlobal.montoTotalConsolidados)}
                  </span>
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">💰 Monto Pendientes</span>
                <span className="resumen-value">
                  {formatMoneda(resumenGlobal.montoTotalPendientes)}
                </span>
              </div>
            </div>
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

                    const totalEmpaques = neveraData.empaques?.reduce((sum: number, e: any) => {
                      const precioTienda = parseFloat(neveraData.productos?.find((p: any) => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
                      const { liquidar } = calcularLiquidacion(e, precioTienda, neveraData.promociones);
                      return sum + liquidar;
                    }, 0) || 0;

                    const totalPendientesTransacciones = pendientes.reduce((sum, t) => sum + (t.monto || 0), 0);

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
                              <span className="historial-nevera-stats-monto">💰 Monto Pendiente: {formatMoneda(totalEmpaques + totalPendientesTransacciones)}</span>
                            </div>
                          </div>
                          <span className="historial-nevera-toggle">{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isExpanded && (
                          <div className="historial-nevera-body">
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h4 className="historial-section-title">📦 Empaques Pendientes de Liquidación</h4>
                              {!neveraData.empaques?.length ? (
                                <p className="historial-empty-text">No hay empaques pendientes para liquidar.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {neveraData.productos?.map((producto: any) => {
                                    const empaquesProducto = neveraData.empaques?.filter((e: any) => e.id_producto === producto.id_producto) || [];
                                    if (empaquesProducto.length === 0) return null;
                                    const precioTiendaPorcentaje = parseFloat(producto.precio_tienda) || 0;
                                    const totalPrecio = empaquesProducto.reduce((s: number, e: any) => s + e.precio_venta_total, 0);
                                    const { descuento: td, precioConDescuento: tpcd, tiendaComision: tcom, liquidar: tliq } = empaquesProducto.reduce((acc: any, e: any) => {
                                      const r = calcularLiquidacion(e, precioTiendaPorcentaje, neveraData.promociones);
                                      return {
                                        descuento: acc.descuento + r.descuento,
                                        precioConDescuento: acc.precioConDescuento + r.precioConDescuento,
                                        tiendaComision: acc.tiendaComision + r.tiendaComision,
                                        liquidar: acc.liquidar + r.liquidar,
                                      };
                                    }, { descuento: 0, precioConDescuento: 0, tiendaComision: 0, liquidar: 0 });
                                    const key = `${neveraData.nevera.id_nevera}_${producto.id_producto}`;
                                    const isProdExpanded = expandedProductos.has(key);

                                    return (
                                      <div key={key} className="historial-producto-card">
                                        <button type="button" className="historial-producto-header" onClick={() => toggleProducto(key)}>
                                          <div>
                                            <span className="historial-producto-name">{producto.nombre_producto} (ID: {producto.id_producto})</span>
                                            <div className="historial-producto-meta">
                                              <span>{empaquesProducto.length} empaques</span>
                                              <span>Venta: {formatMoneda(totalPrecio)}</span>
                                              <span style={{ color: td > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                                Desc: {formatMoneda(td)}
                                              </span>
                                              <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                                                Liquidar: {formatMoneda(tliq)}
                                              </span>
                                            </div>
                                          </div>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>{isProdExpanded ? '▲' : '▼'}</span>
                                        </button>
                                        {isProdExpanded && (
                                          <div className="historial-producto-body">
                                            <table className="historial-table">
                                              <thead>
                                                <tr className="historial-table-header">
                                                  <th style={{ textAlign: 'left', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>ID</th>
                                                  <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Precio Venta</th>
                                                  <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Desc</th>
                                                  <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Venta Final</th>
                                                  <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Comision</th>
                                                  <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Liquidar</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {empaquesProducto.map((empaque: any, idx: number) => {
                                                  const r = calcularLiquidacion(empaque, precioTiendaPorcentaje, neveraData.promociones);
                                                  const promoAplicada = empaque.promocion ? neveraData.promociones?.find((p: any) => p.id_promocion === empaque.promocion) : null;
                                                  return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                      <td style={{ padding: '0.4rem', color: 'var(--color-text-primary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                          <span>{empaque.id_empaque}</span>
                                                          {promoAplicada && (
                                                            <span title={`${promoAplicada.nombre} (${promoAplicada.valor}%)`} className="badge estado-consolidado" style={{ fontSize: '0.65rem' }}>
                                                              -{promoAplicada.valor}%
                                                            </span>
                                                          )}
                                                        </div>
                                                      </td>
                                                      <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-text-primary)' }}>{formatMoneda(empaque.precio_venta_total)}</td>
                                                      <td style={{ padding: '0.4rem', textAlign: 'right', color: r.descuento > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                                        {r.descuento > 0 ? `-${formatMoneda(r.descuento)}` : '-'}
                                                      </td>
                                                      <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-success)' }}>{formatMoneda(r.precioConDescuento)}</td>
                                                      <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-error)' }}>{formatMoneda(r.tiendaComision)}</td>
                                                      <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '600' }}>{formatMoneda(r.liquidar)}</td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                              <tfoot>
                                                <tr className="historial-table-footer">
                                                  <td style={{ padding: '0.4rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>TOTAL</td>
                                                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{formatMoneda(totalPrecio)}</td>
                                                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-warning)' }}>{formatMoneda(td)}</td>
                                                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>{formatMoneda(tpcd)}</td>
                                                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-error)' }}>{formatMoneda(tcom)}</td>
                                                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatMoneda(tliq)}</td>
                                                </tr>
                                              </tfoot>
                                            </table>
                                            {precioTiendaPorcentaje > 0 && (
                                              <div className="historial-comision">
                                                * Comisión tienda: {precioTiendaPorcentaje}%
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                              <ConsolidatedTickets
                                variant="cliente"
                                consolidados={consolidados as ConsolidatedTicket[]}
                                expandedConsolidados={expandedConsolidados}
                                toggleConsolidado={toggleConsolidado}
                              />
                            </div>

                            {pendientes.length > 0 && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <h4 className="historial-section-title">⏳ Transacciones Pendientes ({pendientes.length})</h4>
                                <div className="tabla-container">
                                  <table className="transacciones-table">
                                    <thead>
                                      <tr>
                                        <th>ID</th>
                                        <th>ID Empaque</th>
                                        <th>Monto</th>
                                        <th>Costo Tienda</th>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Nota</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pendientes.map(t => (
                                        <tr key={t.id_transaccion} className="fila-pendiente">
                                          <td className="id-cell">{t.id_transaccion}</td>
                                          <td>{t.id_empaque ? t.id_empaque : <span className="badge estado-pendiente">Saldo</span>}</td>
                                          <td className="monto-cell">{formatMoneda(t.monto)}</td>
                                          <td className="monto-cell">{formatMoneda(t.costo_tienda ?? 0)}</td>
                                          <td>{t.hora_transaccion ? formatFecha(t.hora_transaccion) : '-'}</td>
                                          <td><span className="badge tipo-venta">{t.nombre_tipo_transaccion}</span></td>
                                          <td><span className="badge estado-pendiente">PENDIENTE</span></td>
                                          <td className="nota-cell"><span className="nota-text">{t.nota_opcional}</span></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
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
