import React, { useState, useEffect } from 'react';
import { getLogistica } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './LogisticaPage.css';


// Interface para la respuesta de logística que incluye el inventario
interface Empaque {
  peso_exacto_g: string;
  EPC_id: string;
}

interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal: number; // El peso nominal viene directamente de la API
  empaques: Empaque[];
}

interface LogisticaInventarioResponse {
  productos_por_logistica: Producto[];
  total_productos_diferentes: number;
  total_empaques: number;
  id_logistica_usuario: number;
}

// Interface para manejar la posible estructura de la respuesta de logística
interface LogisticaData {
  id_logistica: number;
  nombre_empresa: string;
  placa_vehiculo: string;
}

interface GestionLogisticaResponse {
  logistica: LogisticaData[] | null;
  hermanos?: any[];
}
const LogisticaInventarioPage: React.FC = () => {
  const { user } = useAuth();
  const [inventarioData, setInventarioData] = useState<LogisticaInventarioResponse | null>(null);
 const [selectedLogisticaId, setSelectedLogisticaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const fetchLogisticaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener los datos de logística e inventario directamente del endpoint
        const logisticaResponse: LogisticaInventarioResponse | GestionLogisticaResponse = await getLogistica();
        
        // Verificar si la respuesta tiene la estructura de inventario
        if ('productos_por_logistica' in logisticaResponse) {
          // La respuesta ya contiene los datos de inventario
          setInventarioData(logisticaResponse as LogisticaInventarioResponse);
          setSelectedLogisticaId(logisticaResponse.id_logistica_usuario);
        } else if ('logistica' in logisticaResponse && Array.isArray(logisticaResponse.logistica) && logisticaResponse.logistica.length > 0) {
          // Si la respuesta tiene la estructura antigua, usarla para obtener el ID
          const logisticaId = logisticaResponse.logistica[0].id_logistica;
          setSelectedLogisticaId(logisticaId);
          
          // En este caso, necesitaríamos hacer otra llamada, pero como el usuario dijo
          // que el endpoint /logistica ya devuelve todos los datos, no debería suceder
          throw new Error('La API debería devolver directamente los datos de inventario');
        } else {
          throw new Error('No se encontraron los datos esperados en la respuesta');
        }
      } catch (err: any) {
        console.error('Error fetching logistica data:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Redirigiendo al login...');
          window.location.href = '/login';
        } else {
          setError('Error al cargar los datos de logística. Inténtalo de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLogisticaData();
    }
  }, [user?.id]);
  const toggleProductExpansion = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  if (loading) {
    return <div className="management-page">Cargando inventario...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventario Recibido</h1>
        <p>Empaques listos y confirmados para entregas en tiendas</p>
      </div>

      <section className="card" style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}>

        <div style={{ padding: '1rem' }}>
          {error ? (
            <div style={{ color: 'red', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
              {error}
            </div>
          ) : inventarioData ? (
            <>
              {/* Calcular peso total de todos los productos */}
              {(() => {
                const pesoTotal = inventarioData!.productos_por_logistica.reduce((total: number, producto: Producto) => {
                  const pesoProducto = producto.empaques.reduce((sum: number, empaque: Empaque) => {
                    return sum + parseFloat(empaque.peso_exacto_g);
                  }, 0);
                  return total + pesoProducto;
                }, 0);
                return (
                  <div style={{ 
                    marginBottom: '1rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    backgroundColor: 'var(--color-card-bg)',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div>
                      <h3 style={{ margin: '0', color: 'var(--color-text-primary)' }}>
                        Total de Productos Diferentes: {inventarioData.total_productos_diferentes}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                        ID Logística: {selectedLogisticaId}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ margin: '0', color: 'var(--color-primary)' }}>
                        Peso Total: {(pesoTotal / 1000).toFixed(2)} kg
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {inventarioData.total_empaques} empaques total
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Tabla de productos */}
              {inventarioData.productos_por_logistica.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
                  No hay productos en inventario para mostrar.
                </p>
              ) : (
                <div className="products-container" style={{ overflowX: 'auto' }}>
                  <table className="products-table" style={{ marginTop: '1rem', minWidth: '950px' }}>
                    <tbody>
                      {inventarioData.productos_por_logistica.map((producto) => (
                        <React.Fragment key={producto.id_producto}>
                          <tr className="product-header-row" style={{
                            backgroundColor: 'var(--color-hover-bg)',
                            borderBottom: '2px solid var(--color-border)'
                          }}>
                            <td colSpan={4}>
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
                                  {producto.id_producto} - {producto.nombre_producto} {producto.peso_nominal}g
                                </span>
                                <button
                                  onClick={() => toggleProductExpansion(producto.id_producto)}
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
                                  Ver {producto.empaques.length} empaques {expandedProducts.has(producto.id_producto) ? '▲' : '▼'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedProducts.has(producto.id_producto) && (
                            <>
                              <tr className="empaque-header-row" style={{
                                backgroundColor: 'var(--color-card-bg)',
                                fontWeight: 'bold',
                                color: 'var(--color-text-secondary)'
                              }}>
                                <th style={{ width: '100px' }}>ID Producto</th>
                                <th style={{ width: '250px' }}>Producto</th>
                                <th style={{ width: '150px' }}>Peso (g)</th>
                                <th>EPC ID</th>
                              </tr>
                              {producto.empaques.map((empaque, index) => (
                                <tr key={`${producto.id_producto}-${index}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  <td>{producto.id_producto}</td>
                                  <td>{producto.nombre_producto}</td>
                                  <td>{parseFloat(empaque.peso_exacto_g).toFixed(2)} g</td>
                                  <td style={{ fontWeight: 'bold', color: '#ff6b35' }}> {empaque.EPC_id}</td>
                                </tr>
                              ))}
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p>No se encontraron datos de inventario.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default LogisticaInventarioPage;