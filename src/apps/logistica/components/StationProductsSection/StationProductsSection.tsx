import React from 'react';
import type { Estacion } from '../../types/logistica.types';

interface StationProductsSectionProps {
  estacion: Estacion;
  expandedProducts: Set<string>;
  confirmedProducts: Set<string>;
  onToggleProduct: (productId: number) => void;
  onConfirmar: (estacionId: string, productoId: number, productoName: string, cantidadTotal: number) => void;
}

const StationProductsSection: React.FC<StationProductsSectionProps> = ({
  estacion,
  expandedProducts,
  confirmedProducts,
  onToggleProduct,
  onConfirmar,
}) => (
  <section className="products-container card" style={{ marginBottom: '2rem' }}>
    <h2>
      Empaques de la Estación {estacion.id_estacion}  ,
      ( Cantidad total {estacion.total_empaques} empaques, {(estacion.peso_total_g / 1000).toFixed(2)} kg)
    </h2>
    {estacion.productos.length === 0 ? (
      <p>No hay productos para mostrar en esta estación.</p>
    ) : (
      <div className="products-container" style={{ overflowX: 'auto' }}>
        <table className="products-table" style={{ marginTop: '1rem', minWidth: '950px' }}>
          <tbody>
            {estacion.productos.map((producto) => {
              const productKey = `${estacion.id_estacion}-${producto.id_producto}`;
              const isExpanded = expandedProducts.has(producto.id_producto.toString());
              const isConfirmed = confirmedProducts.has(productKey);

              return (
                <React.Fragment key={productKey}>
                  <tr
                    className="product-header-row"
                    style={{
                      backgroundColor: 'var(--color-hover-bg)',
                      borderBottom: '2px solid var(--color-border)'
                    }}
                  >
                    <td colSpan={6}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem',
                        gap: '1rem'
                      }}>
                        <span style={{
                          fontWeight: 'bold',
                          color: 'var(--color-text-primary)'
                        }}>
                          {producto.id_producto} - {producto.nombre_producto} ({producto.peso_nominal_g}g)
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => onToggleProduct(producto.id_producto)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: 'var(--color-primary)',
                              textDecoration: 'underline',
                              padding: '0.25rem 0.5rem'
                            }}
                          >
                            Ver {producto.cantidad_total} empaques {isExpanded ? '▲' : '▼'}
                          </button>
                          <button
                            onClick={() => onConfirmar(estacion.id_estacion, producto.id_producto, producto.nombre_producto, producto.cantidad_total)}
                            disabled={isConfirmed}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: isConfirmed
                                ? 'var(--color-text-secondary)'
                                : 'var(--color-success)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--border-radius-md)',
                              cursor: isConfirmed ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              opacity: isConfirmed ? 0.7 : 1
                            }}
                          >
                            {isConfirmed ? '✅ Confirmado' : 'Confirmar'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <>
                      <tr
                        className="empaque-header-row"
                        style={{
                          backgroundColor: 'var(--color-card-bg)',
                          fontWeight: 'bold',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        <th style={{ width: '65px' }}>ID</th>
                        <th style={{ width: '200px' }}>Producto</th>
                        <th style={{ width: '100px' }}>Peso</th>
                        <th>EPC</th>
                        <th>Fecha</th>
                      </tr>
                      {producto.empaques.map((empaque) => (
                        <tr key={empaque.epc} style={{ borderBottom: '1px solid var(--color-border)' }}>
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

export default StationProductsSection;
