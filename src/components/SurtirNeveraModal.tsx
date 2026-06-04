import React, { useState, useEffect } from 'react';
import { getTiendasNeveras, updateNeveraStocks } from '../services/api';

interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  tiene_stock: boolean;
  id_stock: number | null;
  stock_minimo: number;
  stock_maximo: number;
  venta_semanal: number;
  stock_ideal_final: number;
  calificacion_surtido: string;
  mensaje_sistema: string;
  stock_en_tiempo_real: number;
  activo: boolean; // ← Nuevo campo
}

interface NeveraData {
  nevera: {
    id_nevera: number;
    id_tienda: number;
    nombre_tienda: string;
  };
  estadisticas: {
    total_productos: number;
    productos_con_stock: number;
    productos_sin_stock: number;
  };
  productos: Producto[];
}

interface SurtirNeveraModalProps {
  isOpen: boolean;
  onClose: () => void;
  idNevera: number;
}

const SurtirNeveraModal: React.FC<SurtirNeveraModalProps> = ({ isOpen, onClose, idNevera }) => {
  const [neveraData, setNeveraData] = useState<NeveraData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedStocks, setEditedStocks] = useState<Record<number, { stock_minimo: number; stock_maximo: number }>>({});
  const [editedActivos, setEditedActivos] = useState<Record<number, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (isOpen && idNevera) {
      // Limpiar cambios editados al abrir el modal
      setEditedStocks({});
      setEditedActivos({});
      fetchNeveraData();
    } else if (!isOpen) {
      // Limpiar cambios editados al cerrar el modal
      setEditedStocks({});
      setEditedActivos({});
    }
  }, [isOpen, idNevera]);

  const fetchNeveraData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: NeveraData = await getTiendasNeveras(idNevera);
      setNeveraData(data);
    } catch (err: any) {
      console.error('Error fetching nevera data:', err);
      setError('Error al cargar los datos de la nevera');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (idProducto: number, field: 'stock_minimo' | 'stock_maximo', value: number) => {
    setEditedStocks(prev => ({
      ...prev,
      [idProducto]: {
        ...prev[idProducto],
        [field]: value
      }
    }));
  };

  const handleActivoChange = (idProducto: number, nuevoEstado: boolean) => {
    setEditedActivos(prev => ({
      ...prev,
      [idProducto]: nuevoEstado
    }));
  };

  const handleGuardarCambios = () => {
    if (!neveraData) return;

    // Validar que stock_minimo no sea mayor que stock_maximo
    for (const producto of neveraData.productos) {
      const editedMinimo = editedStocks[producto.id_producto]?.stock_minimo;
      const editedMaximo = editedStocks[producto.id_producto]?.stock_maximo;
      const stockMinimo = editedMinimo ?? producto.stock_minimo;
      const stockMaximo = editedMaximo ?? producto.stock_maximo;

      if (stockMinimo > stockMaximo) {
        alert(`❌ Error en ${producto.nombre_producto}:\nEl stock mínimo (${stockMinimo}) no puede ser mayor que el stock máximo (${stockMaximo}).`);
        return;
      }
    }

    // Verificar si hay cambios que guardar
    const hasChanges = neveraData.productos.some((producto) => {
      const hasStockChanges = editedStocks[producto.id_producto]?.stock_minimo !== undefined ||
        editedStocks[producto.id_producto]?.stock_maximo !== undefined;
      const hasActivoChange = editedActivos[producto.id_producto] !== undefined;
      return hasStockChanges || hasActivoChange;
    });

    if (!hasChanges) {
      alert('No hay cambios para guardar');
      return;
    }

    setShowConfirmModal(true);
    setConfirmInput("");
  };

  const ejecutarGuardarCambios = async () => {
    if (!neveraData) return;

    try {
      console.log('🚀 Iniciando guardado de cambios...');

      const stockUpdates: Array<{
        id_stock: number | null;
        id_producto?: number;
        stock_minimo: number;
        stock_maximo: number;
        activo?: boolean;
      }> = [];

      neveraData.productos.forEach((producto) => {
        const editedMinimo = editedStocks[producto.id_producto]?.stock_minimo;
        const editedMaximo = editedStocks[producto.id_producto]?.stock_maximo;
        const editedActivo = editedActivos[producto.id_producto];

        const hasStockChanges = editedMinimo !== undefined || editedMaximo !== undefined;
        const hasActivoChange = editedActivo !== undefined;

        if (hasStockChanges || hasActivoChange) {
          if (producto.id_stock === null) {
            const updateItem: any = {
              id_stock: null,
              id_producto: producto.id_producto,
              stock_minimo: editedMinimo ?? producto.stock_minimo,
              stock_maximo: editedMaximo ?? producto.stock_maximo
            };
            if (hasActivoChange) {
              updateItem.activo = editedActivo;
            }
            stockUpdates.push(updateItem);
          } else {
            const updateItem: any = {
              id_stock: producto.id_stock,
              stock_minimo: editedMinimo ?? producto.stock_minimo,
              stock_maximo: editedMaximo ?? producto.stock_maximo
            };
            if (hasActivoChange) {
              updateItem.activo = editedActivo;
            }
            stockUpdates.push(updateItem);
          }
        }
      });

      console.log('📦 Cambios recopilados:', stockUpdates);

      if (stockUpdates.length === 0) {
        alert('No hay cambios para guardar');
        return;
      }

      console.log('📡 Enviando petición PATCH...');
      const response = await updateNeveraStocks(idNevera, stockUpdates);
      console.log('✅ Respuesta del servidor:', response);

      const { resultados } = response;
      const exitosos = resultados?.exitosos || [];
      const errores = resultados?.errores || [];

      let mensaje = `✅ Procesamiento completado\n\n`;
      mensaje += `📊 Total procesados: ${resultados?.total_procesados || stockUpdates.length}\n`;
      mensaje += `✅ Exitosos: ${resultados?.exitosos_count || exitosos.length}\n`;
      mensaje += `❌ Errores: ${resultados?.errores_count || errores.length}\n\n`;

      if (exitosos.length > 0) {
        mensaje += `✅ PRODUCTOS PROCESADOS:\n`;
        exitosos.forEach((item: any) => {
          const activoInfo = item.activo !== undefined ? `, activo: ${item.activo ? 'true' : 'false'}` : '';
          mensaje += `• ${item.nombre_producto || `ID ${item.id_producto}`}: ${item.accion} (${item.stock_minimo}-${item.stock_maximo}${activoInfo})\n`;
        });
        mensaje += `\n`;
      }

      if (errores.length > 0) {
        mensaje += `❌ ERRORES ENCONTRADOS:\n`;
        errores.forEach((error: any) => {
          mensaje += `• Producto ID ${error.id_producto}: ${error.error}\n`;
        });
        mensaje += `\n`;
      }

      alert(mensaje);

      if (exitosos.length > 0) {
        setEditedStocks({});
        setEditedActivos({});
      }

      await fetchNeveraData();

    } catch (error: any) {
      console.error('Error al guardar cambios:', error);
      if (error.response?.status === 400) {
        alert('❌ Error en los datos enviados. Verifique los valores.');
      } else if (error.response?.status === 403) {
        alert('❌ No tiene permisos para modificar estos datos.');
      } else if (error.response?.status === 404) {
        alert('❌ Nevera no encontrada.');
      } else {
        alert('❌ Error al guardar los cambios. Inténtelo de nuevo.');
      }
    }
  };

  const handleConfirmarGuardar = () => {
    if (confirmInput.trim() !== idNevera.toString()) {
      alert('⚠️ Número de nevera incorrecto. Por favor escribe el número correcto de la nevera para confirmar.');
      return;
    }
    setShowConfirmModal(false);
    setConfirmInput("");
    ejecutarGuardarCambios();
  };

  const handleCancelarConfirmacion = () => {
    setShowConfirmModal(false);
    setConfirmInput("");
  };

  const getCalificacionColor = (calificacion: string) => {
    switch (calificacion.toLowerCase()) {
      case 'crítica': return '#ef4444'; // rojo
      case 'baja': return '#f97316'; // naranja
      case 'media': return '#f59e0b'; // amarillo
      case 'alta': return '#10b981'; // verde
      default: return '#6b7280'; // gris
    }
  };

  const getCalificacionOrder = (calificacion: string) => {
    switch (calificacion.toLowerCase()) {
      case 'crítica': return 1;
      case 'baja': return 2;
      case 'media': return 3;
      case 'alta': return 4;
      default: return 5; // sin configurar
    }
  };

  if (!isOpen) return null;

  // Ordenar productos: críticos primero, luego baja, media, alta, sin configurar al final
  const sortedProductos = neveraData ? [...neveraData.productos].sort((a, b) => {
    return getCalificacionOrder(a.calificacion_surtido) - getCalificacionOrder(b.calificacion_surtido);
  }) : [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-modal-bg)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '30px',
        borderBottom: '2px solid var(--color-table-border)',
        backgroundColor: 'var(--color-modal-header-bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: 'var(--color-text-primary)',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            🏪 Nevera ID: {idNevera}
          </h1>
          <h2 style={{
            margin: '0 0 15px 0',
            color: 'var(--color-text-primary)',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {neveraData?.nevera.nombre_tienda || 'Cargando...'}
          </h2>
          {neveraData && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '15px',
              padding: '15px',
              backgroundColor: 'var(--color-modal-header-bg)',
              borderRadius: '10px',
              border: '2px solid var(--color-border-strong)'
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--color-text-primary)'
              }}>
                📦 Total productos: <span style={{ color: '#3b82f6' }}>{neveraData.productos.filter(p => p.calificacion_surtido !== 'Sin configurar').length}</span>
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--color-text-primary)'
              }}>
                ✅ Con stock: <span style={{ color: '#10b981' }}>{neveraData.productos.filter(p => p.calificacion_surtido !== 'Sin configurar' && p.stock_en_tiempo_real > 0).length}</span>
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--color-text-primary)'
              }}>
                ❌ Sin stock: <span style={{ color: '#ef4444' }}>{neveraData.productos.filter(p => p.calificacion_surtido !== 'Sin configurar' && p.stock_en_tiempo_real === 0).length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
            Cargando datos de la nevera...
          </div>
        )}

        {error && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            fontSize: '18px',
            color: '#ef4444',
            backgroundColor: 'var(--color-alert-error-bg)',
            border: '1px solid var(--color-alert-error-border)',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}

        {neveraData && (
          <div style={{ height: '100%', overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              backgroundColor: 'var(--color-modal-bg)'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--color-modal-header-bg)',
                zIndex: 10
              }}>
                <tr>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '200px'
                  }}>Producto</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '120px'
                  }}>Stock Actual</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '140px'
                  }}>Stock Mínimo</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '140px'
                  }}>Stock Máximo</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '100px'
                  }}>Venta Semanal</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '120px'
                  }}>Stock Ideal</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '120px'
                  }}>Calificación</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '100px'
                  }}>Activo</th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    border: '1px solid var(--color-table-border)',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-table-header-bg)',
                    minWidth: '200px'
                  }}>Mensaje del Sistema</th>
                </tr>
              </thead>
              <tbody>
                {sortedProductos.map((producto) => (
                  <tr key={producto.id_producto} style={{
                    backgroundColor: producto.tiene_stock ? 'var(--color-modal-bg)' : 'var(--color-modal-header-bg)'
                  }}>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {producto.nombre_producto}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {producto.descripcion_producto}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {producto.peso_nominal_g}g
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      border: '1px solid var(--color-table-border)',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: producto.stock_en_tiempo_real === 0 || producto.stock_en_tiempo_real < producto.stock_minimo ? '#ef4444' : '#10b981',
                      minWidth: '120px'
                    }}>
                      {producto.stock_en_tiempo_real}
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', textAlign: 'center', minWidth: '140px' }}>
                      <input
                        type="number"
                        value={editedStocks[producto.id_producto]?.stock_minimo ?? producto.stock_minimo}
                        onChange={(e) => handleStockChange(producto.id_producto, 'stock_minimo', parseInt(e.target.value) || 0)}
                        style={{
                          width: '100px',
                          padding: '8px',
                          border: '1px solid var(--color-border-strong)',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', textAlign: 'center', minWidth: '140px' }}>
                      <input
                        type="number"
                        value={editedStocks[producto.id_producto]?.stock_maximo ?? producto.stock_maximo}
                        onChange={(e) => handleStockChange(producto.id_producto, 'stock_maximo', parseInt(e.target.value) || 0)}
                        style={{
                          width: '100px',
                          padding: '8px',
                          border: '1px solid var(--color-border-strong)',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', textAlign: 'center' }}>
                      {producto.venta_semanal}
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', textAlign: 'center' }}>
                      {producto.stock_ideal_final}
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: getCalificacionColor(producto.calificacion_surtido),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        {producto.calificacion_surtido}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', textAlign: 'center' }}>
                      {/* Botón Slide Toggle */}
                      <div style={{
                        position: 'relative',
                        width: '50px',
                        height: '24px',
                        backgroundColor: editedActivos[producto.id_producto] ?? producto.activo ? '#10b981' : 'var(--color-badge-inactive)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease'
                      }}
                      onClick={() => {
                        const currentState = editedActivos[producto.id_producto] ?? producto.activo;
                        handleActivoChange(producto.id_producto, !currentState);
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: editedActivos[producto.id_producto] ?? producto.activo ? '26px' : '2px',
                          width: '20px',
                          height: '20px',
                          backgroundColor: 'var(--color-modal-bg)',
                          borderRadius: '50%',
                          transition: 'left 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <div style={{
                        fontSize: '10px',
                        marginTop: '2px',
                        color: editedActivos[producto.id_producto] ?? producto.activo ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {editedActivos[producto.id_producto] ?? producto.activo ? 'ACTIVO' : 'INACTIVO'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid var(--color-table-border)', fontSize: '13px' }}>
                      {producto.mensaje_sistema}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <div style={{
        padding: '20px',
        borderTop: '2px solid var(--color-table-border)',
        backgroundColor: 'var(--color-modal-header-bg)',
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      }}>
        <button
          onClick={handleGuardarCambios}
          style={{
            padding: '12px 30px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Guardar Cambios
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 30px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Cerrar
        </button>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--color-modal-bg)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>
              ⚠️
            </div>
            <h2 style={{
              color: '#dc2626',
              marginBottom: '15px',
              fontSize: '22px',
              fontWeight: 'bold'
            }}>
              ADVERTENCIA
            </h2>
            <p style={{
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              marginBottom: '10px',
              lineHeight: '1.5'
            }}>
              Asegúrese de estar <strong>parado al frente de la nevera</strong> antes de confirmar los cambios.
            </p>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              Verifique que el número de nevera que aparece en la etiqueta del equipo coincida con el mostrado aquí.
            </p>
            <div style={{
              backgroundColor: 'var(--color-alert-warning-bg)',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'var(--color-alert-warning-text)',
                letterSpacing: '3px'
              }}>
                #{idNevera}
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-alert-warning-text)',
                marginTop: '5px',
                marginBottom: 0
              }}>
                Número de nevera a confirmar
              </p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--color-text-primary)',
                marginBottom: '8px',
                textAlign: 'left'
              }}>
                Escriba el número de la nevera para confirmar:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmarGuardar();
                  }
                }}
                placeholder="Ej: 123"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '18px',
                  border: '2px solid var(--color-border-strong)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancelarConfirmacion}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarGuardar}
                disabled={confirmInput.trim() === ""}
                style={{
                  padding: '10px 24px',
                  backgroundColor: confirmInput.trim() === "" ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: confirmInput.trim() === "" ? 'not-allowed' : 'pointer',
                  boxShadow: confirmInput.trim() === "" ? 'none' : '0 2px 4px rgba(220, 38, 38, 0.3)'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurtirNeveraModal;