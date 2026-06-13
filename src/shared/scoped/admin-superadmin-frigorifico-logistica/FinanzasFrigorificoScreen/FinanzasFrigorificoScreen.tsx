import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasFrigorifico } from '../hooks/useCuentasFrigorifico';
import { procesarPago } from '../../../../services/api';
import Resumen from '../../../components/Resumen/Resumen';
import TablaTransacciones from '../../../components/TablaTransacciones/TablaTransacciones';
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
      const respuesta = await procesarPago(usuarioSeleccionado, 0, undefined, 'consolidación con valor 0');
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
    let notaFinal = notaPago;

    if (tipoPago === 'pago') {
      montoFinal = saldoTotalPendientes;
      if (!notaPago) notaFinal = `pago por el usuario ${user?.name || ''} (ID: ${user?.id || ''})`;
    } else {
      montoFinal = montoPago;
      if (!montoFinal || montoFinal <= 0) return;
      if (!notaPago) notaFinal = `abono de ${formatMoneda(montoFinal)} hecho por el usuario ${user?.name || ''} (ID: ${user?.id || ''})`;
    }

    try {
      setProcesandoPago(true);
      const montoRedondeado = Math.round(montoFinal);
      const respuesta = await procesarPago(usuarioSeleccionado, montoRedondeado, undefined, notaFinal);

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

  const resumenItems = useMemo(() => {
    if (!transacciones) return [];
    const t = transacciones as any;
    const pendientes = t.transacciones.filter((tx: any) => tx.nombre_estado_transaccion === 'PENDIENTE').length;
    const consolidados = t.transacciones.filter((tx: any) => tx.nombre_tipo_transaccion === 'ticket_consolidado').length;
    const saldoTotalPendientes = t.transacciones.filter((tx: any) => tx.nombre_estado_transaccion === 'PENDIENTE').reduce((sum: number, tx: any) => sum + tx.monto, 0);
    const montoTotalMes = t.transacciones.filter((tx: any) =>
      tx.nombre_estado_transaccion === 'PENDIENTE' || tx.nombre_estado_transaccion === 'PAGADO'
    ).filter((tx: any) => tx.id_empaque !== null).reduce((sum: number, tx: any) => sum + tx.monto, 0);
    return [
      { label: 'Total Transacciones', value: String(t.total_transacciones), icon: '📊' },
      { label: 'Pendientes', value: String(pendientes), icon: '⏳' },
      { label: 'Consolidados', value: String(consolidados), icon: '✅' },
      { label: 'Saldo Total (Pendientes)', value: formatMoneda(saldoTotalPendientes), icon: '💰' },
      { label: 'Monto del Mes', value: formatMoneda(montoTotalMes), icon: '📅' },
    ];
  }, [transacciones, formatMoneda]);

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
          <Resumen items={resumenItems} />

          {transacciones && (
            <div className="transacciones-container">
              <TablaTransacciones
                data={transacciones}
                loading={loading}
                error={error}
                mesesHistoricos={mesesHistoricos}
                mesSeleccionado={mesSeleccionado}
                onConsultarMes={consultarMesEspecifico}
                variant="proveedor"
              />
            </div>
          )}
        </>
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
