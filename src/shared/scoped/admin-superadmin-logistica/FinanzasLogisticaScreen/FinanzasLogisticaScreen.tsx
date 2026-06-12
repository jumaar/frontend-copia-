import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getResumenFinanciero, registrarMovimientoAdmin, getLogisticaHermanos } from '../../../../services/api';
import ProveedorSelector from '../../../components/ProveedorSelector/ProveedorSelector';
import TransaccionesHeader from '../../../components/TransaccionesHeader/TransaccionesHeader';
import GestionCobro from '../components/GestionCobro/GestionCobro';
import ConfirmacionTransaccionModal from '../components/ConfirmacionTransaccionModal/ConfirmacionTransaccionModal';
import Alert from '../../../components/Alert/Alert';
import SummaryCard from '../../../components/SummaryCard/SummaryCard';
import LibroMayor from '../../../components/LibroMayor/LibroMayor';

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
  esPeriodoActual: boolean;
  fechaCreacionUsuario?: string;
}

interface FinanzasApiResponse {
  admin?: {
    id_usuario: number;
    nombre_usuario: string;
    apellido_usuario: string;
  };
  transacciones: Transaccion[];
  fecha_creacion_usuario?: string;
  nombre_usuario?: string;
  apellido_usuario?: string;
  periodo: { mes: number; ano: number };
  fecha_inicio_periodo?: string;
  fecha_fin_periodo?: string;
  total_transacciones?: number;
  parametros_usados?: {
    mes_pedido: number;
    ano_pedido: number;
    mes_devuelto: number;
    ano_devuelto: number;
    es_periodo_actual: boolean;
  };
}

const normalizeFinanzasResponse = (apiResponse: FinanzasApiResponse): ResumenFinancieroData => {
  const transacciones = apiResponse.transacciones || [];
  const totalIngresos = transacciones
    .filter(t => t.monto > 0)
    .reduce((sum, t) => sum + t.monto, 0);
  const totalEgresos = transacciones
    .filter(t => t.monto < 0)
    .reduce((sum, t) => sum + Math.abs(t.monto), 0);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return {
    periodo: apiResponse.periodo,
    admin: apiResponse.admin
      ? {
          id_usuario: apiResponse.admin.id_usuario,
          nombre_completo: `${apiResponse.admin.nombre_usuario} ${apiResponse.admin.apellido_usuario}`,
        }
      : {
          id_usuario: 0,
          nombre_completo: 'Administrador',
        },
    resumen: {
      total_ingresos: totalIngresos,
      total_egresos: -totalEgresos,
      balance_neto_periodo: totalIngresos - totalEgresos,
      balance_acumulado_historico: 0,
    },
    transacciones,
    esPeriodoActual: apiResponse.parametros_usados?.es_periodo_actual
      ?? (apiResponse.periodo.mes === currentMonth && apiResponse.periodo.ano === currentYear),
    fechaCreacionUsuario: apiResponse.fecha_creacion_usuario,
  };
};

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

interface AdminWithLogisticas {
  admin: {
    id_usuario: number;
    nombre_usuario: string;
    apellido_usuario: string;
    email: string;
    celular: string;
  };
  logisticas: LogisticaItem[];
}

interface SuperAdminResponse {
  admins: AdminWithLogisticas[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const FinanzasLogisticaScreen: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isLogistica = user?.role === 'logistica';
  const needsSelector = isAdmin || isSuperAdmin;

  const [data, setData] = useState<ResumenFinancieroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; año: number } | null>(null);

