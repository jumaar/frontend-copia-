import React from 'react';
import {
  numberToWords,
  formatCurrency,
  getTipoBadgeClass,
  getEstadoBadgeClass,
} from '../../hooks/useFinanzas';
import type {
  ResumenFinancieroData,
  LogisticaItem,
} from '../../hooks/useFinanzas';
import '../../../apps/logistica/pages/LogisticaFinanzasPage.css';

interface FinanzasViewProps {
  data: ResumenFinancieroData | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  setSuccessMessage: (msg: string | null) => void;
  selectedMonth: number;
  selectedYear: number;
  isAdmin: boolean;
  selectedLogistica: LogisticaItem | null;
  showModal: boolean;
  modalType: 'consolidacion' | 'ingreso';
  montoMovimiento: number;
  setMontoMovimiento: (val: number) => void;
  notaMovimiento: string;
  setNotaMovimiento: (val: string) => void;
  confirmText: string;
  setConfirmText: (val: string) => void;
  procesando: boolean;
  monthOptions: Array<{ month: number; year: number; label: string }>;
  handleMonthYearChange: (month: number, year: number) => void;
  retryFetch: () => void;
  openModal: (type: 'consolidacion' | 'ingreso') => void;
  closeModal: () => void;
  handleSubmitMovimiento: () => void;
  exportToCSV: () => void;
  exportToExcel: () => void;
}

