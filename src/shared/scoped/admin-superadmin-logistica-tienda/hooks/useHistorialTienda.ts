import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getHistorialTienda, getTiendasSobrinas } from '../../../../services/api';
import type {
  UsuarioTienda,
  Ciudad,
  HistorialTiendaResponse,
  EmpaquePendiente,
  Promocion,
  Transaccion,
  TicketConsolidado,
  MesItem,
  ResumenGlobal,
  LiquidacionResult,
} from '../../../types/historial-tienda.types';

export const formatMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
};

export const formatFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generarMesesHistoricos = (fechaCreacion: string): MesItem[] => {
  const fechaInicio = new Date(fechaCreacion);
  const fechaActual = new Date();
  const meses: MesItem[] = [];
  const fechaTemp = new Date(fechaInicio);
  while (fechaTemp <= fechaActual) {
    meses.push({
      mes: fechaTemp.getMonth() + 1,
      año: fechaTemp.getFullYear(),
      fecha: fechaTemp.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
    });
    fechaTemp.setMonth(fechaTemp.getMonth() + 1);
  }
  return meses.reverse();
};

export const agruparConsolidados = (transacciones: Transaccion[]): TicketConsolidado[] => {
  const consolidadosMap = new Map<number, TicketConsolidado>();
  transacciones.forEach((t: any) => {
    if (t.nombre_tipo_transaccion === 'ticket_consolidado') {
      consolidadosMap.set(t.id_transaccion, { ticket: t, productos: [] });
    } else if (t.nombre_estado_transaccion === 'PAGADO' && t.id_transaccion_rel) {
      const consolidado = consolidadosMap.get(t.id_transaccion_rel);
      if (consolidado) consolidado.productos.push(t);
    }
  });
  return Array.from(consolidadosMap.values());
};

export const filtrarPendientes = (transacciones: Transaccion[]): Transaccion[] => {
  return transacciones.filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE');
};

export const calcularLiquidacion = (
  empaque: EmpaquePendiente,
  precioTiendaPorcentaje: number,
  promociones: Promocion[]
): LiquidacionResult => {
  let descuento = 0;
  let precioConDescuento = empaque.precio_venta_total;
  if (empaque.promocion) {
    const promo = promociones.find((p: any) => p.id_promocion === empaque.promocion);
    if (promo && promo.valor > 0) {
      descuento = Math.ceil(empaque.precio_venta_total * (promo.valor / 100));
      precioConDescuento = empaque.precio_venta_total - descuento;
    }
  }
  const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
  const liquidar = Math.ceil(precioConDescuento - tiendaComision);
  return { descuento, precioConDescuento, tiendaComision, liquidar };
};

export interface UseHistorialTiendaOptions {
  mode: 'self' | 'admin';
}

