import React, { useState, useEffect } from 'react';
import { finalizarSurtidoNevera } from '../services/api';

interface ProductoSurtido {
  id_nevera: number;
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  stock_ideal_final: number;
  stock_en_tiempo_real: number;
  calificacion_surtido: string | null;
}

interface SurtirProcesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  idNevera: number;
  stockData: ProductoSurtido[];
  nombreTienda: string;
}

const SurtirProcesoModal: React.FC<SurtirProcesoModalProps> = ({
  isOpen,
  onClose,
  idNevera,
  stockData,
  nombreTienda
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmations, setConfirmations] = useState<Record<number, boolean>>({});

  // Inicializar confirmations cuando cambie stockData
  useEffect(() => {
    if (stockData && stockData.length > 0) {
      const initialConfirmations: Record<number, boolean> = {};
      // Solo inicializar confirmations para productos que necesitan surtido
      stockData.forEach(producto => {
        const totalASurtir = Math.max(0, producto.stock_ideal_final - producto.stock_en_tiempo_real);
        if (totalASurtir > 0) {
          initialConfirmations[producto.id_producto] = false;
        }
      });
      setConfirmations(initialConfirmations);
    }
  }, [stockData]);

  const handleConfirmationToggle = (idProducto: number) => {
    setConfirmations(prev => ({
      ...prev,
      [idProducto]: !prev[idProducto]
    }));
  };

  // Filtrar productos que necesitan surtido (total a surtir > 0)
  const productosASurtir = stockData ? stockData.filter(producto => {
    const totalASurtir = Math.max(0, producto.stock_ideal_final - producto.stock_en_tiempo_real);
    return totalASurtir > 0;
  }) : [];

  // Verificar si todos los productos a surtir están confirmados
  const allConfirmed = productosASurtir.length > 0 && productosASurtir.every(producto => confirmations[producto.id_producto]);

  const handleFinalizarSurtido = async () => {
    try {
      setLoading(true);
      console.log(`🚀 Finalizando surtido para nevera ID: ${idNevera}`);

      const response = await finalizarSurtidoNevera(idNevera);

      alert(
        `✅ ${
          response.message || "Surtido finalizado exitosamente"
        }\n\n📅 Timestamp: ${new Date().toLocaleString("es-CO")}`
      );

      // Cerrar el modal
      onClose();

    } catch (error: any) {
      console.error("❌ Error al finalizar el surtido:", error);

      if (error.response?.status === 404) {
        alert("❌ Nevera no encontrada. Verifica el ID de la nevera.");
      } else if (error.response?.status === 403) {
        alert("❌ No tienes permisos para finalizar este surtido.");
      } else if (error.response?.status === 400) {
        alert("❌ Error en los datos. El surtido no puede ser finalizado en este momento.");
      } else if (error.response?.status === 401) {
        alert("⚠️ Sesión expirada. Redirigiendo al login...");
        window.location.href = "/login";
      } else {
        alert("❌ Error al finalizar el surtido. Por favor intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '30px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#111827',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            🏪 Nevera ID: {idNevera}
          </h1>
          <h2 style={{
            margin: '0 0 15px 0',
            color: '#374151',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {nombreTienda || 'Cargando...'}
          </h2>
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '10px',
            padding: '15px',
            marginTop: '15px'
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              color: '#92400e',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📋 PROCESO DE SURTIDO EN CURSO
            </h3>
            <p style={{
              margin: '0 0 10px 0',
              color: '#92400e',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Revisa la lista de productos a surtir. Confirma cuando hayas completado el surtido físico.
            </p>
            <p style={{
              margin: '0',
              color: '#92400e',
              fontSize: '14px',
              lineHeight: '1.4',
              fontWeight: 'bold'
            }}>
              ⚠️ Activa todos los toggles de confirmación para poder finalizar el surtido.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{ height: '100%', overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            backgroundColor: 'white'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: '#f9fafb',
              zIndex: 10
            }}>
              <tr>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  backgroundColor: '#f3f4f6',
                  minWidth: '120px'
                }}>Confirmación</th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  backgroundColor: '#f3f4f6',
                  minWidth: '200px'
                }}>Producto</th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  backgroundColor: '#f3f4f6',
                  minWidth: '140px'
                }}>Total a Surtir</th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  backgroundColor: '#f3f4f6',
                  minWidth: '120px'
                }}>Stock Actual</th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  backgroundColor: '#f3f4f6',
                  minWidth: '140px'
                }}>Stock Ideal</th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  backgroundColor: '#f3f4f6',
                  minWidth: '120px'
                }}>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {productosASurtir.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                    fontSize: '16px',
                    fontStyle: 'italic'
                  }}>
                    🎉 Todos los productos están al nivel ideal. No hay nada que surtir.
                  </td>
                </tr>
              ) : (
                productosASurtir.map((producto) => {
                const totalASurtir = Math.max(0, producto.stock_ideal_final - producto.stock_en_tiempo_real);

                return (
                  <tr key={producto.id_producto} style={{
                    backgroundColor: totalASurtir === 0 ? '#fef2f2' : '#f0fdf4'
                  }}>
                    <td style={{ padding: '12px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {/* Toggle de confirmación */}
                      <div style={{
                        position: 'relative',
                        width: '50px',
                        height: '24px',
                        backgroundColor: confirmations[producto.id_producto] ? '#10b981' : '#e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        margin: '0 auto'
                      }}
                      onClick={() => handleConfirmationToggle(producto.id_producto)}>
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: confirmations[producto.id_producto] ? '26px' : '2px',
                          width: '20px',
                          height: '20px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <div style={{
                        fontSize: '10px',
                        marginTop: '2px',
                        color: confirmations[producto.id_producto] ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {confirmations[producto.id_producto] ? 'CONFIRMADO' : 'PENDIENTE'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid #e5e7eb' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {producto.nombre_producto}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {producto.peso_nominal_g}g
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      color: totalASurtir === 0 ? '#dc2626' : '#059669'
                    }}>
                      {totalASurtir}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: producto.stock_en_tiempo_real === 0 ? '#ef4444' : '#10b981'
                    }}>
                      {producto.stock_en_tiempo_real}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {producto.stock_ideal_final}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        backgroundColor: producto.calificacion_surtido === 'crítica' ? '#ef4444' :
                                       producto.calificacion_surtido === 'baja' ? '#f97316' :
                                       producto.calificacion_surtido === 'media' ? '#f59e0b' :
                                       producto.calificacion_surtido === 'alta' ? '#10b981' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        {producto.calificacion_surtido || 'Sin calificar'}
                      </span>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer con botón de confirmar */}
      <div style={{
        padding: '20px',
        borderTop: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleFinalizarSurtido}
          disabled={loading || (!allConfirmed && productosASurtir.length > 0)}
          style={{
            padding: '15px 40px',
            backgroundColor: (allConfirmed || productosASurtir.length === 0) ? '#059669' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: (loading || (!allConfirmed && productosASurtir.length > 0)) ? 'not-allowed' : 'pointer',
            opacity: (loading || (!allConfirmed && productosASurtir.length > 0)) ? 0.6 : 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minWidth: '200px'
          }}
        >
          {loading ? 'FINALIZANDO...' :
           productosASurtir.length === 0 ? 'CONFIRMAR SURTIDO COMPLETADO' :
           allConfirmed ? 'CONFIRMAR SURTIDO COMPLETADO' : 'CONFIRMA TODOS LOS PRODUCTOS'}
        </button>
      </div>
    </div>
  );
};

export default SurtirProcesoModal;