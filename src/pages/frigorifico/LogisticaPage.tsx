import React, { useState, useEffect } from 'react';
import { getGestionLogistica, deleteEmpaque, getFrigorificoData } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './FrigorificoPage.css';

interface Empaque {
  epc: string;
  peso_g: string;
  precio_venta_total: number;
  fecha_empaque: string;
  id?: number; // Opcional para compatibilidad
}

interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  cantidad_total: number;
  peso_total_g: number;
  empaques: Empaque[];
}

interface Estacion {
  id_estacion: string;
  clave_vinculacion: string;
  activa: boolean;
  total_empaques: number;
  peso_total_g: number;
  productos: Producto[];
}

interface Frigorifico {
  id_frigorifico: number;
  nombre_frigorifico: string;
  direccion: string;
  ciudad: {
    id_ciudad: number;
    nombre_ciudad: string;
    departamento: {
      id__departamento: number;
      nombre_departamento: string;
    };
  };
  lotes_en_stock: {
    cantidad: number;
    peso_total_g: number;
  };
  lotes_despachados: {
    cantidad: number;
    peso_total_g: number;
  };
  total_transacciones: number;
  estaciones: Estacion[];
}

interface GestionData {
  usuario_actual: {
    id: number;
    nombre_completo: string;
    celular: string;
    rol: string;
    activo: boolean;
  };
  frigorificos: Frigorifico[];
  ciudades_disponibles: Array<{
    id_ciudad: number;
    nombre_ciudad: string;
  }>;
}


