import React from 'react';
import TablaTransacciones from '../../../components/TablaTransacciones/TablaTransacciones';
import { formatMoneda } from '../../../config/format';
import type { TransaccionesData, EmpaquePendiente, ProductoPendiente, Promocion, MesItem } from '../../../types/cuentas-tienda.types';
import './CuentasTiendaView.css';

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
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={onConsultarMes}
          />
        </div>
      )}

      {neveraSeleccionada && (
        <div className="empaques-container">
          <h3 className="empaques-title">
            📦 Empaques Pendientes de Liquidación
          </h3>

          {!transacciones?.empaques?.length ? (
            <p className="empaques-empty">
              No hay empaques pendientes para liquidar.
            </p>
          ) : (
            <div className="producto-list">
              {transacciones.productos?.map(producto => {
                const empaquesProducto = transacciones.empaques?.filter(e => e.id_producto === producto.id_producto) || [];
                if (empaquesProducto.length === 0) return null;

                const totalPrecio = empaquesProducto.reduce((sum, e) => sum + e.precio_venta_total, 0);
                const totalDescuento = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, transacciones.promociones).descuento, 0);
                const totalComision = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, transacciones.promociones).tiendaComision, 0);
                const totalLiquidar = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, transacciones.promociones).liquidar, 0);
                const isExpanded = expandedProductos.has(producto.id_producto);

                return (
                  <div key={producto.id_producto} className="producto-card">
                    <button
                      type="button"
                      onClick={() => onToggleProducto(producto.id_producto)}
                      className="producto-header"
                    >
                      <div className="producto-info">
                        <span className="producto-name">
                          {producto.nombre_producto} (ID: {producto.id_producto})
                        </span>
                        <div className="producto-meta">
                          <span>{empaquesProducto.length} empaques</span>
                          <span>Venta: {formatMoneda(totalPrecio)}</span>
                          <span>Desc: {formatMoneda(totalDescuento)}</span>
                          <span className="producto-liquidar">
                            Liquidar: {formatMoneda(totalLiquidar)}
                          </span>
                        </div>
                      </div>
                      <span className="producto-toggle">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="producto-body">
                        <table className="liquidacion-table">
                          <thead>
                            <tr className="liquidacion-thead-tr">
                              <th className="liquidacion-th">ID</th>
                              <th className="liquidacion-th-right">Precio Venta</th>
                              <th className="liquidacion-th-right">Desc</th>
                              <th className="liquidacion-th-right">Venta Final</th>
                              <th className="liquidacion-th-right">Comision</th>
                              <th className="liquidacion-th-right">Liquidar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empaquesProducto.map((empaque, index) => {
                              const { descuento, precioConDescuento, tiendaComision, liquidar } = calcularLiquidacion(empaque, producto, transacciones.promociones);
                              const promoAplicada = empaque.promocion ? transacciones.promociones?.find(p => p.id_promocion === empaque.promocion) : null;
                              return (
                                <tr key={index} className="liquidacion-tr">
                                  <td className="liquidacion-td">
                                    <div className="id-cell-row">
                                      <span>{empaque.id_empaque}</span>
                                      {promoAplicada && (
                                        <span title={`${promoAplicada.nombre} (${promoAplicada.valor}%)`} className="promo-badge">
                                          -{promoAplicada.valor}%
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="liquidacion-td-right">{formatMoneda(empaque.precio_venta_total)}</td>
                                  <td className="liquidacion-td-right" style={{ color: descuento > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                    {descuento > 0 ? `-${formatMoneda(descuento)}` : '-'}
                                  </td>
                                  <td className="liquidacion-td-right" style={{ color: 'var(--color-success)' }}>{formatMoneda(precioConDescuento)}</td>
                                  <td className="liquidacion-td-right" style={{ color: 'var(--color-error)' }}>{formatMoneda(tiendaComision)}</td>
                                  <td className="liquidacion-td-right" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{formatMoneda(liquidar)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="liquidacion-tfoot-tr">
                              <td className="liquidacion-tfoot-td">TOTAL</td>
                              <td className="liquidacion-tfoot-td-right">{formatMoneda(totalPrecio)}</td>
                              <td className="liquidacion-tfoot-td-right" style={{ color: 'var(--color-warning)' }}>{formatMoneda(totalDescuento)}</td>
                              <td className="liquidacion-tfoot-td-right" style={{ color: 'var(--color-success)' }}>{formatMoneda(totalPrecio - totalDescuento)}</td>
                              <td className="liquidacion-tfoot-td-right" style={{ color: 'var(--color-error)' }}>{formatMoneda(totalComision)}</td>
                              <td className="liquidacion-tfoot-td-right" style={{ color: 'var(--color-primary)' }}>{formatMoneda(totalLiquidar)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="liquidacion-total">
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
