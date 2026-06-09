import React from 'react';
import Dropdown from '../Dropdown/Dropdown';
import type { MesItem } from '../../types/cuentas-tienda.types';
import './BuscadorMeses.css';

interface BuscadorMesesProps {
  mesesHistoricos: MesItem[];
  mesSeleccionado: { mes: number; año: number } | null;
  onConsultarMes: (mes: number, año: number) => void;
  loading?: boolean;
  placeholder?: string;
}

const BuscadorMeses: React.FC<BuscadorMesesProps> = ({
  mesesHistoricos,
  mesSeleccionado,
  onConsultarMes,
  loading = false,
  placeholder = 'Consultar Meses Anteriores',
}) => {
  if (!mesesHistoricos.length) return null;

  return (
    <div className="buscador-meses">
      <Dropdown
        options={mesesHistoricos.map(m => ({ id: `${m.mes}-${m.año}`, label: m.fecha }))}
        selectedId={mesSeleccionado ? `${mesSeleccionado.mes}-${mesSeleccionado.año}` : null}
        onSelect={(id) => {
          const [mes, año] = String(id).split('-').map(Number);
          onConsultarMes(mes, año);
        }}
        loading={loading}
        placeholder={placeholder}
        actionLabel="Consultar"
      />
    </div>
  );
};

export type { BuscadorMesesProps };
export default BuscadorMeses;
