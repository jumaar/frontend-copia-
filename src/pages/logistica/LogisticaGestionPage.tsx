import React, { useState, useEffect } from 'react';
import { getHermanos, getGestionLogisticaByUser, cambiarEstadoEmpaques } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './LogisticaPage.css';

interface Hermano {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: number;
}

interface LogisticaData {
  id_logistica: number;
  nombre_empresa: string;
  placa_vehiculo: string;
}

interface GestionLogisticaResponse {
  logistica: LogisticaData[] | null;
  hermanos: Hermano[];
}

interface Empaque {
  epc: string;
  peso_g: string;
  precio_venta_total: number;
  fecha_empaque: string;
  id?: number;
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

const LogisticaGestionPage: React.FC = () => {
  const { user } = useAuth();
  const [logisticaData, setLogisticaData] = useState<LogisticaData[] | null>(null);
  const [hermanos, setHermanos] = useState<Hermano[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<GestionData | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedFrigorifico, setSelectedFrigorifico] = useState<Frigorifico | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultingUser, setConsultingUser] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchEPC, setSearchEPC] = useState('');
  const [searchResult, setSearchResult] = useState<{ producto: Producto; estacion: string } | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [currentUserLogisticaId, setCurrentUserLogisticaId] = useState<number | null>(null);
  const [confirmedProducts, setConfirmedProducts] = useState<Set<string>>(new Set());

  // Función para convertir números a palabras en español (en mayúscula)
const numberToWords = (num: number): string => {
  const unidades = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas2 = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num < 10) return unidades[num];
  if (num < 20) return decenas[num - 10];
  if (num < 30) return 'VEINTI' + unidades[num - 20];
  if (num < 100) {
    const decena = Math.floor(num / 10);
    const unidad = num % 10;
    return unidad ? `${decenas2[decena]} Y ${unidades[unidad]}` : decenas2[decena];
  }
  if (num < 1000) {
    const centena = Math.floor(num / 100);
    const resto = num % 100;
    if (num === 100) return 'CIEN';
    return resto ? `${centenas[centena - 1]} ${numberToWords(resto)}` : centenas[centena - 1];
  }
  
  // Para números más grandes, regresar como string en mayúscula
  return num.toString().toUpperCase();
};

