import React, { useState, useEffect } from 'react';
import { getTiendasNeveras, updateNeveraStocks } from '../../../services/api';
import './SurtirNeveraModal.css';

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
    <div className="surtir-nevera-overlay">
      <div className="surtir-nevera-header">
        <div className="surtir-nevera-header-center">
          <h1 className="surtir-nevera-title">🏪 Nevera ID: {idNevera}</h1>
          <h2 className="surtir-nevera-subtitle">{neveraData?.nevera.nombre_tienda || 'Cargando...'}</h2>
          {neveraData && (
            <div className="surtir-nevera-stats">
              <div className="surtir-nevera-stat">
                📦 Total productos: <span style={{ color: '#3b82f6' }}>{neveraData.productos.filter(p => p.calificacion_surtido !== 'Sin configurar').length}</span>
              </div>
              <div className="surtir-nevera-stat">
                ✅ Con stock: <span style={{ color: '#10b981' }}>{neveraData.productos.filter(p => p.calificacion_surtido !== 'Sin configurar' && p.stock_en_tiempo_real > 0).length}</span>
              </div>
              <div className="surtir-nevera-stat">
                ❌ Sin stock: <span style={{ color: '#ef4444' }}>{neveraData.productos.filter(p => p.calificacion_surtido !== 'Sin configurar' && p.stock_en_tiempo_real === 0).length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="surtir-nevera-content">
        {loading && <div className="surtir-nevera-loading">Cargando datos de la nevera...</div>}

        {error && <div className="surtir-nevera-error">{error}</div>}

        {neveraData && (
          <div className="surtir-nevera-table-wrapper">
            <table className="surtir-nevera-table">
              <thead>
                <tr>
                  <th className="surtir-nevera-th left min-w-200">Producto</th>
                  <th className="surtir-nevera-th min-w-120">Stock Actual</th>
                  <th className="surtir-nevera-th min-w-140">Stock Mínimo</th>
                  <th className="surtir-nevera-th min-w-140">Stock Máximo</th>
                  <th className="surtir-nevera-th min-w-100">Venta Semanal</th>
                  <th className="surtir-nevera-th min-w-120">Stock Ideal</th>
                  <th className="surtir-nevera-th min-w-120">Calificación</th>
                  <th className="surtir-nevera-th min-w-100">Activo</th>
                  <th className="surtir-nevera-th left min-w-200">Mensaje del Sistema</th>
                </tr>
              </thead>
              <tbody>
                {sortedProductos.map((producto) => {
                  const isActive = editedActivos[producto.id_producto] ?? producto.activo;
                  return (
                  <tr key={producto.id_producto} style={{
                    backgroundColor: producto.tiene_stock ? 'var(--color-modal-bg)' : 'var(--color-modal-header-bg)'
                  }}>
                    <td className="surtir-nevera-td left">
                      <div>
                        <div className="surtir-nevera-product-name">{producto.nombre_producto}</div>
                        <div className="surtir-nevera-product-desc">{producto.descripcion_producto}</div>
                        <div className="surtir-nevera-product-weight">{producto.peso_nominal_g}g</div>
                      </div>
                    </td>
                    <td className="surtir-nevera-td bold large min-w-120" style={{ color: producto.stock_en_tiempo_real === 0 || producto.stock_en_tiempo_real < producto.stock_minimo ? '#ef4444' : '#10b981' }}>
                      {producto.stock_en_tiempo_real}
                    </td>
                    <td className="surtir-nevera-td min-w-140">
                      <input type="number" className="surtir-nevera-stock-input"
                        value={editedStocks[producto.id_producto]?.stock_minimo ?? producto.stock_minimo}
                        onChange={(e) => handleStockChange(producto.id_producto, 'stock_minimo', parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="surtir-nevera-td min-w-140">
                      <input type="number" className="surtir-nevera-stock-input"
                        value={editedStocks[producto.id_producto]?.stock_maximo ?? producto.stock_maximo}
                        onChange={(e) => handleStockChange(producto.id_producto, 'stock_maximo', parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="surtir-nevera-td">{producto.venta_semanal}</td>
                    <td className="surtir-nevera-td bold large">{producto.stock_ideal_final}</td>
                    <td className="surtir-nevera-td">
                      <span className="surtir-nevera-calificacion-badge" style={{ backgroundColor: getCalificacionColor(producto.calificacion_surtido) }}>
                        {producto.calificacion_surtido}
                      </span>
                    </td>
                    <td className="surtir-nevera-td">
                      <div className={`surtir-nevera-toggle ${isActive ? 'on' : 'off'}`}
                        onClick={() => handleActivoChange(producto.id_producto, !isActive)}>
                        <div className={`surtir-nevera-toggle-thumb ${isActive ? 'on' : 'off'}`} />
                      </div>
                      <div className="surtir-nevera-toggle-label" style={{ color: isActive ? '#10b981' : '#ef4444' }}>
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </div>
                    </td>
                    <td className="surtir-nevera-td left small">{producto.mensaje_sistema}</td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="surtir-nevera-footer">
        <button className="surtir-nevera-btn-guardar" onClick={handleGuardarCambios}>Guardar Cambios</button>
        <button className="surtir-nevera-btn-cerrar" onClick={onClose}>Cerrar</button>
      </div>

      {showConfirmModal && (
        <div className="surtir-nevera-confirm-overlay">
          <div className="surtir-nevera-confirm-card">
            <div className="surtir-nevera-confirm-icon">⚠️</div>
            <h2 className="surtir-nevera-confirm-title">ADVERTENCIA</h2>
            <p className="surtir-nevera-confirm-text">
              Asegúrese de estar <strong>parado al frente de la nevera</strong> antes de confirmar los cambios.
            </p>
            <p className="surtir-nevera-confirm-hint">
              Verifique que el número de nevera que aparece en la etiqueta del equipo coincida con el mostrado aquí.
            </p>
            <div className="surtir-nevera-confirm-id-box">
              <div className="surtir-nevera-confirm-id">#{idNevera}</div>
              <p className="surtir-nevera-confirm-id-label">Número de nevera a confirmar</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="surtir-nevera-confirm-input-label">Escriba el número de la nevera para confirmar:</label>
              <input type="text" className="surtir-nevera-confirm-input"
                value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmarGuardar(); }}
                placeholder="Ej: 123" autoFocus />
            </div>
            <div className="surtir-nevera-confirm-actions">
              <button className="surtir-nevera-confirm-btn-cancel" onClick={handleCancelarConfirmacion}>Cancelar</button>
              <button className="surtir-nevera-confirm-btn-submit" onClick={handleConfirmarGuardar} disabled={confirmInput.trim() === ""}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurtirNeveraModal;