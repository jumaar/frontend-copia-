import React, { useState, useEffect } from 'react';
import { finalizarSurtidoNevera } from '../../../services/api';
import './SurtirProcesoModal.css';

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
    <div className="surtir-proceso-overlay">
      <div className="surtir-proceso-header">
        <div className="surtir-proceso-header-center">
          <h1 className="surtir-proceso-title">🏪 Nevera ID: {idNevera}</h1>
          <h2 className="surtir-proceso-subtitle">{nombreTienda || 'Cargando...'}</h2>
          <div className="surtir-proceso-alert">
            <h3>📋 PROCESO DE SURTIDO EN CURSO</h3>
            <p>Revisa la lista de productos a surtir. Confirma cuando hayas completado el surtido físico.</p>
            <p>⚠️ Activa todos los toggles de confirmación para poder finalizar el surtido.</p>
          </div>
        </div>
      </div>

      <div className="surtir-proceso-content">
        <div className="surtir-proceso-table-wrapper">
          <table className="surtir-proceso-table">
            <thead>
              <tr>
                <th className="surtir-proceso-th">Confirmación</th>
                <th className="surtir-proceso-th left wide">Producto</th>
                <th className="surtir-proceso-th med">Total a Surtir</th>
                <th className="surtir-proceso-th">Stock Actual</th>
                <th className="surtir-proceso-th med">Stock Ideal</th>
                <th className="surtir-proceso-th">Calificación</th>
              </tr>
            </thead>
            <tbody>
              {productosASurtir.length === 0 ? (
                <tr>
                  <td colSpan={6} className="surtir-proceso-empty">
                    🎉 Todos los productos están al nivel ideal. No hay nada que surtir.
                  </td>
                </tr>
              ) : (
                productosASurtir.map((producto) => {
                const totalASurtir = Math.max(0, producto.stock_ideal_final - producto.stock_en_tiempo_real);
                const isConfirmed = confirmations[producto.id_producto];

                return (
                  <tr key={producto.id_producto} style={{
                    backgroundColor: totalASurtir === 0 ? 'var(--color-alert-error-bg)' : 'var(--color-alert-success-bg)'
                  }}>
                    <td className="surtir-proceso-td">
                      <div
                        className={`surtir-proceso-toggle ${isConfirmed ? 'on' : 'off'}`}
                        onClick={() => handleConfirmationToggle(producto.id_producto)}
                      >
                        <div className={`surtir-proceso-toggle-thumb ${isConfirmed ? 'on' : 'off'}`} />
                      </div>
                      <div className="surtir-proceso-toggle-label" style={{ color: isConfirmed ? '#10b981' : '#ef4444' }}>
                        {isConfirmed ? 'CONFIRMADO' : 'PENDIENTE'}
                      </div>
                    </td>
                    <td className="surtir-proceso-td left">
                      <div>
                        <div className="surtir-proceso-product-name">{producto.nombre_producto}</div>
                        <div className="surtir-proceso-product-weight">{producto.peso_nominal_g}g</div>
                      </div>
                    </td>
                    <td className="surtir-proceso-td bold large" style={{ color: totalASurtir === 0 ? '#dc2626' : '#059669' }}>
                      {totalASurtir}
                    </td>
                    <td className="surtir-proceso-td bold medium" style={{ color: producto.stock_en_tiempo_real === 0 ? '#ef4444' : '#10b981' }}>
                      {producto.stock_en_tiempo_real}
                    </td>
                    <td className="surtir-proceso-td bold medium">{producto.stock_ideal_final}</td>
                    <td className="surtir-proceso-td">
                      <span className="surtir-proceso-calificacion-badge" style={{
                        backgroundColor: producto.calificacion_surtido === 'crítica' ? '#ef4444' :
                                       producto.calificacion_surtido === 'baja' ? '#f97316' :
                                       producto.calificacion_surtido === 'media' ? '#f59e0b' :
                                       producto.calificacion_surtido === 'alta' ? '#10b981' : 'var(--color-text-secondary)',
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

      <div className="surtir-proceso-footer">
        <button
          className="surtir-proceso-btn"
          onClick={handleFinalizarSurtido}
          disabled={loading || (!allConfirmed && productosASurtir.length > 0)}
          style={{
            backgroundColor: (allConfirmed || productosASurtir.length === 0) ? '#059669' : '#6b7280',
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