import React from 'react';
import { formatMoneda } from '../../config/format';

interface PagoFormProps {
  tipoPago: 'pago' | 'abono' | '';
  montoPago: number;
  notaPago: string;
  saldoTotalLiquidar: number;
  procesandoPago: boolean;
  showTipoMenu: boolean;
  userName: string;
  onSelectTipo: (tipo: 'pago' | 'abono' | '') => void;
  onToggleTipoMenu: () => void;
  onChangeMonto: (monto: number) => void;
  onChangeNota: (nota: string) => void;
  onPagar: () => void;
}

const PagoForm: React.FC<PagoFormProps> = ({
  tipoPago,
  montoPago,
  notaPago,
  saldoTotalLiquidar,
  procesandoPago,
  showTipoMenu,
  userName,
  onSelectTipo,
  onToggleTipoMenu,
  onChangeMonto,
  onChangeNota,
  onPagar,
}) => {
  return (
    <div className="pago-abono-section" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>💰 Gestión de Cobro</h3>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Total a Cobrar:</strong>{' '}
        <span style={{ fontSize: '1.2em', color: saldoTotalLiquidar > 0 ? 'var(--color-success)' : 'var(--color-success)' }}>
          {formatMoneda(saldoTotalLiquidar)}
        </span>
        {saldoTotalLiquidar === 0 && (
          <span style={{ color: 'var(--color-success)', marginLeft: '0.5rem' }}>(✅ Sin deuda pendiente)</span>
        )}
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ color: 'var(--color-text-primary)' }}>Tipo de Transacción:</label>
        <div className="meses-dropdown">
          <button className="dropdown-toggle" onClick={onToggleTipoMenu} style={{ opacity: 1, cursor: 'pointer', minWidth: '200px' }}>
            <span>{tipoPago === 'pago' ? 'Cobro Total' : 'Abono'}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showTipoMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <span className="mes-fecha">Cobro Total</span>
                <button
                  className={`btn-consultar ${tipoPago === 'pago' ? 'activo' : ''}`}
                  onClick={() => { onSelectTipo('pago'); onToggleTipoMenu(); }}
                >
                  Seleccionar
                </button>
              </div>
              <div className="dropdown-item">
                <span className="mes-fecha">Abono</span>
                <button
                  className={`btn-consultar ${tipoPago === 'abono' ? 'activo' : ''}`}
                  onClick={() => { onSelectTipo('abono'); onToggleTipoMenu(); }}
                >
                  Seleccionar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {tipoPago && (
        tipoPago === 'pago' ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Monto a Cobrar:</strong>
              <div style={{ fontSize: '2em', color: 'var(--color-success)', marginTop: '0.5rem' }}>
                {formatMoneda(saldoTotalLiquidar)}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Nota:</label>
              <input type="text" value={notaPago} onChange={e => onChangeNota(e.target.value)}
                placeholder={`cobro total hecho por ${userName}`}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Monto del Abono:</label>
              <input type="number" value={montoPago || ''} onChange={e => onChangeMonto(parseFloat(e.target.value) || 0)}
                min="0" step="0.01"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Nota:</label>
              <input type="text" value={notaPago} onChange={e => onChangeNota(e.target.value)}
                placeholder="Nota opcional para el abono"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>
        )
      )}

      <button
        type="button"
        onClick={onPagar}
        disabled={procesandoPago}
        style={{
          padding: '0.5rem 1rem', backgroundColor: 'var(--color-success)', color: 'white',
          border: 'none', borderRadius: '4px', cursor: procesandoPago ? 'not-allowed' : 'pointer',
          opacity: procesandoPago ? 0.7 : 1, width: 'auto', display: 'inline-block',
          pointerEvents: procesandoPago ? 'none' : 'auto', outline: 'none'
        }}
      >
        {procesandoPago ? 'Procesando...' : 'Cobrar'}
      </button>
    </div>
  );
};

export default PagoForm;
