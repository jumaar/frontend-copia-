import React, { useState } from 'react';
import { formatMoneda, formatFecha } from '../../config/format';
import './TablaPendientes.css';

interface TransaccionItem {
  id_transaccion: number;
  id_empaque: number | null;
  monto: number;
  costo_tienda?: number | null;
  hora_transaccion?: string;
  nombre_tipo_transaccion: string;
  nombre_estado_transaccion?: string;
  nota_opcional: string;
}

interface TablaPendientesProps {
  pendientes: TransaccionItem[];
  variant?: 'cliente' | 'proveedor';
}

const TablaPendientes: React.FC<TablaPendientesProps> = ({
  pendientes,
  variant = 'cliente',
}) => {
  const [expandedNotas, setExpandedNotas] = useState<Set<number>>(new Set());

  const isProveedor = variant === 'proveedor';
  const costoLabel = isProveedor ? 'Costo Frigorifico' : 'Costo Tienda';

  const toggleNota = (idTransaccion: number) => {
    setExpandedNotas(prev => {
      const next = new Set(prev);
      if (next.has(idTransaccion)) next.delete(idTransaccion);
      else next.add(idTransaccion);
      return next;
    });
  };

  if (!pendientes.length) return null;

  return (
    <div className="tabla-pendientes">
      <h3 className="tabla-pendientes-titulo">
        <span className="icon">⏳</span>
        Transacciones Pendientes ({pendientes.length})
      </h3>
      <div className="tabla-pendientes-scroll">
        <table className="tabla-pendientes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ID Empaque</th>
              <th>Monto</th>
              <th>{costoLabel}</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map(t => (
              <tr key={t.id_transaccion} className="fila-pendiente">
                <td className="id-cell">{t.id_transaccion}</td>
                <td>
                  {t.id_empaque ? t.id_empaque : (
                    <span className="badge estado-pendiente">Saldo</span>
                  )}
                </td>
                <td className="monto-cell">{formatMoneda(t.monto)}</td>
                <td className="monto-cell">{formatMoneda(t.costo_tienda ?? 0)}</td>
                <td>{t.hora_transaccion ? formatFecha(t.hora_transaccion) : '-'}</td>
                <td><span className="badge tipo-venta">{t.nombre_tipo_transaccion}</span></td>
                <td><span className="badge estado-pendiente">PENDIENTE</span></td>
                <td className={`nota-cell ${expandedNotas.has(t.id_transaccion) ? 'nota-expanded' : ''}`}>
                  <span className="nota-text">{t.nota_opcional}</span>
                  {t.nota_opcional && (
                    <button
                      type="button"
                      className="nota-toggle"
                      onClick={() => toggleNota(t.id_transaccion)}
                    >
                      {expandedNotas.has(t.id_transaccion) ? 'ver menos' : 'ver más'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export type { TablaPendientesProps, TransaccionItem };
export default TablaPendientes;
