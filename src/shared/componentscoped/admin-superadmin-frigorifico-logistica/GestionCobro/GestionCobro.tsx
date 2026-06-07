import React from 'react';
import './GestionCobro.css';

interface GestionCobroProps {
  mode?: 'cobro' | 'pago';
  tipoPago: 'pago' | 'abono' | '';
  setTipoPago: (tipo: 'pago' | 'abono' | '') => void;
  montoPago: number;
  setMontoPago: (monto: number) => void;
  notaPago: string;
  setNotaPago: (nota: string) => void;
  procesandoPago: boolean;
  showTipoMenu: boolean;
  setShowTipoMenu: (show: boolean) => void;
  onProcesarPago: () => void;
  userName: string;
  saldoTotalLiquidar?: number;
}

const LABELS: Record<string, { titulo: string; saldo: string; tipoTotal: string; btnTotal: string; placeholderNota: string }> = {
  cobro: {
    titulo: '💰 Gestión de Cobro',
    saldo: 'Total a Cobrar',
    tipoTotal: 'Cobro Total',
    btnTotal: 'Cobrar Total',
    placeholderNota: 'cobro total por',
  },
  pago: {
    titulo: '💳 Gestión de Pago',
    saldo: 'Total a Pagar',
    tipoTotal: 'Pago Total',
    btnTotal: 'Pagar Total',
    placeholderNota: 'pago total por',
  },
};

const GestionCobro: React.FC<GestionCobroProps> = ({
  mode = 'cobro',
  tipoPago,
  setTipoPago,
  montoPago,
  setMontoPago,
  notaPago,
  setNotaPago,
  procesandoPago,
  showTipoMenu,
  setShowTipoMenu,
  onProcesarPago,
  userName,
  saldoTotalLiquidar,
}) => {
  const L = LABELS[mode];

  const formatMoneda = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  return (
    <div className="gestion-cobro-section">
      <h3 className="gestion-cobro-title">{L.titulo}</h3>

      {saldoTotalLiquidar != null && (
        <div className="gestion-cobro-saldo">
          <strong>{L.saldo}:</strong>{' '}
          {saldoTotalLiquidar != null && saldoTotalLiquidar < 0 ? (
            <span className="gestion-cobro-saldo-monto gestion-cobro-saldo-monto--negativo">
              <span className="gestion-cobro-saldo-signo">−</span>{formatMoneda(Math.abs(saldoTotalLiquidar))}
            </span>
          ) : (
            <span className="gestion-cobro-saldo-monto">{formatMoneda(saldoTotalLiquidar)}</span>
          )}
          {saldoTotalLiquidar === 0 && (
            <span className="gestion-cobro-saldo-sin-deuda">(✅ Sin deuda pendiente)</span>
          )}
        </div>
      )}

      <div className="gestion-cobro-tipo">
        <label>Tipo de Transacción:</label>
        <div className="meses-dropdown">
          <button className="dropdown-toggle" onClick={() => setShowTipoMenu(!showTipoMenu)}>
            <span>{tipoPago === 'pago' ? L.tipoTotal : tipoPago === 'abono' ? 'Abono' : 'Seleccionar tipo...'}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showTipoMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <span className="mes-fecha">{L.tipoTotal}</span>
                <button className={`btn-consultar ${tipoPago === 'pago' ? 'activo' : ''}`} onClick={() => { setTipoPago('pago'); setShowTipoMenu(false); }}>Seleccionar</button>
              </div>
              <div className="dropdown-item">
                <span className="mes-fecha">Abono</span>
                <button className={`btn-consultar ${tipoPago === 'abono' ? 'activo' : ''}`} onClick={() => { setTipoPago('abono'); setShowTipoMenu(false); }}>Seleccionar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {tipoPago && (
        <div className="gestion-cobro-form">
          {tipoPago === 'pago' ? (
            <div className="gestion-cobro-field">
              <strong>Nota:</strong>
              <input
                type="text"
                className="gestion-cobro-input"
                value={notaPago}
                onChange={e => setNotaPago(e.target.value)}
                placeholder={`${L.placeholderNota} ${userName || ''}`}
              />
            </div>
          ) : (
            <>
              <div className="gestion-cobro-field">
                <strong>Monto del Abono:</strong>
                <input
                  type="number"
                  className="gestion-cobro-input"
                  value={montoPago || ''}
                  onChange={e => setMontoPago(parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="gestion-cobro-field">
                <strong>Nota:</strong>
                <input
                  type="text"
                  className="gestion-cobro-input"
                  value={notaPago}
                  onChange={e => setNotaPago(e.target.value)}
                  placeholder="Nota opcional"
                />
              </div>
            </>
          )}
          <button
            className="btn-consultar gestion-cobro-submit"
            onClick={onProcesarPago}
            disabled={procesandoPago}
          >
            {procesandoPago ? 'Procesando...' : tipoPago === 'pago' ? L.btnTotal : 'Realizar Abono'}
          </button>
        </div>
      )}
    </div>
  );
};

export type { GestionCobroProps };
export default GestionCobro;
