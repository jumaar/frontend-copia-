import React from 'react';
import MesesDropdown from '../MesesDropdown/MesesDropdown';
import type { MesItem } from '../MesesDropdown/MesesDropdown';
import '../TablaTransacciones/TablaTransacciones.css';

interface TransaccionesHeaderProps {
  title?: string;
  titleSize?: 'large' | 'normal';
  periodo: { mes: number; año: number };
  esPeriodoActual: boolean;
  fechaCreacion?: string;
  neveraId?: number;
  mesesHistoricos: MesItem[];
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
      <div className="user-info">
        {neveraId && (
          <div className="nevera-id-header">
            Nevera #{neveraId}
          </div>
        )}
        {title && titleSize === 'large' && (
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {title}
          </div>
        )}
        {title && titleSize === 'normal' && (
          <h2>{title}</h2>
        )}
        <p className="periodo-info">
          Período: {periodo.mes}/{periodo.año}
          {esPeriodoActual && <span className="badge-actual">ACTUAL</span>}
        </p>
        {fechaCreacion && (
          <p className="fecha-creacion">{fechaCreacion}</p>
        )}
        {mesesHistoricos.length > 0 && (
          <MesesDropdown
            meses={mesesHistoricos}
            seleccionado={mesSeleccionado}
            onSelect={onConsultarMes}
            loading={loading}
          />
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
