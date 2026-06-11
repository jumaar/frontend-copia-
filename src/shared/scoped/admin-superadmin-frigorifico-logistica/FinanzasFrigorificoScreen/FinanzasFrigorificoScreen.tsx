import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasFrigorifico } from '../hooks/useCuentasFrigorifico';
import { procesarPago } from '../../../../services/api';
import Resumen from '../../../components/Resumen/Resumen';
import TablaTransacciones from '../../../components/TablaTransacciones/TablaTransacciones';
import GestionCobro from '../../admin-superadmin-logistica/components/GestionCobro/GestionCobro';
import ProveedorSelector from '../../../components/ProveedorSelector/ProveedorSelector';
import Alert from '../../../components/Alert/Alert';

const FinanzasFrigorificoScreen: React.FC = () => {
  const { user } = useAuth();
  const isFrigorifico = user?.role === 'frigorifico';
  const isAdminRole = user?.role === 'admin';
  const isLogistica = user?.role === 'logistica';
  const isAdmin = !isFrigorifico;
  const showGestionCobro = isAdminRole || isLogistica;

  const {
    usuariosHermanos,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
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
    cargarTransacciones,
    consultarMesEspecifico,
    manejarPago,
    formatMoneda,
  } = useCuentasFrigorifico({ mode: isFrigorifico ? 'self' : 'admin' });

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

  if (loadingUsuarios && isAdmin) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios frigorífico...</p>
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

            <div style={{ marginTop: '1.5rem' }}>
              <ProveedorSelector
                title="SELECCIONAR PROVEEDOR:"
                options={usuariosHermanos.map(u => ({ id: u.id_usuario, label: `${u.nombre_usuario} ${u.apellido_usuario}` }))}
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
          </>
        )}

        {loading && !usuarioSeleccionado && isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginTop: '1rem' }}>
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
          onProcesarPago={manejarPago}
          userName={user?.name || ''}
          saldoTotalLiquidar={saldoPendientes}
          pendientesCount={pendientesCount}
          onConsolidarCero={consolidarCero}
          consolidandoCero={consolidandoCero}
        />
      )}
    </div>
  );
};

export default FinanzasFrigorificoScreen;
