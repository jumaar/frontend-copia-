import React from 'react';
import './ConfirmacionTransaccionModal.css';

interface ConfirmacionTransaccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  processing: boolean;
  title: string;
  origen: string;
  destino: string;
  monto: number;
  codigo: string;
  setCodigo: (v: string) => void;
  disabled?: boolean;
}

const formatMoneda = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

const ConfirmacionTransaccionModal: React.FC<ConfirmacionTransaccionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  processing,
  title,
  origen,
  destino,
  monto,
  codigo,
  setCodigo,
  disabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="ctm-overlay" onClick={onClose}>
      <div className="ctm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ctm-header">
          <div className="ctm-header-icon">🔐</div>
          <h3>{title}</h3>
          <button className="ctm-close" onClick={onClose}>×</button>
        </div>

        <div className="ctm-body">
          <div className="ctm-receipt">
            <div className="ctm-receipt-row">
              <span className="ctm-receipt-label">Origen</span>
              <span className="ctm-receipt-value">{origen}</span>
            </div>
            <div className="ctm-receipt-row">
              <span className="ctm-receipt-label">Destino</span>
              <span className="ctm-receipt-value">{destino}</span>
            </div>
            <div className="ctm-receipt-row ctm-receipt-row--monto">
              <span className="ctm-receipt-label">Monto</span>
              <span className="ctm-receipt-value ctm-receipt-monto">{formatMoneda(monto)}</span>
            </div>
          </div>

          <div className="ctm-token-section">
            <label className="ctm-token-label">Código de verificación</label>
            <input
              type="text"
              className="ctm-token-input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="• • • • • •"
              autoFocus
              disabled={processing}
              inputMode="numeric"
              maxLength={6}
            />
            <span className="ctm-token-hint">Ingresa el código de seguridad para confirmar la transacción</span>
          </div>

          <div className="ctm-actions">
            <button className="button button-secondary ctm-btn-cancel" onClick={onClose} disabled={processing}>
              Cancelar
            </button>
            <button
              className="button button-primary ctm-btn-confirm"
              onClick={onConfirm}
              disabled={processing || disabled || !codigo.trim()}
            >
              {processing ? 'Procesando...' : 'Confirmar transacción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { ConfirmacionTransaccionModalProps };
export default ConfirmacionTransaccionModal;
