import React from 'react';
import TransaccionesHeader from '../../../../components/TransaccionesHeader/TransaccionesHeader';
import SummaryCard from '../../../../components/SummaryCard/SummaryCard';
import LibroMayor from '../../../../components/LibroMayor/LibroMayor';
import { formatMoneda } from '../../../../config/format';
import type { TransaccionesData, MesItem } from '../../../../types/cuentas-tienda.types';
import './CuentasTiendaView.css';

interface CuentasTiendaViewProps {
  transacciones: TransaccionesData;
  loading: boolean;
  error: string | null;
  neveraSeleccionada: number | null;
  tiendaSeleccionada: number | null;
  expandedProductos: Set<number>;
  mesesHistoricos: MesItem[];
  mesSeleccionado: { mes: number; año: number } | null;
  saldoTotalLiquidar: number;
  onToggleProducto: (idProducto: number) => void;
  onConsultarMes: (mes: number, año: number) => void;
  gestionCobroSlot?: React.ReactNode;
}

const CuentasTiendaView: React.FC<CuentasTiendaViewProps> = ({
  transacciones,
  loading,
  error,
  neveraSeleccionada,
  tiendaSeleccionada,
  mesesHistoricos,
  mesSeleccionado,
  saldoTotalLiquidar,
  onConsultarMes,
  gestionCobroSlot,
}) => {
  const summaryCards = React.useMemo(() => {
    if (!tiendaSeleccionada || !neveraSeleccionada || !transacciones?.transacciones) return null;

    const txs = transacciones.transacciones;
    const pendientesCount = transacciones?.empaques?.length || txs.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').length;
    const consolidados = txs.filter(t => t.nombre_tipo_transaccion === 'ticket_consolidado').length;
    const saldoTotalPendientes = txs.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
    const montoTotalMes = txs.filter(t =>
      t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
    ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + t.monto, 0);
    const montoTiendaMes = txs.filter(t =>
      t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
    ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + (t.costo_tienda || 0), 0);
    const saldoALiquidar = transacciones?.empaques?.length ? saldoTotalLiquidar : 0;

    return { pendientesCount, consolidados, saldoTotalPendientes, montoTotalMes, montoTiendaMes, saldoALiquidar, totalTransacciones: transacciones.total_transacciones };
  }, [transacciones, tiendaSeleccionada, neveraSeleccionada, saldoTotalLiquidar]);

  return (
    <div>
      {summaryCards && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'calc(var(--spacing-unit) * 2)', marginBottom: 'calc(var(--spacing-unit) * 3)' }}>
          <SummaryCard title="Pendientes" value={String(summaryCards.pendientesCount)} description="Transacciones" variant="warning" />
          <SummaryCard title="Saldo Pend." value={formatMoneda(summaryCards.saldoTotalPendientes + summaryCards.saldoALiquidar)} description="Total" variant="danger" />
          <SummaryCard title="Monto del Mes" value={formatMoneda(summaryCards.montoTotalMes)} description="Total mes" variant="neutral" />
          <SummaryCard title="Ganancias Tienda" value={formatMoneda(summaryCards.montoTiendaMes)} description="Costo tienda" variant="neutral" />
        </section>
      )}

      {transacciones && (
        <>
          <TransaccionesHeader
            title={transacciones.nevera ? `Nevera #${transacciones.nevera.id_nevera} — ${transacciones.nevera.nombre_tienda}` : ''}
            periodo={transacciones.periodo}
            esPeriodoActual={transacciones.parametros_usados.es_periodo_actual}
            neveraId={transacciones.nevera?.id_nevera}
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={onConsultarMes}
            loading={loading}
          />

          {gestionCobroSlot}

          <LibroMayor
            transactions={transacciones.transacciones}
            selectedMonth={transacciones.periodo.mes}
            selectedYear={transacciones.periodo.año}
          />
        </>
      )}
    </div>
  );
};

export default CuentasTiendaView;
