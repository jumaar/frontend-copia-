import React from 'react';
import TablaTransacciones from '../TablaTransacciones/TablaTransacciones';
import MesesDropdown from '../MesesDropdown/MesesDropdown';
import { formatMoneda } from '../../config/format';
import type { TransaccionesData, EmpaquePendiente, ProductoPendiente, Promocion, MesItem } from '../../types/cuentas-tienda.types';

interface CuentasTiendaViewProps {
  transacciones: TransaccionesData;
  loading: boolean;
  error: string | null;
  neveraSeleccionada: number | null;
  tiendaSeleccionada: number | null;
  expandedProductos: Set<number>;
  mesesHistoricos: MesItem[];
  mesSeleccionado: { mes: number; año: number } | null;
  saldoTotalLiquidar: number;
  onToggleProducto: (idProducto: number) => void;
  onConsultarMes: (mes: number, año: number) => void;
}

const CuentasTiendaView: React.FC<CuentasTiendaViewProps> = ({
  transacciones,
  loading,
  error,
  neveraSeleccionada,
  tiendaSeleccionada,
  expandedProductos,
  mesesHistoricos,
  mesSeleccionado,
  saldoTotalLiquidar,
  onToggleProducto,
  onConsultarMes,
}) => {
  const calcularLiquidacion = (empaque: EmpaquePendiente, producto: ProductoPendiente, promociones: Promocion[]) => {
    const precioTiendaPorcentaje = parseFloat(producto.precio_tienda) || 0;
    let descuento = 0;
    let precioConDescuento = empaque.precio_venta_total;
    if (empaque.promocion) {
      const promo = promociones.find(p => p.id_promocion === empaque.promocion);
      if (promo && promo.valor > 0) {
        descuento = Math.ceil(empaque.precio_venta_total * (promo.valor / 100));
        precioConDescuento = empaque.precio_venta_total - descuento;
      }
    }
    const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
    const liquidar = Math.ceil(precioConDescuento - tiendaComision);
    return { descuento, precioConDescuento, tiendaComision, liquidar, precioTiendaPorcentaje };
  };

  return (
    <div>
      {transacciones && tiendaSeleccionada && neveraSeleccionada && transacciones.transacciones && (
        (() => {
          const pendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').length;
          const consolidados = transacciones.transacciones.filter(t => t.nombre_tipo_transaccion === 'ticket_consolidado').length;
          const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
          const montoTotalMes = transacciones.transacciones.filter(t =>
            t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
          ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + t.monto, 0);
          const montoTiendaMes = transacciones.transacciones.filter(t =>
            t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
          ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + (t.costo_tienda || 0), 0);
          const saldoALiquidar = transacciones?.empaques?.length ? saldoTotalLiquidar : 0;

          return (
            <div className="resumen-financiero">
              <div className="resumen-item">
                <span className="resumen-label">📊 Total Transacciones:</span>
                <span className="resumen-value">{transacciones.total_transacciones}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">⏳ Pendientes:</span>
                <span className="resumen-value">{transacciones?.empaques?.length || pendientes}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">✅ Consolidados:</span>
                <span className="resumen-value">{consolidados}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">💰 Saldo Total (Pendientes):</span>
                <span className="resumen-value">{formatMoneda(saldoTotalPendientes + saldoALiquidar)}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">📅 Monto del Mes:</span>
                <span className="resumen-value">{formatMoneda(montoTotalMes)}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">🏪 Monto Tienda Mes:</span>
                <span className="resumen-value">{formatMoneda(montoTiendaMes)}</span>
              </div>
            </div>
          );
        })()
      )}

      {transacciones && (
        <div className="transacciones-container">
          <TablaTransacciones
            data={transacciones}
            loading={loading}
            error={error}
            headerControls={
              mesesHistoricos.length > 0 ? (
                <MesesDropdown
                  meses={mesesHistoricos}
                  seleccionado={mesSeleccionado}
                  onSelect={onConsultarMes}
                  loading={loading}
                />
              ) : null
            }
          />
        </div>
      )}

      {neveraSeleccionada && (
        <div className="empaques-container" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            📦 Empaques Pendientes de Liquidación
          </h3>

          {!transacciones?.empaques?.length ? (
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              No hay empaques pendientes para liquidar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {transacciones.productos?.map(producto => {
                const empaquesProducto = transacciones.empaques?.filter(e => e.id_producto === producto.id_producto) || [];
                if (empaquesProducto.length === 0) return null;

                const totalPrecio = empaquesProducto.reduce((sum, e) => sum + e.precio_venta_total, 0);
                const totalDescuento = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, transacciones.promociones).descuento, 0);
                const totalComision = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, transacciones.promociones).tiendaComision, 0);
                const totalLiquidar = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, transacciones.promociones).liquidar, 0);
                const isExpanded = expandedProductos.has(producto.id_producto);

                return (
                  <div key={producto.id_producto} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => onToggleProducto(producto.id_producto)}
                      style={{
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem', backgroundColor: 'var(--color-hover-bg)',
                        border: 'none', cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                          {producto.nombre_producto} (ID: {producto.id_producto})
                        </span>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          <span>{empaquesProducto.length} empaques</span>
                          <span>Venta: {formatMoneda(totalPrecio)}</span>
                          <span>Desc: {formatMoneda(totalDescuento)}</span>
                          <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                            Liquidar: {formatMoneda(totalLiquidar)}
                          </span>
                        </div>
                      </div>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '1rem', backgroundColor: 'var(--color-card-bg)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                              <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>ID</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Precio Venta</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Desc</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Venta Final</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Comision</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Liquidar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empaquesProducto.map((empaque, index) => {
                              const { descuento, precioConDescuento, tiendaComision, liquidar } = calcularLiquidacion(empaque, producto, transacciones.promociones);
                              const promoAplicada = empaque.promocion ? transacciones.promociones?.find(p => p.id_promocion === empaque.promocion) : null;
                              return (
                                <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  <td style={{ padding: '0.5rem', color: 'var(--color-text-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span>{empaque.id_empaque}</span>
                                      {promoAplicada && (
                                        <span title={`${promoAplicada.nombre} (${promoAplicada.valor}%)`} style={{
                                          backgroundColor: 'var(--color-success)', color: 'white',
                                          padding: '0.15rem 0.4rem', borderRadius: '4px',
                                          fontSize: '0.7rem', fontWeight: 'bold', cursor: 'help'
                                        }}>
                                          -{promoAplicada.valor}%
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-text-primary)' }}>{formatMoneda(empaque.precio_venta_total)}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: descuento > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                    {descuento > 0 ? `-${formatMoneda(descuento)}` : '-'}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-success)' }}>{formatMoneda(precioConDescuento)}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-error)' }}>{formatMoneda(tiendaComision)}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '600' }}>{formatMoneda(liquidar)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>TOTAL</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{formatMoneda(totalPrecio)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-warning)' }}>{formatMoneda(totalDescuento)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>{formatMoneda(totalPrecio - totalDescuento)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-error)' }}>{formatMoneda(totalComision)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatMoneda(totalLiquidar)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{
                marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-success)',
                color: 'white', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem'
              }}>
                TOTAL A LIQUIDAR: {formatMoneda(
                  transacciones.empaques?.reduce((sum, e) => {
                    const producto = transacciones.productos?.find((p: ProductoPendiente) => p.id_producto === e.id_producto);
                    if (!producto) return sum;
                    const { liquidar } = calcularLiquidacion(e, producto, transacciones.promociones);
                    return sum + liquidar;
                  }, 0) || 0
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CuentasTiendaView;
