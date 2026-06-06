// @ts-nocheck
import React from 'react';
import TablaTransacciones from '../TablaTransacciones/TablaTransacciones';
import type { TransaccionesData } from '../../types/cuentas-frigorifico.types';

interface CuentasFrigorificoViewProps {
  transacciones: TransaccionesData | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  mesesHistoricos: Array<{mes: number, año: number, fecha: string}>;
  mesSeleccionado: {mes: number, año: number} | null;
  showMesesMenu: boolean;
  consultarMesEspecifico: (mes: number, año: number) => void;
  setShowMesesMenu: (show: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
  esFrigorifico: boolean;
  formatMoneda: (monto: number) => string;
  hideHeader?: boolean;
}

const CuentasFrigorificoView: React.FC<CuentasFrigorificoViewProps> = ({
  transacciones,
  loading,
  error,
  successMessage,
  mesesHistoricos,
  mesSeleccionado,
  consultarMesEspecifico,
  setError,
  setSuccessMessage,
  esFrigorifico,
  formatMoneda,
  hideHeader = false,
}) => {
  return (
    <div className="cuentas-page">
      {!hideHeader && (
        <div className="cuentas-header">
          {esFrigorifico ? (
            <>
              <h1>Mis Cuentas Globales</h1>
              <p className="subtitle">
                Revisa tus transacciones de productos pendientes y consolidados
              </p>
            </>
          ) : (
            <>
              <h1>Cuentas Globales</h1>
              <p className="subtitle">
                Consulta las transacciones de productos pendientes y consolidados por usuario
              </p>
            </>
          )}
        </div>
      )}

      {transacciones && (() => {
        const pendientes = transacciones.transacciones.filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE').length;
        const consolidados = transacciones.transacciones.filter((t: any) => t.nombre_tipo_transaccion === 'ticket_consolidado').length;
        const saldoTotalPendientes = transacciones.transacciones.filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum: number, t: any) => sum + t.monto, 0);
        const montoTotalMes = transacciones.transacciones.filter((t: any) =>
          t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
        ).filter((t: any) => t.id_empaque !== null).reduce((sum: number, t: any) => sum + t.monto, 0);
        const montoTiendaMes = transacciones.transacciones.filter((t: any) =>
          t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
        ).filter((t: any) => t.id_empaque !== null).reduce((sum: number, t: any) => sum + (t.costo_tienda || 0), 0);

        return (
          <div className="resumen-financiero">
            <div className="resumen-item">
              <span className="resumen-label">📊 Total Transacciones:</span>
              <span className="resumen-value">{transacciones.total_transacciones}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">⏳ Pendientes:</span>
              <span className="resumen-value">{pendientes}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">✅ Consolidados:</span>
              <span className="resumen-value">{consolidados}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">💰 Saldo Total (Pendientes):</span>
              <span className="resumen-value">
                {formatMoneda(saldoTotalPendientes)}
              </span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">📅 Monto del Mes:</span>
              <span className="resumen-value">
                {formatMoneda(montoTotalMes)}
              </span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">🏪 Monto Tienda Mes:</span>
              <span className="resumen-value">
                {formatMoneda(montoTiendaMes)}
              </span>
            </div>
          </div>
        );
      })()}

      {successMessage && (
        <div className="success-message" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}>
          <div className="success-content">
            <span className="success-icon">✅</span>
            <p>{successMessage}</p>
            <button
              className="success-close-btn"
              onClick={() => setSuccessMessage(null)}
              style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button
              className="error-retry-btn"
              onClick={() => setError(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {transacciones && (
        <div className="transacciones-container">
          <TablaTransacciones
            data={transacciones}
            loading={loading}
            error={error}
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={consultarMesEspecifico}
          />
        </div>
      )}
    </div>
  );
};

export type { CuentasFrigorificoViewProps };
export default CuentasFrigorificoView;
