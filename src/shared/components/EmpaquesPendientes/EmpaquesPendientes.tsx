import React from 'react';
import { formatMoneda } from '../../config/format';
import type { EmpaquePendiente, ProductoPendiente, Promocion } from '../../types/cuentas-tienda.types';
import './EmpaquesPendientes.css';

interface EmpaquesPendientesProps {
  empaques: EmpaquePendiente[];
  productos: ProductoPendiente[];
  promociones: Promocion[];
  expandedProductos: Set<number>;
  onToggleProducto: (idProducto: number) => void;
}

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

const EmpaquesPendientes: React.FC<EmpaquesPendientesProps> = ({
  empaques,
  productos,
  promociones,
  expandedProductos,
  onToggleProducto,
}) => {
  if (!empaques.length) return null;

  const totalLiquidar = empaques.reduce((sum, e) => {
    const producto = productos.find(p => p.id_producto === e.id_producto);
    if (!producto) return sum;
    const { liquidar } = calcularLiquidacion(e, producto, promociones);
    return sum + liquidar;
  }, 0);

  return (
    <div className="empaques-container">
      <h3 className="empaques-title">
        📦 Empaques Pendientes de Liquidación
      </h3>

      <div className="producto-list">
        {productos.map(producto => {
          const empaquesProducto = empaques.filter(e => e.id_producto === producto.id_producto) || [];
          if (empaquesProducto.length === 0) return null;

          const totalPrecio = empaquesProducto.reduce((sum, e) => sum + e.precio_venta_total, 0);
          const totalDescuento = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, promociones).descuento, 0);
          const totalComision = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, promociones).tiendaComision, 0);
          const totalLiquidarProducto = empaquesProducto.reduce((sum, e) => sum + calcularLiquidacion(e, producto, promociones).liquidar, 0);
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
                      Liquidar: {formatMoneda(totalLiquidarProducto)}
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
                        const { descuento, precioConDescuento, tiendaComision, liquidar } = calcularLiquidacion(empaque, producto, promociones);
                        const promoAplicada = empaque.promocion ? promociones.find(p => p.id_promocion === empaque.promocion) : null;
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
                        <td className="liquidacion-tfoot-td-right" style={{ color: 'var(--color-primary)' }}>{formatMoneda(totalLiquidarProducto)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        <div className="liquidacion-total">
          TOTAL A LIQUIDAR: {formatMoneda(totalLiquidar)}
        </div>
      </div>
    </div>
  );
};

export type { EmpaquesPendientesProps };
export default EmpaquesPendientes;
