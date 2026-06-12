import React from 'react';
import './LibroMayor.css';

interface Transaction {
  id_transaccion: number;
  hora_transaccion: string;
  nombre_tipo_transaccion: string;
  usuario_relacionado: { nombre_completo: string } | null;
  monto: number;
  nota_opcional: string | null;
  nombre_estado_transaccion: string;
  id_empaque?: number | null;
  id_transaccion_rel?: number | null;
}

interface LibroMayorProps {
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getTipoBadgeClass = (tipo: string): string => {
  const lower = tipo.toLowerCase();
  if (lower.includes('recibido') || lower.includes('ingreso')) return 'badge-ingreso';
  if (lower.includes('entregado') || lower.includes('consolidacion') || lower.includes('egreso')) return 'badge-egreso';
  return 'badge-neutral';
};

const getEstadoBadgeClass = (estado: string): string => {
  const lower = estado.toLowerCase();
  if (lower === 'completado' || lower === 'completada') return 'badge-completado';
  if (lower === 'pendiente') return 'badge-pendiente';
  return 'badge-neutral';
};

const LibroMayor: React.FC<LibroMayorProps> = ({ transactions, selectedMonth, selectedYear }) => {
  const formatFecha = (fecha: string): React.ReactNode => {
    const date = new Date(fecha);
    const fechaStr = date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const horaStr = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return (
      <span className="libro-mayor-fecha">
        {fechaStr}
        <span className="libro-mayor-hora">{horaStr}</span>
      </span>
    );
  };
    if (transactions.length === 0) return;

    const headers = ['Fecha', 'Tipo', 'Contraparte', 'Monto', 'Nota', 'Estado'];
    const rows = transactions.map((t) => [
      new Date(t.hora_transaccion).toLocaleString('es-CO'),
      t.nombre_tipo_transaccion,
      t.usuario_relacionado?.nombre_completo || '—',
      t.monto.toString(),
      t.nota_opcional || '—',
      t.nombre_estado_transaccion,
    ]);

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
    if (transactions.length === 0) return;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <tr>
            <th>Fecha</th><th>Tipo</th><th>Contraparte</th><th>Monto</th><th>Nota</th><th>Estado</th>
          </tr>
          ${transactions.map((t) => `
            <tr>
              <td>${new Date(t.hora_transaccion).toLocaleString('es-CO')}</td>
              <td>${t.nombre_tipo_transaccion}</td>
              <td>${t.usuario_relacionado?.nombre_completo || '—'}</td>
              <td>${t.monto}</td>
              <td>${t.nota_opcional || '—'}</td>
              <td>${t.nombre_estado_transaccion}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `libro-mayor-${selectedMonth}-${selectedYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Contraparte</th>
              <th>Monto</th>
              <th>Nota</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const isPositive = t.monto > 0;
              return (
                <tr key={t.id_transaccion}>
                  <td>{formatFecha(t.hora_transaccion)}</td>
                  <td>
                    <span className={`libro-mayor-badge ${getTipoBadgeClass(t.nombre_tipo_transaccion)}`}>
                      {t.nombre_tipo_transaccion.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{t.usuario_relacionado?.nombre_completo || '—'}</td>
                  <td className={isPositive ? 'libro-mayor-monto-positive' : 'libro-mayor-monto-negative'}>
                    {isPositive ? '+' : ''}{formatCurrency(t.monto)}
                  </td>
                  <td>{t.nota_opcional || '—'}</td>
                  <td>
                    <span className={`libro-mayor-badge ${getEstadoBadgeClass(t.nombre_estado_transaccion)}`}>
                      {t.nombre_estado_transaccion}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default LibroMayor;
