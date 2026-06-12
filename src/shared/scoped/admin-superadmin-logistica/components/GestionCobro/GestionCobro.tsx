import React, { useEffect } from 'react';
import Dropdown from '../../../../components/Dropdown/Dropdown';
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
  pendientesCount?: number;
  onConsolidarCero?: () => void;
  consolidandoCero?: boolean;
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
  pendientesCount,
  onConsolidarCero,
  consolidandoCero,
}) => {
  const L = LABELS[mode];

  const formatMoneda = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  const puedeConsolidarCero = saldoTotalLiquidar === 0 && (pendientesCount ?? 0) > 0;

  const preposicion = mode === 'recibir' ? 'de' : 'a';

  const saldoNegativo = saldoTotalLiquidar != null && saldoTotalLiquidar < 0;
  const sinPendientes = (pendientesCount ?? 0) === 0;
  const ocultarPagoTotal = saldoNegativo || sinPendientes;

  const opcionesTipo: Array<{ id: string; label: string }> = [
    ...(ocultarPagoTotal ? [] : [{ id: 'pago', label: L.tipoTotal }]),
    { id: 'abono', label: 'Abono' },
  ];

  useEffect(() => {
    if (ocultarPagoTotal && tipoPago === 'pago') {
      setTipoPago('');
    }
  }, [ocultarPagoTotal, tipoPago, setTipoPago]);

  return (
    <div className="gestion-cobro-section">
      <div className="gestion-cobro-header">
        <h3 className="gestion-cobro-title">{L.titulo} {userName ? `${preposicion} ${userName}` : ''}</h3>
        {onConsolidarCero && (
          <button
            className={`gestion-cobro-consolidar-cero ${puedeConsolidarCero ? 'gestion-cobro-consolidar-cero--activo' : ''}`}
            onClick={onConsolidarCero}
            disabled={!puedeConsolidarCero || consolidandoCero}
            title={puedeConsolidarCero
              ? 'Consolida todas las transacciones pendientes con un valor de $0 cuando no hay saldo por cobrar.'
              : 'Este botón se activa cuando el saldo pendiente es $0 y existen transacciones en estado PENDIENTE.'}
          >
            <span className="gestion-cobro-consolidar-cero-text">
              {consolidandoCero ? 'Consolidando...' : 'Consolidar con valor 0'}
            </span>
            <span className="gestion-cobro-consolidar-cero-tooltip">
              {puedeConsolidarCero
                ? 'Consolida todas las transacciones pendientes con un valor de $0 cuando no hay saldo por cobrar.'
                : 'Este botón se activa cuando el saldo pendiente es $0 y existen transacciones en estado PENDIENTE.'}
            </span>
          </button>
        )}
      </div>

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
          options={opcionesTipo}
          selectedId={tipoPago || null}
          onSelect={(id) => setTipoPago(id as 'pago' | 'abono')}
          placeholder="Seleccionar tipo..."
        />
        {ocultarPagoTotal && (
          <span className="gestion-cobro-saldo-sin-deuda" style={{ display: 'block', marginTop: '8px' }}>
            ⚠️ {saldoNegativo ? 'Saldo negativo' : 'Sin transacciones pendientes'}: solo se permiten abonos.
          </span>
        )}
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
                  value={montoPago === 0 ? '' : (montoPago ?? '')}
                  onChange={e => setMontoPago(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
