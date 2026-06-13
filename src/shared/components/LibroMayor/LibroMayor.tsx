import React, { useState } from 'react';
import './LibroMayor.css';

interface InfoPago {
  id_usuario_pago: number;
  nombre_usuario_pago: string;
  nota_opcional_pago: string;
}

interface ConsolidadoPosteriorRef {
  id_transaccion: number;
  fecha_consolidacion: string;
  nota_opcional: string;
}

interface Transaction {
  id_transaccion: number;
  id_empaque: number | null;
  id_transaccion_rel: number | null;
  monto: number;
  hora_transaccion: string;
  nombre_tipo_transaccion: string;
  nombre_estado_transaccion: string;
  nota_opcional: string | null;
  info_pago?: InfoPago;
  consolidado_posterior?: ConsolidadoPosteriorRef;
  costo_tienda?: number | null;
}

interface LibroMayorProps {
  transactions: Transaction[];
  consolidadosPosteriores?: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  variant?: 'proveedor' | 'cliente';
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MONTH_NAMES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatFecha = (fecha: string): React.ReactNode => {
  const date = new Date(fecha);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const horaStr = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return (
    <span className="libro-mayor-fecha">
      <span>{day} {month} {year}</span>
      <span className="libro-mayor-hora">{horaStr}</span>
    </span>
  );
};

const formatFechaCorta = (fecha: string): string => {
  const date = new Date(fecha);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_CAP[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

function groupIntoBlocks(transactions: Transaction[]): Transaction[][] {
  if (transactions.length === 0) return [];

  const idMap = new Map<number, Transaction>();
  transactions.forEach(t => idMap.set(t.id_transaccion, t));

  const adj = new Map<number, Set<number>>();
  for (const t of transactions) {
    if (!adj.has(t.id_transaccion)) adj.set(t.id_transaccion, new Set());
    if (t.id_transaccion_rel != null && idMap.has(t.id_transaccion_rel)) {
      adj.get(t.id_transaccion)!.add(t.id_transaccion_rel);
      if (!adj.has(t.id_transaccion_rel)) adj.set(t.id_transaccion_rel, new Set());
      adj.get(t.id_transaccion_rel)!.add(t.id_transaccion);
    }
  }

  const byRel = new Map<number, number[]>();
  for (const t of transactions) {
    if (t.id_transaccion_rel != null) {
      if (!byRel.has(t.id_transaccion_rel)) byRel.set(t.id_transaccion_rel, []);
      byRel.get(t.id_transaccion_rel)!.push(t.id_transaccion);
    }
  }
  for (const [, ids] of byRel) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (!adj.has(ids[i])) adj.set(ids[i], new Set());
        if (!adj.has(ids[j])) adj.set(ids[j], new Set());
        adj.get(ids[i])!.add(ids[j]);
        adj.get(ids[j])!.add(ids[i]);
      }
    }
  }

  const visited = new Set<number>();
  const blocks: Transaction[][] = [];

  for (const t of transactions) {
    if (visited.has(t.id_transaccion)) continue;

    const blockIds: number[] = [];
    const stack = [t.id_transaccion];

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      blockIds.push(id);
      for (const neighbor of adj.get(id) || []) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }

    if (blockIds.length > 0) {
      blocks.push(blockIds.map(id => idMap.get(id)!));
    }
  }

  blocks.sort((a, b) => {
    const maxA = Math.max(...a.map(tx => new Date(tx.hora_transaccion).getTime()));
    const maxB = Math.max(...b.map(tx => new Date(tx.hora_transaccion).getTime()));
    return maxB - maxA;
  });

  blocks.forEach(block => {
    block.sort((a, b) => new Date(a.hora_transaccion).getTime() - new Date(b.hora_transaccion).getTime());
  });

  return blocks;
}

const NotaCell: React.FC<{ nota: string | null }> = ({ nota }) => {
  const [expanded, setExpanded] = useState(false);
  const text = nota || '—';

  if (text.length <= 60) {
    return <span className="libro-mayor-nota">{text}</span>;
  }

  return (
    <span className="libro-mayor-nota">
      {expanded ? text : text.slice(0, 60) + '...'}
      <button
        className="libro-mayor-vermas"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Ver menos' : 'Ver más'}
      </button>
    </span>
  );
};

const ContraparteCell: React.FC<{ info_pago?: InfoPago }> = ({ info_pago }) => {
  if (!info_pago) return <span>—</span>;

  return (
    <span className="libro-mayor-contraparte" title={info_pago.nota_opcional_pago || ''}>
      {info_pago.nombre_usuario_pago}
      {info_pago.nota_opcional_pago && (
        <span className="libro-mayor-tooltip-icon" title={info_pago.nota_opcional_pago}> ⓘ</span>
      )}
    </span>
  );
};