export const useHistorialTienda = ({ mode }: UseHistorialTiendaOptions) => {
  const { user } = useAuth();
  const esAdmin = mode === 'admin';
  const esSelf = mode === 'self';

  const [usuariosTienda, setUsuariosTienda] = useState<UsuarioTienda[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [busquedaNevera, setBusquedaNevera] = useState<string>('');
  const [showTiendaMenu, setShowTiendaMenu] = useState(false);
  const [showCiudadMenu, setShowCiudadMenu] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [historial, setHistorial] = useState<HistorialTiendaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [mesesHistoricos, setMesesHistoricos] = useState<MesItem[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; año: number } | null>(null);

  const [expandedNeveras, setExpandedNeveras] = useState<Set<number>>(new Set());
  const [expandedConsolidados, setExpandedConsolidados] = useState<Set<number>>(new Set());
  const [expandedProductos, setExpandedProductos] = useState<Map<number, Set<number>>>(new Map());

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
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  }, [user?.id]);

  const cargarHistorial = useCallback(async (idUsuario: number, mes?: number, año?: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const data = await getHistorialTienda(idUsuario, mes, año);
      setHistorial(data);
      setExpandedNeveras(new Set());
    } catch (err: any) {
      console.error('Error al cargar historial:', err);
      setError(err.response?.data?.message || 'Error al cargar el historial de la tienda');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarNevera = useCallback(() => {
    if (!busquedaNevera.trim()) return;
    const neveraId = parseInt(busquedaNevera.trim());
    if (isNaN(neveraId)) {
      alert('Por favor ingresa un ID válido.');
      return;
    }
    for (const u of usuariosTienda) {
      for (const t of u.tiendas) {
        const nevera = t.neveras?.find((n: any) => n.id_nevera === neveraId);
        if (nevera) {
          setUsuarioSeleccionado(u.id_usuario);
          cargarHistorial(u.id_usuario, mesSeleccionado?.mes, mesSeleccionado?.año);
          setBusquedaNevera('');
          return;
        }
      }
    }
    alert('Nevera no encontrada con ese ID.');
  }, [busquedaNevera, usuariosTienda, cargarHistorial, mesSeleccionado]);

  const consultarMesEspecifico = useCallback((mes: number, año: number) => {
    setMesSeleccionado({ mes, año });

    if (esSelf && user?.id) {
      cargarHistorial(parseInt(user.id), mes, año);
    } else if (esAdmin && usuarioSeleccionado) {
      cargarHistorial(usuarioSeleccionado, mes, año);
    }
  }, [esSelf, esAdmin, user?.id, usuarioSeleccionado, cargarHistorial]);

  const toggleNevera = useCallback((id: number) => {
    setExpandedNeveras(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleConsolidado = useCallback((id: number) => {
    setExpandedConsolidados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleProducto = useCallback((neveraId: number, idProducto: number) => {
    setExpandedProductos(prev => {
      const next = new Map(prev);
      const set = next.get(neveraId) ?? new Set<number>();
      if (set.has(idProducto)) {
        set.delete(idProducto);
      } else {
        set.add(idProducto);
      }
      if (set.size > 0) {
        next.set(neveraId, set);
      } else {
        next.delete(neveraId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (esAdmin && user) {
      cargarUsuariosTienda();
    }
  }, [esAdmin, user?.id, cargarUsuariosTienda]);

  useEffect(() => {
    if (historial?.fecha_creacion_usuario) {
      const meses = generarMesesHistoricos(historial.fecha_creacion_usuario);
      setMesesHistoricos(meses);
      if (meses.length > 0 && !mesSeleccionado) {
        setMesSeleccionado({ mes: meses[0].mes, año: meses[0].año });
      }
    }
  }, [historial?.fecha_creacion_usuario]);

  useEffect(() => {
    if (esSelf && user) {
      cargarHistorial(parseInt(user.id), mesSeleccionado?.mes, mesSeleccionado?.año);
    }
  }, [esSelf, user?.id]);

  const infoUsuario = historial;
  const neveras = historial?.neveras || [];

  const resumenGlobal = useMemo((): ResumenGlobal | null => {
    if (!historial?.neveras) return null;
    let totalEmpaquesPendientes = 0;
    let totalConsolidados = 0;
    let montoTotalEmpaques = 0;
    let montoTotalConsolidados = 0;
    let montoTotalPendientes = 0;

    historial.neveras.forEach((n: any) => {
      totalEmpaquesPendientes += n.empaques?.length || 0;
      const consolidados = agruparConsolidados(n.transacciones);
      totalConsolidados += consolidados.length;
      montoTotalEmpaques += n.empaques?.reduce((sum: number, e: any) => {
        const precioTienda = parseFloat(n.productos?.find((p: any) => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
        const { liquidar } = calcularLiquidacion(e, precioTienda, n.promociones);
        return sum + liquidar;
      }, 0) || 0;
      montoTotalConsolidados += consolidados.reduce((sum: number, c: any) => sum + (c.ticket.monto || 0), 0);
      montoTotalPendientes += filtrarPendientes(n.transacciones).reduce((sum: number, t: any) => sum + (t.monto || 0), 0);
    });

    return {
      totalNeveras: historial.neveras.length,
      totalEmpaquesPendientes,
      totalConsolidados,
      montoTotalEmpaques,
      montoTotalConsolidados,
      montoTotalPendientes,
    };
  }, [historial]);

  return {
    usuariosTienda,
    ciudades,
    ciudadSeleccionada,
    usuarioSeleccionado,
    busquedaNevera,
    showTiendaMenu,
    showCiudadMenu,
    loadingUsuarios,
    setCiudadSeleccionada,
    setUsuarioSeleccionado,
    setBusquedaNevera,
    setShowTiendaMenu,
    setShowCiudadMenu,
    buscarNevera,

    historial,
    loading,
    error,
    successMessage,
    setError,
    setSuccessMessage,

    mesesHistoricos,
    mesSeleccionado,
    consultarMesEspecifico,
    cargarHistorial,

    expandedNeveras,
    expandedConsolidados,
    expandedProductos,
    toggleNevera,
    toggleConsolidado,
    toggleProducto,

    infoUsuario,
    neveras,
    resumenGlobal,
  };
};
