import React from 'react';
import Dropdown from '../../../components/Dropdown/Dropdown';
import './GestionCobro.css';

interface GestionCobroProps {
  mode?: 'recibir' | 'entregar';
  tipoPago: 'pago' | 'abono' | '';
  setTipoPago: (tipo: 'pago' | 'abono' | '') => void;
  montoPago: number;
  setMontoPago: (monto: number) => void;
  notaPago: string;
  setNotaPago: (nota: string) => void;
  procesandoPago: boolean;
  onProcesarPago: () => void;
  userName: string;
  saldoTotalLiquidar?: number;
}

const LABELS: Record<string, { titulo: string; saldo: string; tipoTotal: string; btnTotal: string; placeholderNota: string }> = {
  recibir: {
    titulo: '💰 Recibir Dinero',
    saldo: 'Total a Recibir',
    tipoTotal: 'Recibir Total',
    btnTotal: 'Recibir Total',
    placeholderNota: 'recibir total por',
  },
  entregar: {
    titulo: '💳 Entregar Dinero',
    saldo: 'Total a Entregar',
    tipoTotal: 'Entregar Total',
    btnTotal: 'Entregar Total',
    placeholderNota: 'entregar total por',
  },
};

const GestionCobro: React.FC<GestionCobroProps> = ({
  mode = 'recibir',
  tipoPago,
  setTipoPago,
  montoPago,
  setMontoPago,
  notaPago,
  setNotaPago,
  procesandoPago,
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
        <Dropdown
          options={[
            { id: 'pago', label: L.tipoTotal },
            { id: 'abono', label: 'Abono' },
          ]}
          selectedId={tipoPago || null}
          onSelect={(id) => setTipoPago(id as 'pago' | 'abono')}
          placeholder="Seleccionar tipo..."
        />
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