const LogisticaPage: React.FC = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEPC, setSearchEPC] = useState('');
  const [searchResult, setSearchResult] = useState<{ producto: Producto; estacion: string } | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [estacionesData, setEstacionesData] = useState<Estacion[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener frigoríficos y estaciones (no necesitamos setFrigorificos)
        await getFrigorificoData();

        // Obtener datos de gestión logística
        const gestionData: GestionData = await getGestionLogistica();

        // Extraer todas las estaciones con sus productos
        const allEstaciones = gestionData.frigorificos.flatMap(f => f.estaciones);
        setEstacionesData(allEstaciones);

        // Extraer todos los productos para estadísticas globales
        const allProductos = allEstaciones.flatMap(e => e.productos);
        setProductos(allProductos);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Redirigiendo al login...');
          window.location.href = '/login';
        } else {
          setError('Error al cargar los datos. Inténtalo de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleSearch = () => {
    if (searchEPC.length < 10) {
      alert('El EPC debe tener al menos 10 caracteres.');
      return;
    }

    // Buscar el empaque por EPC en los datos locales (estacionesData)
    let foundProduct: Producto | null = null;
    let foundEstacion: string = '';

    for (const estacion of estacionesData) {
      for (const producto of estacion.productos) {
        const empaque = producto.empaques.find((e: Empaque) => e.epc === searchEPC);
        if (empaque) {
          foundProduct = { ...producto, empaques: [empaque] };
          foundEstacion = estacion.id_estacion;
          break;
        }
      }
      if (foundProduct) break;
    }

    if (foundProduct) {
      setSearchResult({ producto: foundProduct, estacion: foundEstacion });
      setError(null);
      setSearchEPC(''); // Limpiar el input después de una búsqueda exitosa
    } else {
      setSearchResult(null);
      setError('No se encontró ningún empaque con ese EPC.');
      setSearchEPC('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleProductExpansion = (productId: number) => {
    const productIdStr = productId.toString();
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productIdStr)) {
      newExpanded.delete(productIdStr);
    } else {
      newExpanded.add(productIdStr);
    }
    setExpandedProducts(newExpanded);
  };

  const handleDeleteEmpaque = async (estacionId: string, epc: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empaque? Esta acción no se puede deshacer.')) {
      try {
        await deleteEmpaque(estacionId, epc);
        // Recargar datos después de eliminar
        const gestionData: GestionData = await getGestionLogistica();
        const allEstaciones = gestionData.frigorificos.flatMap(f => f.estaciones);
        setEstacionesData(allEstaciones);
        const allProductos = allEstaciones.flatMap(e => e.productos);
        setProductos(allProductos);
        setSearchResult(null);
        alert('Empaque eliminado exitosamente.');
      } catch (err: any) {
        console.error('Error deleting empaque:', err);
        if (err.response?.status === 404) {
          alert('El empaque no existe, no pertenece a esta estación o ya fue vendido.');
        } else {
          alert('Error al eliminar el empaque. Inténtalo de nuevo.');
        }
      }
    }
  };

  // Función eliminada - ya no se necesita selector de estación

  // Calcular estadísticas
  const productosHoy = productos.reduce((total, producto) => total + producto.cantidad_total, 0);
  const pesoTotal = productos.reduce((total, producto) =>
    total + producto.empaques.reduce((sum, empaque) => sum + parseFloat(empaque.peso_g), 0), 0
  ) / 1000; // Convertir a kg


  if (loading && productos.length === 0) {
    return <div className="frigorifico-page">Cargando...</div>;
  }

  return (
    <div className="frigorifico-page">
   


      {/* Estadísticas */}
      <section className="dashboard-summary">
        <div className="summary-card" style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>Productos Hoy</h3>
          <div className="summary-value" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            marginBottom: '0.5rem'
          }}>{productosHoy}</div>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Cantidad total de empaques</p>
        </div>
        <div className="summary-card" style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>Peso Total</h3>
          <div className="summary-value" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            marginBottom: '0.5rem'
          }}>{pesoTotal.toFixed(2)} kg</div>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Suma de pesos en kg</p>
        </div>
      </section>

      {/* Búsqueda por EPC */}
      <section className="busqueda-empaque-container card">
        <div className="card-header">
          <h2>Búsqueda por EPC</h2>
        </div>
        <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Ingrese EPC (máximo 24 caracteres)"
            value={searchEPC}
            onChange={(e) => setSearchEPC(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={24}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
          />
          <button
            className="action-button"
            onClick={handleSearch}
            disabled={loading}
          >
            Buscar
          </button>
        </div>
        {error && <p style={{ color: 'red', padding: '0 1rem' }}>{error}</p>}
      </section>

      {/* Resultado de Búsqueda dentro del contenedor de búsqueda */}
      {searchResult && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>Resultado de Búsqueda - Estación {searchResult.estacion}</h3>
          <table className="products-table" style={{ minWidth: '950px' }}>
            <thead>
              <tr>
                <th>ID Producto</th>
                <th>Producto</th>
                <th>Peso (g)</th>
                <th>EPC</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {searchResult.producto.empaques.map((empaque: Empaque) => (
                <tr key={empaque.epc}>
                  <td>{searchResult.producto.id_producto}</td>
                  <td>{searchResult.producto.nombre_producto}</td>
                  <td>{empaque.peso_g}</td>
                  <td style={{ fontWeight: 'bold', color: '#ff6b35' }}>⭐ {empaque.epc}</td>
                  <td>{new Date(empaque.fecha_empaque).toLocaleString('es-CO')}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteEmpaque(searchResult.estacion, empaque.epc)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historial por Estaciones */}
      {estacionesData.map((estacion) => (
        <section key={estacion.id_estacion} className="products-container card">
          <h2>Historial de Empaques - Estación {estacion.id_estacion} ({estacion.total_empaques} empaques, {(estacion.peso_total_g / 1000).toFixed(2)} kg)</h2>
          {estacion.productos.length === 0 ? (
            <p>No hay productos para mostrar en esta estación.</p>
          ) : (
            <table className="products-table" style={{ marginTop: '1rem', minWidth: '950px' }}>
              <tbody>
                {estacion.productos.map((producto) => (
                  <React.Fragment key={`${estacion.id_estacion}-${producto.id_producto}`}>
                    <tr className="product-header-row" style={{
                      backgroundColor: 'var(--color-hover-bg)',
                      borderBottom: '2px solid var(--color-border)'
                    }}>
                      <td colSpan={6}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: 'var(--color-text-primary)'
                          }}>
                            {producto.id_producto} - {producto.nombre_producto} ({producto.peso_nominal_g}g)
                          </span>
                          <button
                            onClick={() => toggleProductExpansion(producto.id_producto)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: 'var(--color-primary)',
                              textDecoration: 'underline'
                            }}
                          >
                            Ver {producto.cantidad_total} empaques {expandedProducts.has(producto.id_producto.toString()) ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProducts.has(producto.id_producto.toString()) && (
                      <>
                        <tr className="empaque-header-row" style={{
                          backgroundColor: 'var(--color-card-bg)',
                          fontWeight: 'bold',
                          color: 'var(--color-text-secondary)'
                        }}>
                          <th style={{ width: '65px' }}>ID</th>
                          <th style={{ width: '200px' }}>Producto</th>
                          <th style={{ width: '100px' }}>Peso</th>
                          <th>EPC</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                        {producto.empaques.map((empaque) => (
                          <tr key={empaque.epc} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td>{producto.id_producto}</td>
                            <td>{producto.nombre_producto}</td>
                            <td>{empaque.peso_g} g</td>
                            <td>{empaque.epc}</td>
                            <td>{new Date(empaque.fecha_empaque).toLocaleString('es-CO')}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteEmpaque(estacion.id_estacion, empaque.epc)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
};

export default LogisticaPage;