import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getResumenFinanciero, registrarMovimientoAdmin, getLogisticaHermanos } from '../../services/api';
import './LogisticaFinanzasPage.css';

interface AdminInfo {
  id_usuario: number;
  nombre_completo: string;
}

interface Resumen {
  total_ingresos: number;
  total_egresos: number;
  balance_neto_periodo: number;
  balance_acumulado_historico: number;
}

interface UsuarioRelacionado {
  id_usuario: number;
  nombre_completo: string;
}

interface Transaccion {
  id_transaccion: number;
  id_empaque: number | null;
  id_transaccion_rel: number | null;
  monto: number;
  hora_transaccion: string;
  nombre_tipo_transaccion: string;
  nombre_estado_transaccion: string;
  nota_opcional: string;
  usuario_relacionado: UsuarioRelacionado;
}

interface ResumenFinancieroData {
  periodo: { mes: number; ano: number };
  admin: AdminInfo;
  resumen: Resumen;
  transacciones: Transaccion[];
}

interface LogisticaItem {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: string;
  empresas?: Array<{
    id_logistica: number;
    nombre_empresa: string;
    placa_vehiculo: string;
  }>;
}

interface LogisticaHermanosData {
  admin: AdminInfo;
  cantidad_logisticas: number;
  logisticas: LogisticaItem[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const numberToWords = (num: number): string => {
  const unidades = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas2 = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num < 10) return unidades[num];
  if (num < 20) return decenas[num - 10];
  if (num < 30) return 'VEINTI' + unidades[num - 20];
  if (num < 100) {
    const decena = Math.floor(num / 10);
    const unidad = num % 10;
    return unidad ? `${decenas2[decena]} Y ${unidades[unidad]}` : decenas2[decena];
  }
  if (num < 1000) {
    const centena = Math.floor(num / 100);
    const resto = num % 100;
    if (num === 100) return 'CIEN';
    return resto ? `${centenas[centena - 1]} ${numberToWords(resto)}` : centenas[centena - 1];
  }
  return num.toString().toUpperCase();
};

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

const LogisticaFinanzasPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isLogistica = user?.role === 'logistica';

  const [data, setData] = useState<ResumenFinancieroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [logisticas, setLogisticas] = useState<LogisticaItem[]>([]);
  const [selectedLogistica, setSelectedLogistica] = useState<LogisticaItem | null>(null);
  const [loadingHermanos, setLoadingHermanos] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'consolidacion' | 'ingreso'>('consolidacion');
  const [montoMovimiento, setMontoMovimiento] = useState<number>(0);
  const [notaMovimiento, setNotaMovimiento] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [procesando, setProcesando] = useState(false);

