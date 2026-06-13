import React from 'react';
import BuscadorMeses from '../BuscadorMeses/BuscadorMeses';
import './TransaccionesHeader.css';

interface TransaccionesHeaderProps {
  title?: string;
  titleSize?: 'large' | 'normal';
  periodo: { mes: number; año: number };
  esPeriodoActual: boolean;
  fechaCreacion?: string;
  neveraId?: number;
  mesesHistoricos: Array<{ mes: number; año: number; fecha: string }>;
  mesSeleccionado: { mes: number; año: number } | null;
  onConsultarMes: (mes: number, año: number) => void;
  loading?: boolean;
  summary?: React.ReactNode;
}

const TransaccionesHeader: React.FC<TransaccionesHeaderProps> = ({
  title,
  titleSize = 'normal',
  periodo,
  esPeriodoActual,
  fechaCreacion,
  neveraId,
  mesesHistoricos,
  mesSeleccionado,
  onConsultarMes,
  loading = false,
  summary,
}) => {
  return (
    <div className="transacciones-header">
      <div className="th-user-info">
        {neveraId && (
          <div className="nevera-id-header">
            Nevera #{neveraId}
          </div>
        )}
        {title && titleSize === 'large' && (
          <div className="th-title-large" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {title}
          </div>
        )}
        {title && titleSize === 'normal' && (
          <h2>{title}</h2>
        )}
        <div className="th-period-row">
          <p className="periodo-info">
            Período: {periodo.mes}/{periodo.año}
            {esPeriodoActual && <span className="badge-actual">ACTUAL</span>}
          </p>
          <BuscadorMeses
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={onConsultarMes}
            loading={loading}
          />
        </div>
        {fechaCreacion && (
          <p className="th-fecha-creacion">Usuario desde: {fechaCreacion}</p>
        )}
      </div>
      {summary && (
        <div className="summary-info">
          {summary}
        </div>
      )}
    </div>
  );
};

export type { TransaccionesHeaderProps };
export default TransaccionesHeader;