const FinanzasView: React.FC<FinanzasViewProps> = ({
  data,
  loading,
  error,
  successMessage,
  setSuccessMessage,
  selectedMonth,
  selectedYear,
  isAdmin,
  selectedLogistica,
  showModal,
  modalType,
  montoMovimiento,
  setMontoMovimiento,
  notaMovimiento,
  setNotaMovimiento,
  confirmText,
  setConfirmText,
  procesando,
  monthOptions,
  handleMonthYearChange,
  retryFetch,
  openModal,
  closeModal,
  handleSubmitMovimiento,
  exportToCSV,
  exportToExcel,
}) => {
  return (
    <div className="management-page finanzas-page">
      <div className="cuentas-header">
        <h1>Finanzas</h1>
        <p>Gestión financiera y libro mayor de movimientos</p>
      </div>

      {successMessage && (
        <div className="finanzas-toast finanzas-toast-success">
          {successMessage}
          <button className="finanzas-toast-close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {loading && (
        <div className="finanzas-loading">
          <div className="finanzas-spinner"></div>
          <p>Cargando resumen financiero...</p>
        </div>
      )}

      {error && !loading && (
        <div className="finanzas-error">
          <p>{error}</p>
          <button
            className="button button-primary"
            onClick={retryFetch}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && data && data.transacciones.length === 0 && (
        <div className="finanzas-empty-state">
          <p>No hay movimientos registrados en este período.</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="finanzas-periodo-selector">
            <label>Período:</label>
            <select
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-').map(Number);
                handleMonthYearChange(m, y);
              }}
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section className="finanzas-resumen">
            <div className="finanzas-card finanzas-card-ingresos">
              <h3>Ingresos Totales</h3>
              <div className="finanzas-card-value">{formatCurrency(data.resumen.total_ingresos)}</div>
              <p>Período actual</p>
            </div>
            <div className="finanzas-card finanzas-card-egresos">
              <h3>Egresos Totales</h3>
              <div className="finanzas-card-value">{formatCurrency(data.resumen.total_egresos)}</div>
              <p>Período actual</p>
            </div>
            <div className={`finanzas-card finanzas-card-balance ${data.resumen.balance_neto_periodo >= 0 ? 'positive' : 'negative'}`}>
              <h3>Balance Neto</h3>
              <div className="finanzas-card-value">{formatCurrency(data.resumen.balance_neto_periodo)}</div>
              <p>Período actual</p>
            </div>
          </section>

          <section className="finanzas-dinero-out card">
            <div className="card-header">
              <h2>Dinero OUT</h2>
            </div>
            <div className="finanzas-dinero-out-body">
              <div className="finanzas-dinero-info">
                {isAdmin && selectedLogistica ? (
                  <>
                    <p><strong>Logística:</strong> {selectedLogistica.nombre_usuario} {selectedLogistica.apellido_usuario}</p>
                    {data.admin && (
                      <p><strong>Admin:</strong> {data.admin.nombre_completo}</p>
                    )}
                  </>
                ) : (
                  <>
                    {data.admin && (
                      <p><strong>Admin:</strong> {data.admin.nombre_completo}</p>
                    )}
                  </>
                )}
                <p><strong>Balance acumulado:</strong> {formatCurrency(data.resumen.balance_acumulado_historico)}</p>
              </div>

              <div className="finanzas-dinero-form">
                <div className="finanzas-form-group">
                  <label>Monto</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={montoMovimiento || ''}
                    onChange={(e) => setMontoMovimiento(Number(e.target.value))}
                  />
                </div>
                <div className="finanzas-form-group">
                  <label>Nota (opcional)</label>
                  <input
                    type="text"
                    placeholder="Nota opcional"
                    value={notaMovimiento}
                    onChange={(e) => setNotaMovimiento(e.target.value)}
                  />
                </div>
                {isAdmin && selectedLogistica ? (
                  <button
                    className="button button-primary"
                    onClick={() => openModal('ingreso')}
                  >
                    Entregar Dinero
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    onClick={() => openModal('consolidacion')}
                  >
                    Consolidar con Admin
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="finanzas-libro-mayor card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Libro Mayor</h2>
              <div className="finanzas-export-buttons">
                <button className="button button-secondary" onClick={exportToCSV}>
                  Exportar CSV
                </button>
                <button className="button button-secondary" onClick={exportToExcel}>
                  Exportar Excel
                </button>
              </div>
            </div>
            <div className="finanzas-table-container">
              <table className="finanzas-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Contraparte</th>
                    <th>Monto</th>
                    <th>Nota</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transacciones.map((t) => {
                    const isPositive = t.monto > 0;
                    return (
                      <tr key={t.id_transaccion}>
                        <td>{new Date(t.hora_transaccion).toLocaleString('es-CO', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}</td>
                        <td>
                          <span className={`finanzas-badge ${getTipoBadgeClass(t.nombre_tipo_transaccion)}`}>
                            {t.nombre_tipo_transaccion.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{t.usuario_relacionado?.nombre_completo || '—'}</td>
                        <td className={isPositive ? 'finanzas-monto-positive' : 'finanzas-monto-negative'}>
                          {isPositive ? '+' : ''}{formatCurrency(t.monto)}
                        </td>
                        <td>{t.nota_opcional || '—'}</td>
                        <td>
                          <span className={`finanzas-badge ${getEstadoBadgeClass(t.nombre_estado_transaccion)}`}>
                            {t.nombre_estado_transaccion}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {showModal && (
        <div className="finanzas-modal-overlay" onClick={closeModal}>
          <div className="finanzas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="finanzas-modal-header">
              <h3>
                {modalType === 'consolidacion' ? 'Confirmar Consolidación' : 'Confirmar Entrega'}
              </h3>
              <button className="finanzas-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="finanzas-modal-body">
              <p className="finanzas-modal-warning">
                {modalType === 'consolidacion'
                  ? `Vas a consolidar ${formatCurrency(Math.floor(montoMovimiento) || 0)} con ${data?.admin?.nombre_completo || 'Admin'}`
                  : `Vas a entregar ${formatCurrency(Math.floor(montoMovimiento) || 0)} a ${selectedLogistica?.nombre_usuario || ''} ${selectedLogistica?.apellido_usuario || ''}`
                }
              </p>

              <div className="finanzas-form-group">
                <label>
                  Escribe el monto en letras para confirmar:
                  <span className="finanzas-modal-hint">
                    {montoMovimiento > 0
                      ? `"${numberToWords(Math.floor(montoMovimiento))}"`
                      : '(ingresa un monto primero)'}
                  </span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Ej: CINCO MIL"
                  autoFocus
                />
              </div>

              <div className="finanzas-modal-actions">
                <button className="button button-secondary" onClick={closeModal} disabled={procesando}>
                  Cancelar
                </button>
                <button
                  className="button button-primary"
                  onClick={handleSubmitMovimiento}
                  disabled={procesando || montoMovimiento <= 0}
                >
                  {procesando ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanzasView;
