import React from 'react';
import TablaTransacciones from '../../../../components/TablaTransacciones/TablaTransacciones';
import Resumen from '../../../../components/Resumen/Resumen';
import EmpaquesPendientes from '../../../../components/EmpaquesPendientes/EmpaquesPendientes';
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
}

const CuentasTiendaView: React.FC<CuentasTiendaViewProps> = ({
  transacciones,
  loading,
  error,
  neveraSeleccionada,
  tiendaSeleccionada,
  expandedProductos,
  mesesHistoricos,
  mesSeleccionado,
  saldoTotalLiquidar,
  onToggleProducto,
  onConsultarMes,
}) => {
  const resumenItems = React.useMemo(() => {
    if (!tiendaSeleccionada || !neveraSeleccionada || !transacciones?.transacciones) return [];

    const pendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').length;
    const consolidados = transacciones.transacciones.filter(t => t.nombre_tipo_transaccion === 'ticket_consolidado').length;
    const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
    const montoTotalMes = transacciones.transacciones.filter(t =>
      t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
    ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + t.monto, 0);
    const montoTiendaMes = transacciones.transacciones.filter(t =>
      t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
    ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + (t.costo_tienda || 0), 0);
    const saldoALiquidar = transacciones?.empaques?.length ? saldoTotalLiquidar : 0;
    const pendientesCount = transacciones?.empaques?.length || pendientes;

    return [
      { label: 'Total Transacciones', value: String(transacciones.total_transacciones), icon: '📊' },
      { label: 'Pendientes', value: String(pendientesCount), icon: '⏳' },
      { label: 'Consolidados', value: String(consolidados), icon: '✅' },
      { label: 'Saldo Total (Pendientes)', value: formatMoneda(saldoTotalPendientes + saldoALiquidar), icon: '💰' },
      { label: 'Monto del Mes', value: formatMoneda(montoTotalMes), icon: '📅' },
      { label: 'Monto Tienda Mes', value: formatMoneda(montoTiendaMes), icon: '🏪' },
    ];
  }, [transacciones, tiendaSeleccionada, neveraSeleccionada, saldoTotalLiquidar]);

  return (
    <div>
      <Resumen items={resumenItems} />

      {transacciones && (
        <div className="transacciones-container">
          <TablaTransacciones
            data={transacciones}
            loading={loading}
            error={error}
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={onConsultarMes}
          />
        </div>
      )}

      {neveraSeleccionada && transacciones?.empaques?.length ? (
        <EmpaquesPendientes
          empaques={transacciones.empaques}
          productos={transacciones.productos || []}
          promociones={transacciones.promociones || []}
          expandedProductos={expandedProductos}
          onToggleProducto={onToggleProducto}
        />
      ) : null}
    </div>
  );
};

export default CuentasTiendaView;