  const fetchResumen = useCallback(async (month: number, year: number, idLogistica?: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const result = await getResumenFinanciero(month, year, idLogistica);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching financial summary:', err);
      setError(
        err.response?.data?.message ||
        'Error al cargar el resumen financiero. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLogistica) {
      fetchResumen(selectedMonth, selectedYear);
    }
  }, [isLogistica, selectedMonth, selectedYear, fetchResumen]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      setLoadingHermanos(true);
      getLogisticaHermanos()
        .then((response: LogisticaHermanosData) => {
          setLogisticas(response.logisticas || []);
        })
        .catch((err: any) => {
          console.error('Error fetching logisticos:', err);
          setError('Error al cargar la lista de logísticos.');
        })
        .finally(() => {
          setLoadingHermanos(false);
        });
    }
  }, [isAdmin]);

  const handleSelectLogistica = (logistica: LogisticaItem) => {
    setSelectedLogistica(logistica);
    setData(null);
    setError(null);
    setSuccessMessage(null);
    fetchResumen(selectedMonth, selectedYear, logistica.id_usuario);
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthOptions: Array<{ month: number; year: number; label: string }> = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let m = 12; m >= 1; m--) {
      if (y === currentYear && m > currentMonth) continue;
      monthOptions.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}` });
    }
  }

  const openModal = (type: 'consolidacion' | 'ingreso') => {
    setModalType(type);
    setMontoMovimiento(0);
    setNotaMovimiento('');
    setConfirmText('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setConfirmText('');
    setProcesando(false);
  };

  const handleSubmitMovimiento = async () => {
    const monto = Math.floor(montoMovimiento);
    if (!monto || monto <= 0) {
      alert('Debes ingresar un monto válido mayor a cero.');
      return;
    }

    if (modalType === 'consolidacion' && data && monto > data.resumen.balance_acumulado_historico) {
      alert('El monto a consolidar no puede superar el balance acumulado histórico.');
      return;
    }

    const cantidadEnPalabras = numberToWords(monto);
    if (confirmText.trim().toUpperCase() !== cantidadEnPalabras.toUpperCase()) {
      alert(`El texto de confirmación no coincide. Debes escribir: "${cantidadEnPalabras}"`);
      return;
    }

    try {
      setProcesando(true);
      const nota = notaMovimiento.trim() || undefined;
      const idLogistica = selectedLogistica?.id_usuario;

      await registrarMovimientoAdmin(monto, modalType, nota, idLogistica);

      setShowModal(false);
      setSuccessMessage(
        modalType === 'consolidacion'
          ? `Consolidacion de ${formatCurrency(monto)} registrada exitosamente.`
          : `Ingreso de ${formatCurrency(monto)} entregado exitosamente.`
      );

      const targetId = isAdmin && selectedLogistica ? selectedLogistica.id_usuario : undefined;
      fetchResumen(selectedMonth, selectedYear, targetId);
    } catch (err: any) {
      console.error('Error processing movement:', err);
      alert(
        err.response?.data?.message ||
        'Error al procesar el movimiento. Inténtalo de nuevo.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const exportToCSV = () => {
    if (!data?.transacciones || data.transacciones.length === 0) return;

    const headers = ['Fecha', 'Tipo', 'Contraparte', 'Monto', 'Nota', 'Estado'];
    const rows = data.transacciones.map((t) => [
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
    if (!data?.transacciones || data.transacciones.length === 0) return;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <tr>
            <th>Fecha</th><th>Tipo</th><th>Contraparte</th><th>Monto</th><th>Nota</th><th>Estado</th>
          </tr>
          ${data.transacciones.map((t) => `
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

  if (isAdmin && loadingHermanos) {
    return <div className="management-page"><div className="finanzas-loading">Cargando...</div></div>;
  }

  return (
    <div className="management-page finanzas-page">
      <div className="cuentas-header">
        <h1>Finanzas</h1>
        <p>Gestión financiera y libro mayor de movimientos</p>
      </div>

      {successMessage && (
        <div className="finanzas-toast finanzas-toast-success">
          {successMessage}
          <button className="finanzas-toast-close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {/* Admin: selector de logístico */}
      {isAdmin && (
        <section className="finanzas-selector card">
          <div className="card-header">
            <h2>Seleccionar Logístico</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            {logisticas.length === 0 ? (
              <p>No hay usuarios logísticos disponibles.</p>
            ) : (
              <div className="finanzas-logisticas-grid">
                {logisticas.map((logistica) => (
                  <div
                    key={logistica.id_usuario}
                    className={`finanzas-logistica-card ${selectedLogistica?.id_usuario === logistica.id_usuario ? 'selected' : ''}`}
                    onClick={() => handleSelectLogistica(logistica)}
                  >
                    <h4>{logistica.nombre_usuario} {logistica.apellido_usuario}</h4>
                    <p>{logistica.email}</p>
                    <p>{logistica.celular}</p>
                    {logistica.empresas && logistica.empresas.length > 0 && (
                      <p className="finanzas-empresa">
                        {logistica.empresas[0].nombre_empresa} — {logistica.empresas[0].placa_vehiculo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Admin sin logístico seleccionado */}
      {isAdmin && !selectedLogistica && !loadingHermanos && (
        <div className="finanzas-empty-state">
          <p>Selecciona un usuario logístico para ver sus finanzas.</p>
        </div>
      )}

      {/* Loader para data financiera */}
      {loading && (
        <div className="finanzas-loading">
          <div className="finanzas-spinner"></div>
          <p>Cargando resumen financiero...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="finanzas-error">
          <p>{error}</p>
          <button
            className="button button-primary"
            onClick={() => {
              const targetId = isAdmin && selectedLogistica ? selectedLogistica.id_usuario : undefined;
              fetchResumen(selectedMonth, selectedYear, targetId);
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.transacciones.length === 0 && (
        <div className="finanzas-empty-state">
          <p>No hay movimientos registrados en este período.</p>
        </div>
      )}

      {/* Data loaded */}
      {!loading && !error && data && (
        <>
          {/* Selector mes/año */}
          <section className="finanzas-periodo-selector">
            <label>Período:</label>
            <select
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-').map(Number);
                handleMonthYearChange(m, y);
              }}
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          {/* Sección 1 — Resumen (3 tarjetas) */}
          <section className="finanzas-resumen">
            <div className="finanzas-card finanzas-card-ingresos">
              <h3>Ingresos Totales</h3>
              <div className="finanzas-card-value">{formatCurrency(data.resumen.total_ingresos)}</div>
              <p>Período actual</p>
            </div>
            <div className="finanzas-card finanzas-card-egresos">
              <h3>Egresos Totales</h3>
              <div className="finanzas-card-value">{formatCurrency(data.resumen.total_egresos)}</div>
              <p>Período actual</p>
            </div>
            <div className={`finanzas-card finanzas-card-balance ${data.resumen.balance_neto_periodo >= 0 ? 'positive' : 'negative'}`}>
              <h3>Balance Neto</h3>
              <div className="finanzas-card-value">{formatCurrency(data.resumen.balance_neto_periodo)}</div>
              <p>Período actual</p>
            </div>
          </section>

          {/* Sección 2 — Dinero OUT */}
          <section className="finanzas-dinero-out card">
            <div className="card-header">
              <h2>Dinero OUT</h2>
            </div>
            <div className="finanzas-dinero-out-body">
              <div className="finanzas-dinero-info">
                {isAdmin && selectedLogistica ? (
                  <>
                    <p><strong>Logística:</strong> {selectedLogistica.nombre_usuario} {selectedLogistica.apellido_usuario}</p>
                    {data.admin && (
                      <p><strong>Admin:</strong> {data.admin.nombre_completo}</p>
                    )}
                  </>
                ) : (
                  <>
                    {data.admin && (
                      <p><strong>Admin:</strong> {data.admin.nombre_completo}</p>
                    )}
                  </>
                )}
                <p><strong>Balance acumulado:</strong> {formatCurrency(data.resumen.balance_acumulado_historico)}</p>
              </div>

              <div className="finanzas-dinero-form">
                <div className="finanzas-form-group">
                  <label>Monto</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={montoMovimiento || ''}
                    onChange={(e) => setMontoMovimiento(Number(e.target.value))}
                  />
                </div>
                <div className="finanzas-form-group">
                  <label>Nota (opcional)</label>
                  <input
                    type="text"
                    placeholder="Nota opcional"
                    value={notaMovimiento}
                    onChange={(e) => setNotaMovimiento(e.target.value)}
                  />
                </div>
                {isAdmin && selectedLogistica ? (
                  <button
                    className="button button-primary"
                    onClick={() => openModal('ingreso')}
                  >
                    Entregar Dinero
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    onClick={() => openModal('consolidacion')}
                  >
                    Consolidar con Admin
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Sección 3 — Libro Mayor */}
          <section className="finanzas-libro-mayor card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Libro Mayor</h2>
              <div className="finanzas-export-buttons">
                <button className="button button-secondary" onClick={exportToCSV}>
                  Exportar CSV
                </button>
                <button className="button button-secondary" onClick={exportToExcel}>
                  Exportar Excel
                </button>
              </div>
            </div>
            <div className="finanzas-table-container">
              <table className="finanzas-table">
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
                  {data.transacciones.map((t) => {
                    const isPositive = t.monto > 0;
                    return (
                      <tr key={t.id_transaccion}>
                        <td>{new Date(t.hora_transaccion).toLocaleString('es-CO', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}</td>
                        <td>
                          <span className={`finanzas-badge ${getTipoBadgeClass(t.nombre_tipo_transaccion)}`}>
                            {t.nombre_tipo_transaccion.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{t.usuario_relacionado?.nombre_completo || '—'}</td>
                        <td className={isPositive ? 'finanzas-monto-positive' : 'finanzas-monto-negative'}>
                          {isPositive ? '+' : ''}{formatCurrency(t.monto)}
                        </td>
                        <td>{t.nota_opcional || '—'}</td>
                        <td>
                          <span className={`finanzas-badge ${getEstadoBadgeClass(t.nombre_estado_transaccion)}`}>
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
        </>
      )}

      {/* Modal de confirmación */}
      {showModal && (
        <div className="finanzas-modal-overlay" onClick={closeModal}>
          <div className="finanzas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="finanzas-modal-header">
              <h3>
                {modalType === 'consolidacion' ? 'Confirmar Consolidación' : 'Confirmar Entrega'}
              </h3>
              <button className="finanzas-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="finanzas-modal-body">
              <p className="finanzas-modal-warning">
                {modalType === 'consolidacion'
                  ? `Vas a consolidar ${formatCurrency(Math.floor(montoMovimiento) || 0)} con ${data?.admin?.nombre_completo || 'Admin'}`
                  : `Vas a entregar ${formatCurrency(Math.floor(montoMovimiento) || 0)} a ${selectedLogistica?.nombre_usuario || ''} ${selectedLogistica?.apellido_usuario || ''}`
                }
              </p>

              <div className="finanzas-form-group">
                <label>
                  Escribe el monto en letras para confirmar:
                  <span className="finanzas-modal-hint">
                    {montoMovimiento > 0
                      ? `"${numberToWords(Math.floor(montoMovimiento))}"`
                      : '(ingresa un monto primero)'}
                  </span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Ej: CINCO MIL"
                  autoFocus
                />
              </div>

              <div className="finanzas-modal-actions">
                <button className="button button-secondary" onClick={closeModal} disabled={procesando}>
                  Cancelar
                </button>
                <button
                  className="button button-primary"
                  onClick={handleSubmitMovimiento}
                  disabled={procesando || montoMovimiento <= 0}
                >
                  {procesando ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticaFinanzasPage;
