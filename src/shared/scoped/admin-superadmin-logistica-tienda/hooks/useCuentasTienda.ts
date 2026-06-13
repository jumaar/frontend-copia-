import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getTransaccionesTienda, getTiendasSobrinas, procesarPago } from '../../../../services/api';
import { useMesSelector } from '../../../../shared/hooks/useMesSelector';
import { formatMoneda as fm } from '../../../config/format';
import type {
  UsuarioTienda,
  Ciudad,
  TransaccionesData,
  EmpaquePendiente,
  ProductoPendiente,
  Promocion,
} from '../../../types/cuentas-tienda.types';

export const formatMoneda = fm;

export const filtrarUsuariosPorNevera = (usuarios: UsuarioTienda[], idNevera: string): UsuarioTienda[] => {
  if (!idNevera.trim()) return usuarios;
  const id = parseInt(idNevera.trim());
  if (isNaN(id)) return usuarios;
  return usuarios.filter(user =>
    user.tiendas?.some(tienda =>
      tienda.neveras?.some(nevera => nevera.id_nevera === id)
    )
  );
};

export interface UseCuentasTiendaOptions {
  mode: 'self' | 'admin';
}

export const useCuentasTienda = ({ mode }: UseCuentasTiendaOptions) => {
  const { user } = useAuth();
  const esAdmin = mode === 'admin';

  const [usuariosTienda, setUsuariosTienda] = useState<UsuarioTienda[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string | null>(null);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | null>(null);
  const [neveraSeleccionada, setNeveraSeleccionada] = useState<number | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { mesesHistoricos, mesSeleccionado, setMesSeleccionado, setMesesHistoricos, consultarMesEspecifico: setMes } = useMesSelector(transacciones?.fecha_creacion_usuario);
  const [tipoPago, setTipoPago] = useState<'pago' | 'abono' | ''>('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [notaPago, setNotaPago] = useState<string>('');
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [busquedaNevera, setBusquedaNevera] = useState<string>('');
  const [showTiendaMenu, setShowTiendaMenu] = useState(false);
  const [showCiudadMenu, setShowCiudadMenu] = useState(false);
  const [showTipoMenu, setShowTipoMenu] = useState(false);
  const [expandedProductos, setExpandedProductos] = useState<Set<number>>(new Set());
  const [saldoTotalLiquidar, setSaldoTotalLiquidar] = useState<number>(0);

  const cargarUsuariosTienda = useCallback(async () => {
    try {
      setLoadingUsuarios(true);
      setError(null);
      const data = await getTiendasSobrinas(parseInt(user?.id || '0'));
      if (data.ciudades_disponibles) setCiudades(data.ciudades_disponibles);
      if (data.usuarios_tienda && Array.isArray(data.usuarios_tienda)) {
        setUsuariosTienda(data.usuarios_tienda);
      } else {
        setUsuariosTienda([]);
      }
    } catch (err: any) {
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  }, [user?.id]);

  const cargarTransacciones = useCallback(async (
    idUsuario: number,
    idNevera?: number,
    mes?: number,
    año?: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      setTransacciones(null);

      const ahora = new Date();
      const data = await getTransaccionesTienda(idUsuario, idNevera, mes ?? ahora.getMonth() + 1, año ?? ahora.getFullYear());
      setTransacciones(data);

      if (idNevera) {
        const total = data.empaques?.reduce((sum: number, e: EmpaquePendiente) => {
          const precioTiendaPorcentaje = parseFloat(data.productos?.find((p: ProductoPendiente) => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
          let descuento = 0;
          let precioConDescuento = e.precio_venta_total;
          if (e.promocion) {
            const promo = data.promociones?.find((p: Promocion) => p.id_promocion === e.promocion);
            if (promo && promo.valor > 0) {
              descuento = Math.ceil(e.precio_venta_total * (promo.valor / 100));
              precioConDescuento = e.precio_venta_total - descuento;
            }
          }
          const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
          return sum + (precioConDescuento - tiendaComision);
        }, 0) || 0;

        const totalFromTransacciones = data.transacciones?.filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum: number, t: any) => sum + (t.monto || 0), 0) || 0;
        setSaldoTotalLiquidar(total + totalFromTransacciones);
      } else {
        setSaldoTotalLiquidar(0);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Error al cargar las transacciones'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConsultarMes = useCallback((mes: number, año: number) => {
    setMes(mes, año);

    if (mode === 'self' && user?.id) {
      cargarTransacciones(parseInt(user.id), neveraSeleccionada || undefined, mes, año);
    } else if (mode === 'admin' && tiendaSeleccionada && neveraSeleccionada) {
      let userId: number | null = null;
      for (const u of usuariosTienda) {
        const found = u.tiendas?.find(t => t.id_tienda === tiendaSeleccionada);
        if (found) {
          userId = u.id_usuario;
          break;
        }
      }
      if (userId) {
        cargarTransacciones(userId, neveraSeleccionada, mes, año);
      }
    }
  }, [setMes, mode, user?.id, tiendaSeleccionada, neveraSeleccionada, usuariosTienda, cargarTransacciones]);

  const buscarNevera = useCallback(() => {
    if (!busquedaNevera.trim()) return;
    const neveraId = parseInt(busquedaNevera.trim());
    if (isNaN(neveraId)) {
      alert('Por favor ingresa un ID válido.');
      return;
    }
    for (const usr of usuariosTienda) {
      for (const tienda of usr.tiendas) {
        const nevera = tienda.neveras?.find(n => n.id_nevera === neveraId);
        if (nevera) {
          setTiendaSeleccionada(tienda.id_tienda);
          setNeveraSeleccionada(neveraId);
          cargarTransacciones(usr.id_usuario, neveraId);
          setBusquedaNevera('');
          return;
        }
      }
    }
    alert('Nevera no encontrada con ese ID.');
  }, [busquedaNevera, usuariosTienda, cargarTransacciones]);

  const manejarPago = useCallback(async () => {
    if (!tiendaSeleccionada || !neveraSeleccionada) {
      alert('No hay tienda y nevera seleccionadas.');
      return;
    }

    let montoFinal = 0;
    const notaFinal = notaPago.trim() || undefined;

    if (tipoPago === 'pago') {
      montoFinal = saldoTotalLiquidar;
    } else {
      montoFinal = montoPago;
      if (isNaN(montoFinal) || montoFinal <= 0) {
        alert('Por favor ingrese un monto válido para el abono.');
        return;
      }
    }

    const confirmMessage = tipoPago === 'pago'
      ? `¿Confirmar cobro total de ${formatMoneda(montoFinal)}?`
      : `¿Confirmar abono de ${formatMoneda(montoFinal)}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setProcesandoPago(true);
      const montoRedondeado = Math.ceil(montoFinal);

      let userId: number | null = null;
      for (const u of usuariosTienda) {
        const found = u.tiendas?.find(t => t.id_tienda === tiendaSeleccionada);
        if (found) {
          userId = u.id_usuario;
          break;
        }
      }
      if (!userId) {
        alert('Error: No se pudo encontrar el usuario de la tienda.');
        return;
      }

      const empaquesAfectados = transacciones?.empaques?.map(e => e.id_empaque) || [];
      const respuesta = await procesarPago(
        userId,
        montoRedondeado,
        tipoPago === 'pago' ? 'consolidacion' : 'egreso',
        neveraSeleccionada,
        notaFinal,
        empaquesAfectados.length > 0 ? empaquesAfectados : undefined
      );

      const esAdelantoSinDeuda = respuesta.resumen?.tipo_operacion === 'adelanto_sin_deuda';

      if (transacciones) {
        const nuevasTransacciones = [...(transacciones?.transacciones || [])];
        if (!esAdelantoSinDeuda) {
          nuevasTransacciones.push({
            ...respuesta,
            nombre_tipo_transaccion: 'ticket_consolidado',
            nombre_estado_transaccion: 'CONSOLIDADO',
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
            id_transaccion_rel: respuesta.id_transaccion,
          });
        }
        setTransacciones({ ...transacciones, transacciones: nuevasTransacciones });
      }

      setTipoPago('');
      setMontoPago(0);
      setNotaPago('');
      setSuccessMessage(respuesta.message || 'Cobro procesado exitosamente.');

      if (userId) {
        const data = await getTransaccionesTienda(userId, neveraSeleccionada);
        const totalFromEmpaques = data.empaques?.reduce((sum: number, e: EmpaquePendiente) => {
          const precioTiendaPorcentaje = parseFloat(data.productos?.find((p: ProductoPendiente) => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
          let descuento = 0;
          let precioConDescuento = e.precio_venta_total;
          if (e.promocion) {
            const promo = data.promociones?.find((p: Promocion) => p.id_promocion === e.promocion);
            if (promo && promo.valor > 0) {
              descuento = Math.ceil(e.precio_venta_total * (promo.valor / 100));
              precioConDescuento = e.precio_venta_total - descuento;
            }
          }
          const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
          return sum + (precioConDescuento - tiendaComision);
        }, 0) || 0;
        const totalFromTransacciones = data.transacciones?.filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum: number, t: any) => sum + (t.monto || 0), 0) || 0;
        setSaldoTotalLiquidar(totalFromEmpaques + totalFromTransacciones);
        setTransacciones(data);
        cargarUsuariosTienda();
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message;
      setError('Error al procesar el cobro: ' + errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcesandoPago(false);
    }
  }, [tiendaSeleccionada, neveraSeleccionada, tipoPago, montoPago, notaPago, saldoTotalLiquidar, user, usuariosTienda, transacciones, cargarUsuariosTienda]);

  useEffect(() => {
    if (user) {
      cargarUsuariosTienda();
    }
  }, [user?.id, cargarUsuariosTienda]);

  useEffect(() => {
    if (tipoPago === 'pago') {
      setMontoPago(saldoTotalLiquidar);
    } else if (tipoPago === 'abono') {
      setMontoPago(0);
    }
  }, [tipoPago, saldoTotalLiquidar]);

  const handleSeleccionarTienda = useCallback((idTienda: number, idUsuario: number, idNevera?: number) => {
    setTiendaSeleccionada(idTienda);
    if (idNevera) {
      setNeveraSeleccionada(idNevera);
      cargarTransacciones(idUsuario, idNevera);
    } else {
      setNeveraSeleccionada(null);
      setTransacciones(null);
    }
  }, [cargarTransacciones]);

  return {
    // Data
    usuariosTienda,
    ciudades,
    transacciones,
    loading,
    loadingUsuarios,
    error,
    successMessage,
    // Selection
    ciudadSeleccionada,
    tiendaSeleccionada,
    neveraSeleccionada,
    busquedaNevera,
    // Months
    mesesHistoricos,
    mesSeleccionado,
    // Payment
    tipoPago,
    montoPago,
    notaPago,
    procesandoPago,
    setProcesandoPago,
    saldoTotalLiquidar,
    // UI state
    showTiendaMenu,
    showCiudadMenu,
    showTipoMenu,
    expandedProductos,
    // Mode
    esAdmin,
    // Actions
    setCiudadSeleccionada,
    setTiendaSeleccionada,
    setNeveraSeleccionada,
    setBusquedaNevera,
    setShowTiendaMenu,
    setShowCiudadMenu,
    setShowTipoMenu,
    setTipoPago,
    setMontoPago,
    setNotaPago,
    setExpandedProductos,
    setError,
    setSuccessMessage,
    handleSeleccionarTienda,
    buscarNevera,
    consultarMesEspecifico: handleConsultarMes,
    setMesSeleccionado,
    setMesesHistoricos,
    manejarPago,
    cargarTransacciones,
  };
};