  const [admins, setAdmins] = useState<AdminWithLogisticas[]>([]);
  const [adminSeleccionado, setAdminSeleccionado] = useState<number | null>(null);
  const [logisticas, setLogisticas] = useState<LogisticaItem[]>([]);
  const [selectedLogistica, setSelectedLogistica] = useState<LogisticaItem | null>(null);
  const [loadingHermanos, setLoadingHermanos] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showModalConsolidar, setShowModalConsolidar] = useState(false);
  const [codigo, setCodigo] = useState<string>('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  const [tipoPago, setTipoPago] = useState<'pago' | 'abono' | ''>('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [notaPago, setNotaPago] = useState<string>('');
  const [consolidandoCero, setConsolidandoCero] = useState(false);

  const fetchResumen = useCallback(async (month: number, year: number, idLogistica?: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getResumenFinanciero(month, year, idLogistica);
      setData(normalizeFinanzasResponse(result));
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
    if (needsSelector) {
      setLoading(false);
      setLoadingHermanos(true);
      setError(null);
      getLogisticaHermanos()
        .then((response: any) => {
          if (isSuperAdmin && response.admins) {
            const adminsData = (response as SuperAdminResponse).admins || [];
            setAdmins(adminsData);
          } else {
            setLogisticas(response.logisticas || []);
          }
        })
        .catch((err: any) => {
          console.error('Error fetching logisticos:', err);
          setError('Error al cargar la lista de logísticos.');
        })
        .finally(() => {
          setLoadingHermanos(false);
        });
    }
  }, [needsSelector, isSuperAdmin]);

  const handleSelectAdmin = (id: string | number) => {
    const numId = Number(id);
    setAdminSeleccionado(numId);
    const adminData = admins.find(a => a.admin.id_usuario === numId);
    setLogisticas(adminData?.logisticas || []);
    setSelectedLogistica(null);
    setData(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelectLogistica = (id: string | number) => {
    const numId = Number(id);
    const logistica = logisticas.find(l => l.id_usuario === numId) || null;
    setSelectedLogistica(logistica);
    setData(null);
    setError(null);
    setSuccessMessage(null);
    setMesSeleccionado(null);
    if (logistica) {
      fetchResumen(selectedMonth, selectedYear, logistica.id_usuario);
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    const isCurrent = month === currentMonth && year === currentYear;
    setMesSeleccionado(isCurrent ? null : { mes: month, año: year });
    const targetId = needsSelector && selectedLogistica ? selectedLogistica.id_usuario : undefined;
    fetchResumen(month, year, targetId);
  };

  const monthOptions: Array<{ month: number; year: number; label: string }> = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let m = 12; m >= 1; m--) {
      if (y === currentYear && m > currentMonth) continue;
      monthOptions.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}` });
    }
  }

  const handleProcesarPago = () => {
    if (tipoPago === 'abono' && (!montoPago || montoPago <= 0)) return;
    setCodigo('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowModalConsolidar(false);
    setCodigo('');
    setProcesandoPago(false);
    setConsolidandoCero(false);
  };

  const handleConfirmar = async () => {
    const monto = tipoPago === 'pago'
      ? Math.abs(data?.resumen.balance_neto_periodo || 0)
      : Math.floor(montoPago);

    if (!monto || monto <= 0) {
      alert('El monto debe ser mayor a cero.');
      return;
    }

    if (!codigo.trim()) {
      alert('Debes ingresar el código de verificación.');
      return;
    }

    try {
      setProcesandoPago(true);
      const nota = notaPago.trim() || undefined;
      const idLogistica = selectedLogistica?.id_usuario;

      const tipoMov = tipoPago === 'abono' && data?.resumen.balance_neto_periodo < 0
        ? 'egreso'
        : 'consolidacion';
      const result = await registrarMovimientoAdmin(monto, tipoMov, nota, idLogistica);

      setShowModal(false);
      setTipoPago('');
      setMontoPago(0);
      setNotaPago('');
      setSuccessMessage(`${result?.mensaje || 'Movimiento registrado exitosamente'} — ${formatCurrency(monto)}`);

      const targetId = needsSelector && selectedLogistica ? selectedLogistica.id_usuario : undefined;
      fetchResumen(selectedMonth, selectedYear, targetId);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
        'Error al procesar el movimiento. Inténtalo de nuevo.'
      );
    } finally {
      setProcesandoPago(false);
    }
  };

  const handleConsolidarCero = () => {
    setCodigo('');
    setShowModalConsolidar(true);
  };

  const handleConfirmarConsolidarCero = async () => {
    if (!codigo.trim()) {
      alert('Debes ingresar el código de verificación.');
      return;
    }

    try {
      setConsolidandoCero(true);
      setError(null);
      const idLogistica = selectedLogistica?.id_usuario;
      const result = await registrarMovimientoAdmin(0, 'consolidacion', 'Consolidación con valor $0', idLogistica);
      setShowModalConsolidar(false);
      setCodigo('');
      setSuccessMessage(result?.mensaje || 'Transacciones pendientes consolidadas con valor $0.');

      const targetId = needsSelector && selectedLogistica ? selectedLogistica.id_usuario : undefined;
      fetchResumen(selectedMonth, selectedYear, targetId);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
        'Error al consolidar. Inténtalo de nuevo.'
      );
    } finally {
      setConsolidandoCero(false);
    }
  };

  if (needsSelector && loadingHermanos) {
    return (
      <div className="management-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(var(--spacing-unit) * 8)', color: 'var(--color-text-secondary)' }}>
          {isSuperAdmin ? 'Cargando administradores...' : 'Cargando...'}
        </div>
      </div>
    );
  }

  return (
    <div className="management-page" style={{ gap: 'calc(var(--spacing-unit) * 3)' }}>
      {successMessage && (
        <Alert message={successMessage} onDismiss={() => setSuccessMessage(null)} type="success" />
      )}

      {needsSelector && isSuperAdmin && (
        <>
          <ProveedorSelector
            title="1. SELECCIONAR ADMINISTRADOR:"
            options={admins.map(a => ({
              id: a.admin.id_usuario,
              label: `${a.admin.nombre_usuario} ${a.admin.apellido_usuario || ''}`,
            }))}
            selectedId={adminSeleccionado}
            onSelect={handleSelectAdmin}
            placeholder="Selecciona un administrador..."
            disabled={loadingHermanos}
            renderLabel={(option) => {
              const adminData = admins.find(a => a.admin.id_usuario === option.id);
              return (
                <span className="dropdown-item-label">
                  👤 {option.label}
                  {adminData?.admin.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({adminData.admin.email})</span>}
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '0.85rem' }}>
                    | {adminData?.logisticas.length || 0} logística{adminData?.logisticas.length !== 1 ? 's' : ''}
                  </span>
                </span>
              );
            }}
          />

          {adminSeleccionado && (
            <ProveedorSelector
              title="2. SELECCIONAR LOGÍSTICO:"
              options={logisticas.map(l => ({
                id: l.id_usuario,
                label: `${l.nombre_usuario} ${l.apellido_usuario}`,
              }))}
              selectedId={selectedLogistica?.id_usuario ?? null}
              onSelect={handleSelectLogistica}
              placeholder="Selecciona un logístico..."
              disabled={logisticas.length === 0}
              loading={loading}
              actionLabel="Seleccionar"
              renderLabel={(option, _isSelected) => {
                const logistica = logisticas.find(l => l.id_usuario === option.id);
                return (
                  <span className="dropdown-item-label">
                    🚛 {option.label}
                    {logistica?.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({logistica.email})</span>}
                  </span>
                );
              }}
            />
          )}
        </>
      )}

      {needsSelector && isAdmin && (
        <section className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h2>Seleccionar Logístico</h2>
          </div>
          <ProveedorSelector
            title="SELECCIONAR LOGÍSTICO:"
            options={logisticas.map(l => ({
              id: l.id_usuario,
              label: `${l.nombre_usuario} ${l.apellido_usuario}`,
            }))}
            selectedId={selectedLogistica?.id_usuario ?? null}
            onSelect={handleSelectLogistica}
            placeholder="Selecciona un logístico..."
            disabled={loadingHermanos || logisticas.length === 0}
            loading={loading}
            actionLabel="Seleccionar"
            renderLabel={(option, _isSelected) => {
              const logistica = logisticas.find(l => l.id_usuario === option.id);
              return (
                <span className="dropdown-item-label">
                  🚛 {option.label}
                  {logistica?.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({logistica.email})</span>}
                  {logistica?.empresas && logistica.empresas.length > 0 && (
                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '0.8rem' }}>
                      | {logistica.empresas[0].nombre_empresa}
                    </span>
                  )}
                </span>
              );
            }}
          />
        </section>
      )}

      {needsSelector && !selectedLogistica && !loadingHermanos && (
        <div style={{ textAlign: 'center', padding: 'calc(var(--spacing-unit) * 6)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          <p>
            {isSuperAdmin && !adminSeleccionado
              ? 'Selecciona un administrador para ver sus logísticos.'
              : 'Selecciona un usuario logístico para ver sus finanzas.'}
          </p>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(var(--spacing-unit) * 8)', color: 'var(--color-text-secondary)' }}>
          <div className="spinner"></div>
          <p>Cargando resumen financiero...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', padding: 'calc(var(--spacing-unit) * 6)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)' }}>
          <p style={{ color: 'var(--color-danger, #e53e3e)', marginBottom: 'calc(var(--spacing-unit) * 3)' }}>{error}</p>
          <button
            className="button button-primary"
            onClick={() => {
              const targetId = needsSelector && selectedLogistica ? selectedLogistica.id_usuario : undefined;
              fetchResumen(selectedMonth, selectedYear, targetId);
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && data && data.transacciones.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'calc(var(--spacing-unit) * 6)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          <p>No hay movimientos registrados en este período.</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <TransaccionesHeader
            title={
              isLogistica
                ? user?.name || ''
                : selectedLogistica
                  ? `${selectedLogistica.nombre_usuario} ${selectedLogistica.apellido_usuario}`
                  : 'Finanzas'
            }
            periodo={data.periodo}
            esPeriodoActual={data.esPeriodoActual}
            fechaCreacion={
              data.fechaCreacionUsuario
                ? new Date(data.fechaCreacionUsuario).toLocaleDateString('es-CO', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : undefined
            }
            mesesHistoricos={monthOptions.map(opt => ({
              mes: opt.month,
              año: opt.year,
              fecha: opt.label,
            }))}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={handleMonthYearChange}
            loading={loading}
          />

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'calc(var(--spacing-unit) * 2)' }}>
            <SummaryCard
              title="Ingresos Totales $"
              value={formatNumber(data.resumen.total_ingresos)}
              description="Período actual"
              variant="success"
            />
            <SummaryCard
              title="Egresos Totales $"
              value={formatNumber(data.resumen.total_egresos)}
              description="Período actual"
              variant="danger"
            />
            <SummaryCard
              title="Balance Neto $"
              value={formatNumber(data.resumen.balance_neto_periodo)}
              description="Período actual"
              variant={data.resumen.balance_neto_periodo >= 0 ? 'success' : 'danger'}
            />
          </section>

          {!isSuperAdmin && data.esPeriodoActual && (!isAdmin || selectedLogistica) && (
            <GestionCobro
              mode="entregar"
              tipoPago={tipoPago}
              setTipoPago={setTipoPago}
              montoPago={montoPago}
              setMontoPago={setMontoPago}
              notaPago={notaPago}
              setNotaPago={setNotaPago}
              procesandoPago={procesandoPago}
              onProcesarPago={handleProcesarPago}
              userName={isAdmin && selectedLogistica
                ? `${selectedLogistica.nombre_usuario} ${selectedLogistica.apellido_usuario}`
                : data.admin.nombre_completo}
              saldoTotalLiquidar={data.resumen.balance_neto_periodo}
              pendientesCount={
                data.transacciones.filter(
                  (t) => t.nombre_estado_transaccion.toUpperCase() === 'PENDIENTE'
                ).length
              }
              onConsolidarCero={handleConsolidarCero}
              consolidandoCero={consolidandoCero}
            />
          )}

          <LibroMayor
            transactions={data.transacciones}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </>
      )}

      <ConfirmacionTransaccionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmar}
        processing={procesandoPago}
        title={tipoPago === 'pago' ? 'Confirmar Entrega Total' : 'Confirmar Abono'}
        origen={
          needsSelector && selectedLogistica
            ? `${selectedLogistica.nombre_usuario} ${selectedLogistica.apellido_usuario}`
            : user?.name || ''
        }
        destino={data?.admin?.nombre_completo || 'Administrador'}
        monto={
          tipoPago === 'pago'
            ? Math.abs(data?.resumen.balance_neto_periodo || 0)
            : Math.floor(montoPago)
        }
        codigo={codigo}
        setCodigo={setCodigo}
        disabled={tipoPago === 'pago' ? !(data?.resumen.balance_neto_periodo) : montoPago <= 0}
      />

      <ConfirmacionTransaccionModal
        isOpen={showModalConsolidar}
        onClose={handleCloseModal}
        onConfirm={handleConfirmarConsolidarCero}
        processing={consolidandoCero}
        title="Confirmar Consolidación Cero"
        origen={
          needsSelector && selectedLogistica
            ? `${selectedLogistica.nombre_usuario} ${selectedLogistica.apellido_usuario}`
            : user?.name || ''
        }
        destino={data?.admin?.nombre_completo || 'Administrador'}
        monto={0}
        codigo={codigo}
        setCodigo={setCodigo}
      />
    </div>
  );
};

export default FinanzasLogisticaScreen;
