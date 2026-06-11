import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getTransaccionesFrigorifico, getHermanos, procesarPago } from '../../../../services/api';
import { useMesSelector } from '../../../../shared/hooks/useMesSelector';
import type { UsuarioHermano, AdminFrigorifico, TransaccionesData } from '../../../../shared/types/cuentas-frigorifico.types';

interface UseCuentasFrigorificoOptions {
  mode: 'self' | 'admin' | 'superadmin';
}

export const useCuentasFrigorifico = ({ mode }: UseCuentasFrigorificoOptions) => {
  const { user } = useAuth();

  const [usuariosHermanos, setUsuariosHermanos] = useState<UsuarioHermano[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showMesesMenu, setShowMesesMenu] = useState(false);
  const [tipoPago, setTipoPago] = useState<'pago' | 'abono' | ''>('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [notaPago, setNotaPago] = useState<string>('');
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [showTipoMenu, setShowTipoMenu] = useState(false);

  const esFrigorifico = user?.role === 'frigorifico';
  const esLogistica = user?.role === 'logistica';
  const esSuperadmin = user?.role === 'superadmin';

  const [admins, setAdmins] = useState<AdminFrigorifico[]>([]);
  const [adminSeleccionado, setAdminSeleccionado] = useState<number | null>(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const { mesesHistoricos, mesSeleccionado, setMesSeleccionado, setMesesHistoricos, consultarMesEspecifico: setMes } = useMesSelector(transacciones?.fecha_creacion_usuario);

  const cargarTransacciones = async (idUsuario: number, mes?: number, año?: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setTransacciones(null);

      const data = await getTransaccionesFrigorifico(idUsuario, mes, año);
      setTransacciones(data);
    } catch (err: any) {
      console.error('Error al cargar transacciones:', err);
      setError(
        err.response?.data?.message ||
        'Error al cargar las transacciones del usuario'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConsultarMes = (mes: number, año: number) => {
    setMes(mes, año);
    if ((esFrigorifico && user?.id) || ((esLogistica || user?.role === 'admin' || user?.role === 'superadmin') && usuarioSeleccionado)) {
      const userId = mode === 'self' ? (user ? parseInt(user.id) : null) : usuarioSeleccionado;
      if (userId) {
        cargarTransacciones(userId, mes, año);
      }
    }
  };

  const cargarUsuariosHermanos = async () => {
    try {
      setLoadingUsuarios(true);
      setError(null);
      const data = await getHermanos();

      if (data.hermanos && Array.isArray(data.hermanos)) {
        setUsuariosHermanos(data.hermanos);
      } else if (data.usuarios && Array.isArray(data.usuarios)) {
        setUsuariosHermanos(data.usuarios);
      } else if (Array.isArray(data)) {
        setUsuariosHermanos(data);
      } else {
        setUsuariosHermanos([]);
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const cargarAdmins = async () => {
    try {
      setLoadingAdmins(true);
      setError(null);
      const data = await getHermanos();
      if (data.admins && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      } else if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        setAdmins([]);
      }
    } catch (err: any) {
      console.error('Error al cargar admins:', err);
      setError('Error al cargar la lista de administradores');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleSeleccionarAdmin = useCallback((idAdmin: number) => {
    setAdminSeleccionado(idAdmin);
    setUsuarioSeleccionado(null);
    setTransacciones(null);
    const adminData = admins.find(a => a.admin.id_usuario === idAdmin);
    if (adminData) {
      setUsuariosHermanos(adminData.frigorificos);
    } else {
      setUsuariosHermanos([]);
    }
  }, [admins]);

  const recargarDatosUsuario = async () => {
    if (usuarioSeleccionado) {
      try {
        setLoading(true);
        const data = await getTransaccionesFrigorifico(usuarioSeleccionado);
        setTransacciones(data);
      } catch (err: any) {
        console.error('Error al recargar datos:', err);
        setError('Error al recargar las transacciones: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const manejarPago = async () => {
    if (!usuarioSeleccionado || !transacciones) {
      alert('No hay usuario seleccionado o datos cargados.');
      return;
    }

    const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);

    let montoFinal = 0;
    let notaFinal = notaPago;

    if (tipoPago === 'pago') {
      montoFinal = saldoTotalPendientes;
      if (!notaPago) {
        notaFinal = `pago por el usuario ${user?.name || ''} (ID: ${user?.id || ''})`;
      }
    } else {
      montoFinal = montoPago;
      if (isNaN(montoFinal) || montoFinal <= 0) {
        alert('Por favor ingrese un monto válido para el abono.');
        return;
      }
      if (!notaPago) {
        notaFinal = `abono de ${formatMoneda(montoFinal)} hecho por el usuario logistica ${user?.name || ''} (ID: ${user?.id || ''})`;
      }
    }

    const confirmMessage = tipoPago === 'pago'
      ? `¿Confirmar pago total de ${formatMoneda(montoFinal)}?`
      : `¿Confirmar abono de ${formatMoneda(montoFinal)}?`;

    setTimeout(() => {
      if (!window.confirm(confirmMessage)) return;
      procesarPagoSeguro();
    }, 100);

    const procesarPagoSeguro = async () => {
      try {
        setProcesandoPago(true);
        const montoRedondeado = Math.round(montoFinal);
        const respuesta = await procesarPago(usuarioSeleccionado, montoRedondeado, undefined, notaFinal);

        const esAdelantoSinDeuda = respuesta.resumen?.tipo_operacion === 'adelanto_sin_deuda';

        if (transacciones) {
          const nuevasTransacciones = [...transacciones.transacciones];

          if (!esAdelantoSinDeuda) {
            nuevasTransacciones.push({
              ...respuesta,
              nombre_tipo_transaccion: 'ticket_consolidado',
              nombre_estado_transaccion: 'CONSOLIDADO'
            });
            nuevasTransacciones.forEach(t => {
              if (t.nombre_estado_transaccion === 'PENDIENTE') {
                t.nombre_estado_transaccion = 'PAGADO';
                t.id_transaccion_rel = respuesta.id_transaccion;
              }
            });
          } else {
            nuevasTransacciones.push({
              ...respuesta,
              nombre_tipo_transaccion: 'abono_adelantado',
              nombre_estado_transaccion: 'ADELANTADO',
              id_transaccion_rel: respuesta.id_transaccion
            });
          }

          setTransacciones({ ...transacciones, transacciones: nuevasTransacciones });
        }

        setTipoPago('');
        setMontoPago(0);
        setNotaPago('');

        const montoConsolidado = respuesta.resumen?.monto_consolidado;
        const montoAbonado = respuesta.resumen?.monto_abonado ?? 0;

        let mensajeDetallado = '';
        if (esAdelantoSinDeuda) {
          mensajeDetallado = `
✅ ${respuesta.message}

📋 RESUMEN DEL ABONO ADELANTADO:
👤 Usuario: ID ${respuesta.resumen.usuario_consolidado}
💸 Monto Abonado: $${montoAbonado.toLocaleString()}
🏷️ Tipo: Abono Adelantado (Sin Deuda Pendiente)
          `.trim();
        } else {
          const lineas = [
            `✅ ${respuesta.message}`,
            '',
            '📋 RESUMEN DE LA CONSOLIDACIÓN:',
            `👤 Usuario Consolidado: ID ${respuesta.resumen.usuario_consolidado}`,
            `💰 Usuario Acreedor: ID ${respuesta.resumen.usuario_acreedor}`,
          ];
          if (montoConsolidado != null) {
            lineas.push(`💵 Monto Consolidado: $${montoConsolidado.toLocaleString()}`);
          }
          lineas.push(`💸 Monto Abonado: $${montoAbonado.toLocaleString()}`);
          mensajeDetallado = lineas.join('\n');
        }

        alert(mensajeDetallado);
        setSuccessMessage('Pago procesado exitosamente.');

        await recargarDatosUsuario();

        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        console.error('Error al procesar pago:', err);

        const errorMessage = err.response?.data?.message || err.message;
        if (errorMessage.includes('adelanto') || errorMessage.includes('sin deuda')) {
          setError('Error en el abono adelantado: ' + errorMessage);
        } else {
          setError('Error al procesar el pago: ' + errorMessage);
        }

        try { await recargarDatosUsuario(); } catch (_) { /* si falla, ya hay error mostrado */ }
        setTimeout(() => setError(null), 5000);
      } finally {
        setProcesandoPago(false);
      }
    };
  };

  useEffect(() => {
    if (mode === 'self' && esFrigorifico && user?.id) {
      cargarTransacciones(parseInt(user.id));
    } else if (mode === 'superadmin' && esSuperadmin && user) {
      setLoadingAdmins(true);
      cargarAdmins();
    } else if (mode === 'admin' && (esLogistica || user?.role === 'admin') && user) {
      setLoadingUsuarios(true);
      cargarUsuariosHermanos();
    }
  }, [mode, esFrigorifico, esLogistica, esSuperadmin, user?.id, user?.role]);

  useEffect(() => {
    if (transacciones && tipoPago === 'pago') {
      const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
      setMontoPago(saldoTotalPendientes);
    } else if (tipoPago === 'abono') {
      setMontoPago(0);
    }
  }, [tipoPago, transacciones]);

  return {
    usuariosHermanos,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
    admins,
    adminSeleccionado,
    setAdminSeleccionado: handleSeleccionarAdmin,
    loadingAdmins,
    transacciones,
    setTransacciones,
    loading,
    loadingUsuarios,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    mesesHistoricos,
    mesSeleccionado,
    showMesesMenu,
    setShowMesesMenu,
    tipoPago,
    setTipoPago,
    montoPago,
    setMontoPago,
    notaPago,
    setNotaPago,
    procesandoPago,
    showTipoMenu,
    setShowTipoMenu,
    esFrigorifico,
    cargarTransacciones,
    consultarMesEspecifico: handleConsultarMes,
    manejarPago,
    formatMoneda,
    setMesSeleccionado,
    setMesesHistoricos,
  };
};
