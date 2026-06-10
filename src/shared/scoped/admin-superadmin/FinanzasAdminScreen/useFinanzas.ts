import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getResumenFinanciero, registrarMovimientoAdmin, getLogisticaHermanos } from '../../../../services/api';
import { numberToWords } from '../../../../shared/utils/numberToWords';

export interface AdminInfo {
  id_usuario: number;
  nombre_completo: string;
}

export interface Resumen {
  total_ingresos: number;
  total_egresos: number;
  balance_neto_periodo: number;
  balance_acumulado_historico: number;
}

export interface UsuarioRelacionado {
  id_usuario: number;
  nombre_completo: string;
}

export interface Transaccion {
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

export interface ResumenFinancieroData {
  periodo: { mes: number; ano: number };
  admin: AdminInfo;
  resumen: Resumen;
  transacciones: Transaccion[];
}

export interface LogisticaItem {
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

export interface LogisticaHermanosData {
  admin: AdminInfo;
  cantidad_logisticas: number;
  logisticas: LogisticaItem[];
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export { numberToWords };

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getTipoBadgeClass = (tipo: string): string => {
  const lower = tipo.toLowerCase();
  if (lower.includes('recibido') || lower.includes('ingreso')) return 'badge-ingreso';
  if (lower.includes('entregado') || lower.includes('consolidacion') || lower.includes('egreso')) return 'badge-egreso';
  return 'badge-neutral';
};

export const getEstadoBadgeClass = (estado: string): string => {
  const lower = estado.toLowerCase();
  if (lower === 'completado' || lower === 'completada') return 'badge-completado';
  if (lower === 'pendiente') return 'badge-pendiente';
  return 'badge-neutral';
};

export interface UseFinanzasOptions {
  mode: 'self' | 'admin';
}

export const useFinanzas = ({ mode }: UseFinanzasOptions) => {
  const { user: _user } = useAuth();
  const isAdmin = mode === 'admin';
  const isLogistica = mode === 'self';

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

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthOptions: Array<{ month: number; year: number; label: string }> = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let m = 12; m >= 1; m--) {
      if (y === currentYear && m > currentMonth) continue;
      monthOptions.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}` });
    }
  }

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
    if (isAdmin && selectedLogistica) {
      fetchResumen(month, year, selectedLogistica.id_usuario);
    }
  };

  const retryFetch = () => {
    const targetId = isAdmin && selectedLogistica ? selectedLogistica.id_usuario : undefined;
    fetchResumen(selectedMonth, selectedYear, targetId);
  };

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

  return {
    data,
    loading,
    error,
    successMessage,
    setSuccessMessage,
    selectedMonth,
    selectedYear,
    isAdmin,
    isLogistica,
    logisticas,
    selectedLogistica,
    loadingHermanos,
    showModal,
    modalType,
    montoMovimiento,
    setMontoMovimiento,
    notaMovimiento,
    setNotaMovimiento,
    confirmText,
    setConfirmText,
    procesando,
    monthOptions,
    fetchResumen,
    handleSelectLogistica,
    handleMonthYearChange,
    retryFetch,
    openModal,
    closeModal,
    handleSubmitMovimiento,
    exportToCSV,
    exportToExcel,
  };
};
