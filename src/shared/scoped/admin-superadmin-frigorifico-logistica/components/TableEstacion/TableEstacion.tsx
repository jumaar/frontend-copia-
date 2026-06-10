import React from 'react';
import './TableEstacion.css';

interface EmpaqueItem {
  epc: string;
  peso_g: string;
  precio_venta_total: number;
  fecha_empaque: string;
  id?: number;
}

interface ProductoItem {
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  cantidad_total: number;
  peso_total_g: number;
  empaques: EmpaqueItem[];
}

interface EstacionItem {
  id_estacion: string;
  total_empaques: number;
  peso_total_g: number;
  productos: ProductoItem[];
}

interface TableEstacionProps {
  estacion: EstacionItem;
  expandedProducts: Set<string>;
  confirmedProducts: Set<string>;
  onToggleProduct: (productId: number) => void;
  onConfirmar: (estacionId: string, productoId: number, productoName: string, cantidadTotal: number) => void;
}

const TableEstacion: React.FC<TableEstacionProps> = ({
  estacion,
  expandedProducts,
  confirmedProducts,
  onToggleProduct,
  onConfirmar,
}) => (
  <section className="table-estacion card" style={{ marginBottom: '2rem' }}>
    <h2 className="table-estacion-title">
      Estación {estacion.id_estacion} — {estacion.total_empaques} empaques, {(estacion.peso_total_g / 1000).toFixed(2)} kg
    </h2>
    {estacion.productos.length === 0 ? (
      <p className="table-estacion-empty">No hay productos para mostrar en esta estación.</p>
    ) : (
      <div className="table-estacion-scroll">
        <table className="table-estacion-table">
          <tbody>
            {estacion.productos.map((producto) => {
              const productKey = `${estacion.id_estacion}-${producto.id_producto}`;
              const isExpanded = expandedProducts.has(producto.id_producto.toString());
              const isConfirmed = confirmedProducts.has(productKey);

              return (
                <React.Fragment key={productKey}>
                  <tr className="product-header-row">
                    <td colSpan={6}>
                      <div className="product-header-content">
                        <span className="product-header-name">
                          {producto.id_producto} - {producto.nombre_producto} ({producto.peso_nominal_g}g)
                        </span>
                        <div className="product-header-actions">
                          <button
                            type="button"
                            onClick={() => onToggleProduct(producto.id_producto)}
                            className="product-toggle-btn"
                          >
                            Ver {producto.cantidad_total} empaques {isExpanded ? '▲' : '▼'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onConfirmar(estacion.id_estacion, producto.id_producto, producto.nombre_producto, producto.cantidad_total)}
                            disabled={isConfirmed}
                            className={`product-confirm-btn ${isConfirmed ? 'confirmed' : ''}`}
                          >
                            {isConfirmed ? '✅ Confirmado' : 'Confirmar'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <>
                      <tr className="empaque-header-row">
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Peso</th>
                        <th>EPC</th>
                        <th>Fecha</th>
                      </tr>
                      {producto.empaques.map((empaque) => (
                        <tr key={empaque.epc} className="empaque-row">
                          <td>{producto.id_producto}</td>
                          <td>{producto.nombre_producto}</td>
                          <td>{empaque.peso_g} g</td>
                          <td>{empaque.epc}</td>
                          <td>{new Date(empaque.fecha_empaque).toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export type { TableEstacionProps, EstacionItem, ProductoItem, EmpaqueItem };
export default TableEstacion;
