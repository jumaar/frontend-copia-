import React from 'react';
import SummaryCard from '../../../components/SummaryCard/SummaryCard';
import TableEstacion from '../../../components/TableEstacion/TableEstacion';
import './FrigorificoCard.css';

interface FrigorificoCardProps {
  frigorifico: {
    id_frigorifico: number;
    nombre_frigorifico: string;
    direccion: string;
    lotes_en_stock: { cantidad: number; peso_total_g: number };
    lotes_despachados: { cantidad: number; peso_total_g: number };
    estaciones: any[];
  };
  expandedProducts: Set<string>;
  confirmedProducts: Set<string>;
  onToggleProduct: (productId: number) => void;
  onConfirmar: (estacionId: string, productoId: number, productoName: string, cantidadTotal: number) => void;
}

const FrigorificoCard: React.FC<FrigorificoCardProps> = ({
  frigorifico,
  expandedProducts,
  confirmedProducts,
  onToggleProduct,
  onConfirmar,
}) => (
  <div className="frigorifico-card">
    <div className="frigorifico-card-summary">
      <SummaryCard
        title="Lotes Despachados"
        value={String(frigorifico.lotes_despachados.cantidad)}
        description={`${(frigorifico.lotes_despachados.peso_total_g / 1000).toFixed(2)} kg`}
      />
      <SummaryCard
        title="Lotes en Stock"
        value={String(frigorifico.lotes_en_stock.cantidad)}
        description={`${(frigorifico.lotes_en_stock.peso_total_g / 1000).toFixed(2)} kg`}
      />
    </div>

    {frigorifico.estaciones.map(estacion => (
      <TableEstacion
        key={estacion.id_estacion}
        estacion={estacion}
        expandedProducts={expandedProducts}
        confirmedProducts={confirmedProducts}
        onToggleProduct={onToggleProduct}
        onConfirmar={onConfirmar}
      />
    ))}
  </div>
);

export default FrigorificoCard;