// Función para actualizar solo los datos del usuario seleccionado
const refreshUserData = async () => {
  if (selectedUserData && selectedUserName) {
    try {
      const userId = hermanos.find(h => `${h.nombre_usuario} ${h.apellido_usuario}` === selectedUserName)?.id_usuario;
      if (userId) {
        const refreshedData = await getGestionLogisticaByUser(userId);
        setSelectedUserData(refreshedData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }
};

  useEffect(() => {
    const fetchLogisticaData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: GestionLogisticaResponse = await getHermanos();
        setLogisticaData(response.logistica);
        setHermanos(response.hermanos || []);

        // Guardar el id_logistica del usuario actual
        if (response.logistica && response.logistica.length > 0) {
          setCurrentUserLogisticaId(response.logistica[0].id_logistica);
        }
      } catch (err: any) {
        console.error('Error fetching logistica data:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Redirigiendo al login...');
          window.location.href = '/login';
        } else {
          setError('Error al cargar la lista de usuarios. Inténtalo de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLogisticaData();
    }
  }, [user?.id]);

  const handleConsultUser = async (userId: number, userName: string) => {
    // Verificar si el usuario tiene datos completos de logística
    if (!logisticaData || logisticaData.length === 0) {
      alert(
        '⚠️ NO PUEDES CONSULTAR FRIGORÍFICOS ⚠️\n\n' +
        'Debes completar tus datos de empresa logística primero.\n\n' +
        'Ve al Dashboard Principal y haz clic en "Editar" para llenar esta información.'
      );
      return;
    }

    try {
      setConsultingUser(userId);
      setError(null);
      setSelectedUserData(null);
      setSelectedFrigorifico(null);
      setSearchResult(null);

      const gestionData = await getGestionLogisticaByUser(userId);
      setSelectedUserData(gestionData);
      setSelectedUserName(userName);
      
      // Seleccionar el primer frigorífico si existe
      if (gestionData.frigorificos && gestionData.frigorificos.length > 0) {
        setSelectedFrigorifico(gestionData.frigorificos[0]);
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        setError(`Error al consultar datos del usuario ${userName}. Inténtalo de nuevo.`);
      }
    } finally {
      setConsultingUser(null);
    }
  };

  const handleSearch = () => {
    if (!selectedUserData) {
      alert('Primero consulta los datos de un usuario.');
      return;
    }

    if (searchEPC.length < 10) {
      alert('El EPC debe tener al menos 10 caracteres.');
      return;
    }

    // Buscar el empaque por EPC en los datos del usuario seleccionado
    let foundProduct: Producto | null = null;
    let foundEstacion: string = '';

    for (const frigorifico of selectedUserData.frigorificos) {
      for (const estacion of frigorifico.estaciones) {
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
      if (foundProduct) break;
    }

    if (foundProduct) {
      setSearchResult({ producto: foundProduct, estacion: foundEstacion });
      setError(null);
      setSearchEPC('');
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

 
  const handleConfirmarCambioEstado = async (estacionId: string, productoId: number, productoName: string, cantidadTotal: number) => {
    // Verificar que tenemos el id_logistica
    if (!currentUserLogisticaId) {
      alert('❌ ERROR: No se puede proceder sin datos de logística.\nCompleta tu perfil primero.');
      return;
    }

    // Verificación 1: Cantidad en palabras
    const cantidadEnPalabras = numberToWords(cantidadTotal);
    const inputValue = prompt(
      `CONFIRMACIÓN CRÍTICA - PASO 1/2\n\n` +
      `Producto: ${productoName}\n` +
      `Cantidad a confirmar: ${cantidadTotal} empaques\n\n` +
      `EJEMPLO DE LO QUE DEBES ESCRIBIR:\n` +
      `**${cantidadEnPalabras}**\n\n` +
      `Por favor, escribe exactamente la palabra de arriba para confirmar:`
    );

    if (inputValue === null) return;
    if (inputValue.trim().toUpperCase() !== cantidadEnPalabras.toUpperCase()) {
      alert(`❌ ERROR: La palabra ingresada no coincide con la cantidad.\nDebe escribir: "${cantidadEnPalabras}"`);
      return;
    }

    // Verificación 2: Confirmación final
    if (window.confirm(
      `⚠️ CONFIRMACIÓN FINAL ⚠️\n\n` +
      `PRODUCTO: ${productoName.toUpperCase()}\n` +
      `CANTIDAD: ${cantidadTotal} EMPAQUES\n` +
      `ESTACIÓN: ${estacionId}\n\n` +
      `Esta acción cambiará el estado de ${cantidadTotal} empaques.\n\n` +
      `¿Estás seguro de que quieres proceder?`
    )) {
      try {
        const response = await cambiarEstadoEmpaques(estacionId, productoId, currentUserLogisticaId);
        
        // Manejar respuesta exitosa
        if (response.actualizados !== undefined) {
          alert(`✅ CAMBIO REALIZADO EXITOSAMENTE\n\n` +
                `📦 Empaques actualizados: ${response.actualizados}\n` +
                `📅 Fecha del cambio: ${new Date(response.fecha_cambio).toLocaleString('es-CO')}\n` +
                `🚛 ID Logística guardado: ${response.id_logistica}`);
          
          // Agregar producto a la lista de confirmados
          const productKey = `${estacionId}-${productoId}`;
          setConfirmedProducts(prev => new Set([...prev, productKey]));
          
          // Actualizar datos locales en lugar de recargar toda la página
          await refreshUserData();
        }
      } catch (err: any) {
        console.error('Error al cambiar estado de empaques:', err);
        
        // Manejar errores específicos
        if (err.response?.status === 403) {
          // Error de permisos o jerarquía
          const errorCode = err.response.data?.code;
          if (errorCode === 'PERMISSION_DENIED') {
            alert('❌ SIN PERMISOS\n\nNo tienes permisos para realizar esta operación.');
          } else if (errorCode === 'HIERARCHY_ERROR') {
            alert('❌ ERROR DE JERARQUÍA\n\nNo se pudo determinar la jerarquía del usuario.\nContacta al administrador.');
          } else {
            alert('❌ ACCESO DENEGADO\n\nNo tienes permisos para realizar esta operación.');
          }
        } else if (err.response?.status === 404) {
          // Error de estación no encontrada
          alert('❌ ESTACIÓN NO ENCONTRADA\n\nLa estación no existe o no tienes permisos para acceder a ella.');
        } else if (err.response?.status === 401) {
          // Error de sesión expirada
          alert('⚠️ SESIÓN EXPIRADA\n\nRedirigiendo al login...');
          window.location.href = '/login';
        } else {
          // Error general
          alert('❌ ERROR INESPERADO\n\nOcurrió un error al actualizar el producto. Inténtalo de nuevo.');
        }
      }
    }
  };

  if (loading && hermanos.length === 0) {
    return <div className="frigorifico-page">Cargando...</div>;
  }

  // Calcular estadísticas para el usuario seleccionado
  const allEstaciones = selectedUserData?.frigorificos.flatMap(f => f.estaciones) || [];
  const allProductos = allEstaciones.flatMap(e => e.productos);
  const productosHoy = allProductos.reduce((total, producto) => total + producto.cantidad_total, 0);
  const pesoTotal = allProductos.reduce((total, producto) =>
    total + producto.empaques.reduce((sum, empaque) => sum + parseFloat(empaque.peso_g), 0), 0
  ) / 1000;

  return (
    <div className="frigorifico-page">

      {/* Lista de usuarios hermanos */}
      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2>Frigoríficos</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          {hermanos.length === 0 ? (
            <p>No hay usuarios Frigorificos disponibles.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {hermanos.map((hermano) => (
                <div
                  key={hermano.id_usuario}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--color-card-bg)'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
                      {hermano.nombre_usuario} {hermano.apellido_usuario}
                    </h4>
                    <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
                      Email: {hermano.email} | Celular: {hermano.celular}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      ID: {hermano.id_usuario}
                    </p>
                  </div>
                  <button
                    className="action-button"
                    onClick={() => handleConsultUser(hermano.id_usuario, `${hermano.nombre_usuario} ${hermano.apellido_usuario}`)}
                    disabled={consultingUser === hermano.id_usuario || !logisticaData || logisticaData.length === 0}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: (!logisticaData || logisticaData.length === 0) ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius)',
                      cursor: (consultingUser === hermano.id_usuario || !logisticaData || logisticaData.length === 0) ? 'not-allowed' : 'pointer',
                      minWidth: '120px',
                      opacity: (!logisticaData || logisticaData.length === 0) ? 0.6 : 1
                    }}
                    title={(!logisticaData || logisticaData.length === 0) ? 'Completa tus datos de empresa logística primero' : ''}
                  >
                    {consultingUser === hermano.id_usuario ? 'Consultando...' : 'Consultar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Título dinámico del frigorífico seleccionado */}
      {selectedFrigorifico && (
        <div style={{ 
          marginBottom: '2rem', 
          textAlign: 'center',
          padding: '1.5rem',
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius-lg)'
        }}>
          <h1 style={{ 
            margin: 0, 
            color: 'var(--color-primary)',
            fontSize: '2.5rem',
            fontWeight: 'bold'
          }}>
            {selectedFrigorifico.nombre_frigorifico}
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: 'var(--color-text-secondary)',
            fontSize: '1.1rem'
          }}>
            {selectedUserName} - {selectedFrigorifico.ciudad.nombre_ciudad}, {selectedFrigorifico.ciudad.departamento.nombre_departamento}
          </p>
        </div>
      )}

      {/* Datos del usuario seleccionado */}
      {selectedUserData && (
        <>
          {/* Estadísticas */}
          <section className="dashboard-summary" style={{ marginBottom: '2rem' }}>
            <div className="summary-card" style={{
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                Productos Hoy
              </h3>
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
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                Peso Total
              </h3>
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
          <section className="busqueda-empaque-container card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h2>Búsqueda por EPC - {selectedUserName}</h2>
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
                disabled={consultingUser !== null}
              >
                Buscar
              </button>
            </div>
            {error && <p style={{ color: 'red', padding: '0 1rem' }}>{error}</p>}
          </section>

          {/* Resultado de Búsqueda */}
          {searchResult && (
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>
                Resultado de Búsqueda - Estación {searchResult.estacion} - {selectedUserName}
              </h3>
              <div className="products-container" style={{ overflowX: 'auto' }}>
                <table className="products-table" style={{ minWidth: '950px' }}>
                  <thead>
                    <tr>
                      <th>ID Producto</th>
                      <th>Producto</th>
                      <th>Peso (g)</th>
                      <th>EPC</th>
                      <th>Fecha</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historial por Estaciones */}
          {allEstaciones.map((estacion) => (
            <section key={estacion.id_estacion} className="products-container card" style={{ marginBottom: '2rem' }}>
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
                                    Ver {producto.cantidad_total} empaques {expandedProducts.has(producto.id_producto.toString()) ? '▲' : '▼'}
                                  </button>
                                  <button
                                    onClick={() => handleConfirmarCambioEstado(estacion.id_estacion, producto.id_producto, producto.nombre_producto, producto.cantidad_total)}
                                    disabled={confirmedProducts.has(`${estacion.id_estacion}-${producto.id_producto}`)}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      backgroundColor: confirmedProducts.has(`${estacion.id_estacion}-${producto.id_producto}`)
                                        ? 'var(--color-text-secondary)'
                                        : 'var(--color-success)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 'var(--border-radius)',
                                      cursor: confirmedProducts.has(`${estacion.id_estacion}-${producto.id_producto}`)
                                        ? 'not-allowed'
                                        : 'pointer',
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem',
                                      opacity: confirmedProducts.has(`${estacion.id_estacion}-${producto.id_producto}`) ? 0.7 : 1
                                    }}
                                  >
                                    {confirmedProducts.has(`${estacion.id_estacion}-${producto.id_producto}`) ? '✅ Confirmado' : 'Confirmar'}
                                  </button>
                                </div>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </>
      )}

      {/* Error general */}
      {error && !selectedUserData && (
        <div style={{ color: 'red', padding: '1rem', border: '1px solid red', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default LogisticaGestionPage;