import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasFrigorifico } from '../hooks/useCuentasFrigorifico';
import { procesarPago } from '../../../../services/api';
import TransaccionesHeader from '../../../components/TransaccionesHeader/TransaccionesHeader';
import SummaryCard from '../../../components/SummaryCard/SummaryCard';
import LibroMayor from '../../../components/LibroMayor/LibroMayor';
import GestionCobro from '../../admin-superadmin-logistica/components/GestionCobro/GestionCobro';
import ConfirmacionTransaccionModal from '../../admin-superadmin-logistica/components/ConfirmacionTransaccionModal/ConfirmacionTransaccionModal';
import ProveedorSelector from '../../../components/ProveedorSelector/ProveedorSelector';
import Alert from '../../../components/Alert/Alert';

const FinanzasFrigorificoScreen: React.FC = () => {
  const { user } = useAuth();
  const isFrigorifico = user?.role === 'frigorifico';
  const isAdminRole = user?.role === 'admin';
  const isLogistica = user?.role === 'logistica';
  const isSuperadmin = user?.role === 'superadmin';
  const isAdmin = !isFrigorifico;
  const showGestionCobro = isAdminRole || isLogistica;

  const {
    usuariosHermanos,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
    admins,
    adminSeleccionado,
    setAdminSeleccionado,
    loadingAdmins,
    transacciones,
    loading,
    loadingUsuarios,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    mesesHistoricos,
    mesSeleccionado,
    tipoPago,
    setTipoPago,
    montoPago,
    setMontoPago,
    notaPago,
    setNotaPago,
    procesandoPago,
    setProcesandoPago,
    cargarTransacciones,
    consultarMesEspecifico,
    manejarPago,
    formatMoneda,
  } = useCuentasFrigorifico({ mode: isSuperadmin ? 'superadmin' : isFrigorifico ? 'self' : 'admin' });

  const saldoPendientes = useMemo(() => {
    if (!transacciones?.transacciones) return 0;
    return transacciones.transacciones
      .filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE')
      .reduce((sum: number, t: any) => sum + t.monto, 0);
  }, [transacciones]);

  const pendientesCount = useMemo(() => {
    if (!transacciones?.transacciones) return 0;
    return transacciones.transacciones.filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE').length;
  }, [transacciones]);

  const [consolidandoCero, setConsolidandoCero] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [codigo, setCodigo] = useState('');

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const summaryMetrics = useMemo(() => {
    if (!transacciones?.transacciones) return null;
    const txs = transacciones.transacciones;
    const totalIngresos = txs.filter((t: any) => t.monto > 0).reduce((s: number, t: any) => s + t.monto, 0);
    const totalEgresos = txs.filter((t: any) => t.monto < 0).reduce((s: number, t: any) => s + Math.abs(t.monto), 0);
    const balanceNeto = totalIngresos - totalEgresos;
    return { totalIngresos, totalEgresos, balanceNeto };
  }, [transacciones]);

  const frigorificoNombre = useMemo(() => {
    if (!usuarioSeleccionado) return '';
    const u = usuariosHermanos.find(h => h.id_usuario === usuarioSeleccionado);
    return u ? `${u.nombre_usuario} ${u.apellido_usuario || ''}` : '';
  }, [usuarioSeleccionado, usuariosHermanos]);

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const añoActual = ahora.getFullYear();
  const esMesActual = mesSeleccionado?.mes === mesActual && mesSeleccionado?.año === añoActual;

  const consolidarCero = async () => {
    if (!usuarioSeleccionado) return;
    try {
      setConsolidandoCero(true);
      setError(null);
      const respuesta = await procesarPago(usuarioSeleccionado, 0, 'consolidacion', undefined, undefined);
      setSuccessMessage(respuesta.message || 'Consolidación con valor 0 realizada exitosamente.');
      await cargarTransacciones(usuarioSeleccionado);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Error al consolidar: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    } finally {
      setConsolidandoCero(false);
    }
  };

  const handleProcesarPago = () => {
    if (!usuarioSeleccionado || !transacciones) return;
    if (tipoPago === 'abono' && (!montoPago || montoPago <= 0)) return;
    setCodigo('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCodigo('');
  };

  const handleConfirmar = async () => {
    if (!usuarioSeleccionado || !transacciones) return;

    const saldoTotalPendientes = transacciones.transacciones
      .filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE')
      .reduce((sum: number, t: any) => sum + t.monto, 0);

    let montoFinal: number;
    const notaFinal = notaPago.trim() || undefined;

    if (tipoPago === 'pago') {
      montoFinal = saldoTotalPendientes;
    } else {
      montoFinal = montoPago;
      if (!montoFinal || montoFinal <= 0) return;
    }

    try {
      setProcesandoPago(true);
      const montoRedondeado = Math.round(montoFinal);
      const respuesta = await procesarPago(usuarioSeleccionado, montoRedondeado, tipoPago === 'pago' ? 'consolidacion' : 'egreso', undefined, notaFinal);

      setTipoPago('');
      setMontoPago(0);
      setNotaPago('');
      setShowModal(false);
      setCodigo('');
      setSuccessMessage(`${respuesta.message} | Monto abonado: $${(respuesta.resumen?.monto_abonado ?? 0).toLocaleString()}`);
      await cargarTransacciones(usuarioSeleccionado);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Error al procesar el pago: ' + (err.response?.data?.message || err.message));
      try { await cargarTransacciones(usuarioSeleccionado); } catch (_) {}
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcesandoPago(false);
    }
  };

  const resumenCards = useMemo(() => {
    if (!transacciones) return null;
    const t = transacciones as any;
    const pendientes = t.transacciones.filter((tx: any) => tx.nombre_estado_transaccion === 'PENDIENTE').length;
    const consolidados = t.transacciones.filter((tx: any) => tx.nombre_tipo_transaccion === 'ticket_consolidado').length;
    const saldoTotalPendientes = t.transacciones.filter((tx: any) => tx.nombre_estado_transaccion === 'PENDIENTE').reduce((sum: number, tx: any) => sum + tx.monto, 0);
    const montoTotalMes = t.transacciones.filter((tx: any) =>
      tx.nombre_estado_transaccion === 'PENDIENTE' || tx.nombre_estado_transaccion === 'PAGADO'
    ).filter((tx: any) => tx.id_empaque !== null).reduce((sum: number, tx: any) => sum + tx.monto, 0);
    return { totalTransacciones: t.total_transacciones, pendientes, consolidados, saldoTotalPendientes, montoTotalMes };
  }, [transacciones]);

  if ((loadingUsuarios && isAdmin && !isSuperadmin) || (loadingAdmins && isSuperadmin)) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{isSuperadmin ? 'Cargando administradores...' : 'Cargando usuarios frigorífico...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        {isFrigorifico ? (
          <>
            <h1>Mis Finanzas</h1>
            <p className="subtitle">
              Revisa tus transacciones de productos pendientes y consolidados
            </p>
          </>
        ) : (
          <>
            <h1>Finanzas Frigoríficos</h1>
            <p className="subtitle">
              Consulta las transacciones de productos pendientes y consolidados por frigorífico
            </p>

            {isSuperadmin ? (
              <div style={{ marginTop: '1.5rem', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <ProveedorSelector
                  title="1. SELECCIONAR ADMINISTRADOR:"
                  options={admins.map(a => ({
                    id: a.admin.id_usuario,
                    label: `${a.admin.nombre_usuario} ${a.admin.apellido_usuario || ''}`,
                  }))}
                  selectedId={adminSeleccionado}
                  onSelect={(id) => setAdminSeleccionado(Number(id))}
                  placeholder="Selecciona un administrador..."
                  disabled={loadingAdmins}
                  renderLabel={(option) => {
                    const adminData = admins.find(a => a.admin.id_usuario === option.id);
                    return (
                      <span className="dropdown-item-label">
                        👤 {option.label}
                        {adminData?.admin.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({adminData.admin.email})</span>}
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '0.85rem' }}>
                          | {adminData?.frigorificos.length || 0} frigorífico{adminData?.frigorificos.length !== 1 ? 's' : ''}
                        </span>
                      </span>
                    );
                  }}
                />

                {adminSeleccionado && (
                  <ProveedorSelector
                    title="2. SELECCIONAR PROVEEDOR:"
                    options={usuariosHermanos.map(u => ({ id: u.id_usuario, label: `${u.nombre_usuario} ${u.apellido_usuario || ''}` }))}
                    selectedId={usuarioSeleccionado}
                    onSelect={(id) => {
                      const numId = Number(id);
                      setUsuarioSeleccionado(numId);
                      cargarTransacciones(numId);
                    }}
                    placeholder="Selecciona un frigorífico..."
                    disabled={usuariosHermanos.length === 0}
                    loading={loading}
                    actionLabel="Seleccionar"
                    renderLabel={(option, _isSelected) => {
                      const usuario = usuariosHermanos.find(u => u.id_usuario === option.id);
                      return (
                        <span className="dropdown-item-label">
                          ❄️ {option.label}
                          {usuario?.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({usuario.email})</span>}
                        </span>
                      );
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                <ProveedorSelector
                  title="SELECCIONAR PROVEEDOR:"
                  options={usuariosHermanos.map(u => ({ id: u.id_usuario, label: `${u.nombre_usuario} ${u.apellido_usuario || ''}` }))}
                  selectedId={usuarioSeleccionado}
                  onSelect={(id) => {
                    const numId = Number(id);
                    setUsuarioSeleccionado(numId);
                    cargarTransacciones(numId);
                  }}
                  placeholder="Selecciona un frigorífico..."
                  disabled={loadingUsuarios}
                  loading={loading}
                  actionLabel="Seleccionar"
                  renderLabel={(option, _isSelected) => {
                    const usuario = usuariosHermanos.find(u => u.id_usuario === option.id);
                    return (
                      <span className="dropdown-item-label">
                        ❄️ {option.label}
                        {usuario?.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({usuario.email})</span>}
                      </span>
                    );
                  }}
                />
              </div>
            )}
          </>
        )}

        {loading && !usuarioSeleccionado && isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>
            <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
            <span>Consultando transacciones...</span>
          </div>
        )}
      </div>

      {successMessage && (
        <Alert message={successMessage} onDismiss={() => setSuccessMessage(null)} type="success" />
      )}

      {error && (
        <Alert message={error} onDismiss={() => setError(null)} type="error" />
      )}

      {(isFrigorifico || usuarioSeleccionado) && (
        <>
          {resumenCards && (
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'calc(var(--spacing-unit) * 2)', marginBottom: 'calc(var(--spacing-unit) * 3)' }}>
              <SummaryCard title="Total Transacc." value={String(resumenCards.totalTransacciones)} description="Período" variant="neutral" />
              <SummaryCard title="Pendientes" value={String(resumenCards.pendientes)} description="Transacciones" variant="warning" />
              <SummaryCard title="Monto del Mes" value={formatMoneda(resumenCards.montoTotalMes)} description="Empaques" variant="neutral" />
            </section>
          )}

          {transacciones && (
            <>
              <TransaccionesHeader
                title={frigorificoNombre || user?.name || ''}
                periodo={transacciones.periodo}
                esPeriodoActual={transacciones.parametros_usados.es_periodo_actual}
                fechaCreacion={(() => {
                  const d = new Date(transacciones.fecha_creacion_usuario);
                  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
                })()}
                mesesHistoricos={mesesHistoricos}
                mesSeleccionado={mesSeleccionado}
                onConsultarMes={consultarMesEspecifico}
                loading={loading}
              />

              {summaryMetrics && (
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'calc(var(--spacing-unit) * 2)', marginBottom: 'calc(var(--spacing-unit) * 3)' }}>
                  <SummaryCard
                    title="Ingresos Totales $"
                    value={formatNumber(summaryMetrics.totalIngresos)}
                    description="Período actual"
                    variant="success"
                  />
                  <SummaryCard
                    title="Egresos Totales $"
                    value={formatNumber(summaryMetrics.totalEgresos)}
                    description="Período actual"
                    variant="danger"
                  />
                  <SummaryCard
                    title="Balance Neto $"
                    value={formatNumber(summaryMetrics.balanceNeto)}
                    description="Período actual"
                    variant={summaryMetrics.balanceNeto >= 0 ? 'success' : 'danger'}
                  />
                </section>
              )}

              {showGestionCobro && usuarioSeleccionado && esMesActual && (
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
                  userName={frigorificoNombre}
                  saldoTotalLiquidar={saldoPendientes}
                  pendientesCount={pendientesCount}
                  onConsolidarCero={consolidarCero}
                  consolidandoCero={consolidandoCero}
                />
              )}

              <LibroMayor
                transactions={transacciones.transacciones}
                selectedMonth={transacciones.periodo.mes}
                selectedYear={transacciones.periodo.año}
              />
            </>
          )}
        </>
      )}

      <ConfirmacionTransaccionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmar}
        processing={procesandoPago}
        title={tipoPago === 'pago' ? 'Confirmar Pago Total' : 'Confirmar Abono'}
        origen={user?.name || ''}
        destino={frigorificoNombre}
        monto={
          tipoPago === 'pago'
            ? saldoPendientes
            : montoPago
        }
        codigo={codigo}
        setCodigo={setCodigo}
        disabled={tipoPago === 'pago' ? saldoPendientes <= 0 : montoPago <= 0}
      />
    </div>
  );
};

export default FinanzasFrigorificoScreen;