const LibroMayor: React.FC<LibroMayorProps> = ({
  transactions,
  consolidadosPosteriores = [],
  selectedMonth,
  selectedYear,
  variant = 'proveedor',
}) => {
  const isCliente = variant === 'cliente';

  const isIngreso = (monto: number) => isCliente ? monto < 0 : monto > 0;
  const isEgreso = (monto: number) => isCliente ? monto > 0 : monto < 0;

  const pendientes = transactions
    .filter(t => t.nombre_estado_transaccion.toUpperCase() === 'PENDIENTE')
    .sort((a, b) => new Date(a.hora_transaccion).getTime() - new Date(b.hora_transaccion).getTime());
  const consolidadas = transactions.filter(
    t => t.nombre_estado_transaccion.toUpperCase() !== 'PENDIENTE'
  );
  const blocks = groupIntoBlocks(consolidadas);

  const hasPendientes = pendientes.length > 0;
  const hasPosteriores = consolidadosPosteriores.length > 0;

  let blockIdx = 0;
  let rowNumber = 0;

  const getPosteriorLabel = (blk: number) => {
    const consolidations = Array.from(
      new Map(
        consolidadosPosteriores
          .filter(t => t.consolidado_posterior)
          .map(t => [
            t.consolidado_posterior!.id_transaccion,
            { id: t.consolidado_posterior!.id_transaccion, fecha: t.consolidado_posterior!.fecha_consolidacion, nota: t.consolidado_posterior!.nota_opcional },
          ])
      ).values()
    );

    if (consolidations.length === 0) {
      return `Bloque ${blk} — Consolidados en períodos posteriores (${consolidadosPosteriores.length} transacción${consolidadosPosteriores.length !== 1 ? 'es' : ''})`;
    }
    const parts = consolidations.map(c => {
      const d = new Date(c.fecha);
      const mes = MONTH_NAMES_CAP[d.getMonth()];
      const anio = d.getFullYear();
      return `${d.getDate()} ${mes} ${anio} (ID: ${c.id})`;
    });
    return `Bloque ${blk} — Consolidado${consolidations.length > 1 ? 's' : ''}: ${parts.join(' | ')}`;
  };

  const exportToCSV = () => {
    const allTransactions = [...pendientes, ...consolidadosPosteriores, ...consolidadas];
    if (allTransactions.length === 0) return;

    const headers = ['#', 'Fecha', 'Contraparte', 'Ingreso', 'Egreso', 'Saldo', 'Nota', 'ID', 'Estado'];
    const rows: string[][] = [];
    let num = 0;

    allTransactions.forEach((t) => {
      num++;
      rows.push([
        String(num),
        new Date(t.hora_transaccion).toLocaleString('es-CO'),
        t.info_pago?.nombre_usuario_pago || '—',
        t.monto > 0 ? t.monto.toString() : '',
        t.monto < 0 ? Math.abs(t.monto).toString() : '',
        '',
        t.nota_opcional || '—',
        String(t.id_transaccion),
        t.nombre_estado_transaccion,
      ]);
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `libro-mayor-${selectedMonth}-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const allTransactions = [...pendientes, ...consolidadosPosteriores, ...consolidadas];
    if (allTransactions.length === 0) return;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <tr>
            <th>#</th><th>Fecha</th><th>Contraparte</th><th>Ingreso</th><th>Egreso</th><th>Saldo</th><th>Nota</th><th>ID</th><th>Estado</th>
          </tr>`;
    let num = 0;

    allTransactions.forEach((t) => {
      num++;
      html += `
            <tr>
              <td>${num}</td>
              <td>${new Date(t.hora_transaccion).toLocaleString('es-CO')}</td>
              <td>${t.info_pago?.nombre_usuario_pago || '—'}</td>
              <td>${t.monto > 0 ? t.monto : ''}</td>
              <td>${t.monto < 0 ? Math.abs(t.monto) : ''}</td>
              <td></td>
              <td>${t.nota_opcional || '—'}</td>
              <td>${t.id_transaccion}</td>
              <td>${t.nombre_estado_transaccion}</td>
            </tr>`;
    });

    html += `
        </table>
      </body>
      </html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `libro-mayor-${selectedMonth}-${selectedYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatSaldo = (value: number) => (
    <span className={`col-saldo ${value >= 0 ? 'saldo-positive' : 'saldo-negative'}`}>
      {formatCurrency(value)}
    </span>
  );

  const renderTransactionRow = (
    t: Transaction,
    rowClass: string,
    saldoValue: number,
    showSaldo: boolean,
    idColumn: React.ReactNode
  ) => {
    rowNumber++;
    const ing = isIngreso(t.monto);
    const egr = isEgreso(t.monto);

    return (
      <tr key={t.id_transaccion || `row-${rowNumber}`} className={rowClass}>
        <td className="col-num">{rowNumber}</td>
        <td className="col-fecha">{formatFecha(t.hora_transaccion)}</td>
        <td className="col-contraparte">
          {t.nombre_tipo_transaccion === 'venta' && t.costo_tienda != null ? (
            <span className="libro-mayor-contraparte">
              Venta {formatCurrency(t.monto + t.costo_tienda)} — {formatCurrency(t.costo_tienda)}
            </span>
          ) : (
            <ContraparteCell info_pago={t.info_pago} />
          )}
        </td>
        <td className="col-monto col-ingreso">
          {ing ? formatCurrency(t.monto) : ''}
        </td>
        <td className="col-monto col-egreso">
          {egr ? formatCurrency(Math.abs(t.monto)) : ''}
        </td>
        <td className="col-monto">
          {showSaldo ? formatSaldo(saldoValue) : <span className="col-saldo">—</span>}
        </td>
        <td className="col-nota">
          <NotaCell nota={t.nota_opcional} />
        </td>
        <td className="col-id">{idColumn}</td>
        <td className="col-estado">
          <span className={`libro-mayor-badge ${t.nombre_estado_transaccion.toUpperCase() === 'PENDIENTE' ? 'badge-pendiente' : 'badge-completado'}`}>
            {t.nombre_estado_transaccion}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <section className="libro-mayor card">
      <div className="libro-mayor-header">
        <h2>Libro Mayor</h2>
        <div className="libro-mayor-export-buttons">
          <button className="button button-secondary" onClick={exportToCSV}>
            Exportar CSV
          </button>
          <button className="button button-secondary" onClick={exportToExcel}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="libro-mayor-table-container">
        <table className="libro-mayor-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-fecha">Fecha</th>
              <th className="col-contraparte">Contraparte</th>
              <th className="col-monto">Ingreso</th>
              <th className="col-monto">Egreso</th>
              <th className="col-monto">Saldo</th>
              <th className="col-nota">Nota</th>
              <th className="col-id">ID</th>
              <th className="col-estado">Estado</th>
            </tr>
          </thead>
          <tbody>
            {hasPendientes && (() => {
              blockIdx++;
              let saldo = 0;
              return (
                <React.Fragment>
                  {pendientes.map((t) => {
                    saldo += t.monto;
                    return renderTransactionRow(t, 'block-pending', saldo, true, t.id_transaccion);
                  })}

                  <tr className="block-summary-row block-summary-pending">
                    <td colSpan={4} className="block-summary-label">
                      Bloque {blockIdx} — Pendientes — Suma: {formatCurrency(saldo)}
                    </td>
                    <td className="block-summary-rule">
                      <span className="zero-rule zero-rule-pending" title="Bloque pendiente de consolidación">⏳</span>
                      <span className="zero-rule-text">Pendiente</span>
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </React.Fragment>
              );
            })()}

            {hasPosteriores && (() => {
              blockIdx++;
              return (
                <React.Fragment>
                  {consolidadosPosteriores.map((t) =>
                    renderTransactionRow(t, 'block-posterior', 0, false, t.id_transaccion)
                  )}

                  <tr className="block-summary-row block-summary-posterior">
                    <td colSpan={9} className="block-summary-label block-summary-centered">
                      {getPosteriorLabel(blockIdx)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })()}

            {blocks.map((block) => {
              let saldo = 0;
              blockIdx++;

              return (
                <React.Fragment key={`block-${blockIdx}`}>
                  {block.map((t) => {
                    saldo += t.monto;
                    const rowClass = `block-consolidado ${t.nombre_tipo_transaccion === 'ticket_consolidado' ? 'row-ticket-consolidado' : ''}`;
                    return renderTransactionRow(t, rowClass, saldo, true, t.id_transaccion);
                  })}

                  <tr className="block-summary-row">
                    <td colSpan={4} className="block-summary-label">
                      Bloque {blockIdx} — Suma: {formatCurrency(saldo)}
                    </td>
                    <td className="block-summary-rule">
                      {saldo === 0 ? (
                        <>
                          <span className="zero-rule zero-rule-ok" title="El bloque cumple la regla de suma cero">✓</span>
                          <span className="zero-rule-text zero-rule-text-ok">Suma cero</span>
                        </>
                      ) : (
                        <>
                          <span className="zero-rule zero-rule-fail" title={`El bloque no cumple la regla de suma cero (diferencia: ${formatCurrency(Math.abs(saldo))})`}>✗</span>
                          <span className="zero-rule-text zero-rule-text-fail">No cumple</span>
                        </>
                      )}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </React.Fragment>
              );
            })}

            {!hasPendientes && !hasPosteriores && blocks.length === 0 && (
              <tr>
                <td colSpan={9} className="libro-mayor-empty">
                  No hay movimientos registrados en este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default LibroMayor;
