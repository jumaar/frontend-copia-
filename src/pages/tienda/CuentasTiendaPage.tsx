import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTransaccionesTienda, getTiendasSobrinas, procesarPago } from '../../services/api';
import TablaTransacciones from '../../components/TablaTransacciones';
import '../../components/TablaTransacciones.css';

interface Ciudad {
  id_ciudad: number;
  nombre_ciudad: string;
  departamento: string;
}

interface Nevera {
  id_nevera: number;
  id_estado_nevera: number;
  pendientes_pago: boolean;
}

interface Tienda {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  neveras?: Nevera[];
}

interface UsuarioTienda {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: string;
  tiendas: Tienda[];
}

interface NeveraInfo {
  id_nevera: number;
  id_tienda: number;
  nombre_tienda: string;
}

interface EmpaquePendiente {
  id_empaque: number;
  precio_venta_total: number;
  id_producto: number;
  promocion: number | null;
}

interface ProductoPendiente {
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  precio_tienda: string;
}

interface Promocion {
  id_promocion: number;
  nombre: string;
  tipo: string;
  valor: number;
}

interface Transaccion {
  id_transaccion: number;
  id_empaque: number | null;
  id_transaccion_rel: number | null;
  monto: number;
  costo_tienda: number;
  hora_transaccion?: string;
  nombre_tipo_transaccion: string;
  nombre_estado_transaccion?: string;
  nota_opcional: string;
  info_pago?: {
    id_usuario_pago: number;
    nombre_usuario_pago: string;
    nota_opcional_pago: string;
  };
  [key: string]: any;
}

interface TransaccionesData {
  nevera?: NeveraInfo;
  empaques: EmpaquePendiente[];
  productos: ProductoPendiente[];
  promociones: Promocion[];
  transacciones: Transaccion[];
  fecha_creacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  periodo: { mes: number; año: number };
  total_transacciones: number;
  fecha_inicio_periodo?: string;
  fecha_fin_periodo?: string;
  parametros_usados: {
    mes_pedido: number | null;
    año_pedido: number | null;
    mes_devuelto: number | null;
    año_devuelto: number | null;
    es_periodo_actual: boolean;
  };
}

const CuentasTiendaPage: React.FC = () => {
  const { user } = useAuth();
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
  const [mesesHistoricos, setMesesHistoricos] = useState<Array<{mes: number, año: number, fecha: string}>>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{mes: number, año: number} | null>(null);
  const [tipoPago, setTipoPago] = useState<'pago' | 'abono' | ''>('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [notaPago, setNotaPago] = useState<string>('');
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [showTipoMenu, setShowTipoMenu] = useState(false);
  const [busquedaNevera, setBusquedaNevera] = useState<string>('');
  const [showTiendaMenu, setShowTiendaMenu] = useState(false);
  const [showCiudadMenu, setShowCiudadMenu] = useState(false);
  const [loadingCuentaNevera] = useState(false);
  const [expandedProductos, setExpandedProductos] = useState<Set<number>>(new Set());
  const [saldoTotalLiquidar, setSaldoTotalLiquidar] = useState<number>(0);

  // Cerrar menús desplegables al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
        setShowTipoMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determinar el tipo de usuario
  const esTienda = user?.role === 'tienda';
  const esLogistica = user?.role === 'logistica';
  const esAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const puedeVerOtrasTiendas = esLogistica || esAdmin || esTienda;

  // Generar lista de meses históricos
  const generarMesesHistoricos = (fechaCreacion: string) => {
    const fechaInicio = new Date(fechaCreacion);
    const fechaActual = new Date();
    
    const meses = [];
    const fechaTemp = new Date(fechaInicio);
    
    // Generar todos los meses desde la creación hasta hoy
    while (fechaTemp <= fechaActual) {
      meses.push({
        mes: fechaTemp.getMonth() + 1,
        año: fechaTemp.getFullYear(),
        fecha: fechaTemp.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      });
      
      // Avanzar al siguiente mes
      fechaTemp.setMonth(fechaTemp.getMonth() + 1);
    }
    
    // Asegurarse de que el mes actual esté incluido en la lista
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear();
    const existeMesActual = meses.some(m => m.mes === mesActual && m.año === añoActual);
    
    if (!existeMesActual) {
      meses.push({
        mes: mesActual,
        año: añoActual,
        fecha: fechaActual.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      });
    }
    
    return meses.reverse(); // Mostrar desde el más reciente
  };

  // Cargar datos según el tipo de usuario
  useEffect(() => {
    if (puedeVerOtrasTiendas && user) {
      // Cargar lista de tiendas para seleccionar
      setLoadingUsuarios(true);
      cargarUsuariosTienda();
    }
  }, [puedeVerOtrasTiendas, user?.id]);

  // Actualizar meses históricos cuando se cargan transacciones de la tienda
  useEffect(() => {
    if (transacciones?.fecha_creacion_usuario) {
      const meses = generarMesesHistoricos(transacciones.fecha_creacion_usuario);
      setMesesHistoricos(meses);
      // Establecer mes actual como seleccionado
      if (meses.length > 0) {
        setMesSeleccionado({ mes: meses[0].mes, año: meses[0].año });
      }
    }
  }, [transacciones?.fecha_creacion_usuario]);

  // Actualizar monto de pago cuando cambie el tipo o las transacciones
  useEffect(() => {
    if (tipoPago === "pago") {
      setMontoPago(saldoTotalLiquidar);
    } else if (tipoPago === 'abono') {
      setMontoPago(0);
    }
  }, [tipoPago, saldoTotalLiquidar]);

  // Filtrar usuarios por ID de nevera
  const filtrarUsuariosPorNevera = (usuarios: UsuarioTienda[], idNevera: string) => {
    if (!idNevera.trim()) return usuarios;

    const id = parseInt(idNevera.trim());
    if (isNaN(id)) return usuarios;

    return usuarios.filter(user =>
      user.tiendas?.some(tienda =>
        tienda.neveras?.some(nevera => nevera.id_nevera === id)
      )
    );
  };

  // Cargar usuarios tiendas (solo para roles administrativos)
  const cargarUsuariosTienda = async () => {
    try {
      setLoadingUsuarios(true);
      setError(null);
      const data = await getTiendasSobrinas(parseInt(user?.id || '0'));

      if (data.ciudades_disponibles) {
        setCiudades(data.ciudades_disponibles);
      }

      if (data.usuarios_tienda && Array.isArray(data.usuarios_tienda)) {
        setUsuariosTienda(data.usuarios_tienda);
        console.log('Usuarios tienda cargados:', data.usuarios_tienda);
      } else {
        console.warn('Estructura de respuesta inesperada:', data);
        setUsuariosTienda([]);
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Cargar transacciones cuando se selecciona un usuario y/o mes
  const cargarTransacciones = async (idUsuario: number, idNevera?: number, mes?: number, año?: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setTransacciones(null);

      if (idNevera) {
        const data = await getTransaccionesTienda(idUsuario, idNevera, mes, año);
        setTransacciones(data);

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
        const saldoFinal = total + totalFromTransacciones;
        setSaldoTotalLiquidar(saldoFinal);
      } else {
        const data = await getTransaccionesTienda(idUsuario, undefined, mes, año);
        setTransacciones(data);
        setSaldoTotalLiquidar(0);
      }
    } catch (err: any) {
      console.error('Error al cargar transacciones:', err);
      setError(
        err.response?.data?.message ||
        'Error al cargar las transacciones'
      );
    } finally {
      setLoading(false);
    }
  };
// Consultar transacciones de un mes específico
  const consultarMesEspecifico = (mes: number, año: number) => {
    if ((esTienda && user?.id) || (puedeVerOtrasTiendas && tiendaSeleccionada && neveraSeleccionada)) {
      setMesSeleccionado({ mes, año });

      if (esTienda && user?.id) {
        cargarTransacciones(parseInt(user.id), undefined, mes, año);
      } else if (puedeVerOtrasTiendas && tiendaSeleccionada && neveraSeleccionada) {
        // Encontrar el ID del usuario de la tienda seleccionada
        let userId = null;
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
    }
  };

  // Manejar el procesamiento del pago
  const manejarPago = async () => {
    if (!tiendaSeleccionada || !neveraSeleccionada) {
      alert('No hay tienda y nevera seleccionadas.');
      return;
    }

    if (tipoPago === 'abono' && montoPago <= 0) {
      alert('Para abonos, debe ingresar un monto mayor a 0.');
      return;
    }

    let montoFinal = 0;
    let notaFinal = notaPago;

    if (tipoPago === 'pago') {
      montoFinal = saldoTotalLiquidar;
      if (!notaPago) {
        notaFinal = `cobro total por el usuario logistica ${user?.name || ''} (ID: ${user?.id || ''})`;
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
      ? `¿Confirmar cobro total de ${formatMoneda(montoFinal)}?`
      : `¿Confirmar abono de ${formatMoneda(montoFinal)}?`;

    setTimeout(() => {
      if (!window.confirm(confirmMessage)) return;

      procesarPagoSeguro();
    }, 100);

    const procesarPagoSeguro = async () => {
      try {
        setProcesandoPago(true);
        const montoRedondeado = Math.ceil(montoFinal);

        // Encontrar el ID del usuario de la tienda seleccionada
        let userId = null;
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
        
        let mensajeDetallado = '';
        const montoAbonado = respuesta.resumen?.monto_abonado ?? 0;
        const montoConsolidado = respuesta.resumen?.monto_consolidado ?? 0;
        const usuarioConsolidado = respuesta.resumen?.usuario_consolidado ?? 'N/A';
        const usuarioAcreedor = respuesta.resumen?.usuario_acreedor ?? 'N/A';

        if (esAdelantoSinDeuda) {
          mensajeDetallado = `
✅ ${respuesta.message}

📋 RESUMEN DEL ABONO ADELANTADO:
👤 Usuario: ID ${usuarioConsolidado}
💸 Monto Abonado: $${montoAbonado.toLocaleString()}
🏷️ Tipo: Abono Adelantado (Sin Deuda Pendiente)
          `.trim();
        } else {
          mensajeDetallado = `
✅ ${respuesta.message}

📋 RESUMEN DE LA CONSOLIDACIÓN:
👤 Usuario Consolidado: ID ${usuarioConsolidado}
💰 Usuario Acreedor: ID ${usuarioAcreedor}
💵 Monto Consolidado: $${montoConsolidado.toLocaleString()}
💸 Monto Abonado: $${montoAbonado.toLocaleString()}
          `.trim();
        }
        
        alert(mensajeDetallado);
        setSuccessMessage('Cobro procesado exitosamente.');

        // Recargar datos de la nevera SIN loading spinner para mejor UX
        if (userId) {
          try {
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
            const saldoFinal = totalFromEmpaques + totalFromTransacciones;
            setSaldoTotalLiquidar(saldoFinal);

            setTransacciones(data);
          } catch (err) {
            console.error('Error al recargar transacciones:', err);
          }

          cargarUsuariosTienda();
        }

        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        console.error('Error al procesar cobro:', err);

        const errorMessage = err.response?.data?.message || err.message;
        if (errorMessage.includes('adelanto') || errorMessage.includes('sin deuda')) {
          setError('Error en el abono adelantado: ' + errorMessage);
        } else {
          setError('Error al procesar el cobro: ' + errorMessage);
        }

        setTimeout(() => setError(null), 5000);
      } finally {
        setProcesandoPago(false);
      }
    };
  };

  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  if (loadingUsuarios) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios de tienda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        <h1>Cuentas de Neveras</h1>
        <p className="subtitle">
          Consulta las transacciones de productos pendientes y consolidados por nevera específica
        </p>

      {/* Selectores de tienda y nevera al frente de la página */}
      {puedeVerOtrasTiendas && (
        <div className="usuario-selector" style={{ position: 'relative', zIndex: 1000000 }}>
          <div className="selector-container">
            <h3 style={{ color: 'var(--color-text-primary)' }}>
              SELECCIONAR TIENDA:
            </h3>
            {loadingUsuarios ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Cargando tiendas...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ flex: '1 1 100%', marginBottom: '1rem' }}>
                  <label className="selector-label">🔍 Buscar por ID de Nevera:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="usuario-select"
                      value={busquedaNevera}
                      onChange={(e) => setBusquedaNevera(e.target.value)}
                      placeholder="Ingresa el ID de la nevera..."
                      style={{
                        flex: '1',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '2px solid #666',
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text-primary)',
                        fontSize: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        outline: 'none'
                      }}
                    />
                    <button
                      className="btn-consultar"
                      onClick={() => {
                        if (busquedaNevera.trim()) {
                          const neveraId = parseInt(busquedaNevera.trim());
                          if (!isNaN(neveraId)) {
                            // Buscar la tienda y nevera correspondiente
                            for (const user of usuariosTienda) {
                              for (const tienda of user.tiendas) {
                                const nevera = tienda.neveras?.find(n => n.id_nevera === neveraId);
                                if (nevera) {
                                  setTiendaSeleccionada(tienda.id_tienda);
                                  setNeveraSeleccionada(neveraId);
                                  cargarTransacciones(user.id_usuario, neveraId);
                                  setBusquedaNevera('');
                                  return;
                                }
                              }
                            }
                            alert('Nevera no encontrada con ese ID.');
                          } else {
                            alert('Por favor ingresa un ID válido.');
                          }
                        }
                      }}
                      disabled={!busquedaNevera.trim() || loading}
                      style={{
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        cursor: (!busquedaNevera.trim() || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!busquedaNevera.trim() || loading) ? 0.5 : 1,
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 250px' }}>
                    <label className="selector-label">1. Filtrar por Ciudad:</label>
                    <div className="meses-dropdown" style={{ marginTop: '0.5rem' }}>
                      <button
                        className="dropdown-toggle"
                        onClick={() => {
                          setShowCiudadMenu(!showCiudadMenu);
                          setShowTiendaMenu(false);
                          setShowTipoMenu(false);
                        }}
                        disabled={loadingUsuarios}
                        style={{
                          opacity: loadingUsuarios ? 0.7 : 1,
                          cursor: loadingUsuarios ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {ciudadSeleccionada ? (
                          (() => {
                            const ciudad = ciudades.find(c => c.nombre_ciudad === ciudadSeleccionada);
                            return ciudad ? `${ciudad.nombre_ciudad} - ${ciudad.departamento}` : 'Selecciona una ciudad...';
                          })()
                        ) : (
                          <span>Selecciona una ciudad...</span>
                        )}
                        <span className="dropdown-arrow">▼</span>
                      </button>

                      {showCiudadMenu && !loadingUsuarios && (
                        <div className="dropdown-menu">
                          <div className="dropdown-item">
                            <span className="mes-fecha">Todas las ciudades</span>
                            <button
                              className={`btn-consultar ${!ciudadSeleccionada ? 'activo' : ''}`}
                              onClick={() => {
                                setCiudadSeleccionada(null);
                                setTiendaSeleccionada(null);
                                setTransacciones(null);
                                setShowCiudadMenu(false);
                              }}
                              disabled={loading}
                            >
                              {loading ? 'Cargando...' : 'Seleccionar'}
                            </button>
                          </div>
                          {ciudades.map(ciudad => (
                            <div key={ciudad.id_ciudad} className="dropdown-item">
                              <span className="mes-fecha">{ciudad.nombre_ciudad} - {ciudad.departamento}</span>
                              <button
                                className={`btn-consultar ${ciudadSeleccionada === ciudad.nombre_ciudad ? 'activo' : ''}`}
                                onClick={() => {
                                  setCiudadSeleccionada(ciudad.nombre_ciudad);
                                  setTiendaSeleccionada(null);
                                  setTransacciones(null);
                                  setShowCiudadMenu(false);
                                }}
                                disabled={loading}
                              >
                                {loading ? 'Cargando...' : 'Seleccionar'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: '1 1 350px' }}>
                    <label className="selector-label">2. Seleccionar Tienda:</label>
                    <div className="meses-dropdown">
                      <button
                        className="dropdown-toggle"
                        onClick={() => setShowTiendaMenu(!showTiendaMenu)}
                        disabled={loadingUsuarios}
                        style={{
                          opacity: loadingUsuarios ? 0.7 : 1,
                          cursor: loadingUsuarios ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {tiendaSeleccionada ? (
                          (() => {
                            for (const user of usuariosTienda) {
                              const tienda = user.tiendas?.find(t => t.id_tienda === tiendaSeleccionada);
                              if (tienda) {
                                return <span>🏪 {tienda.nombre_tienda}</span>;
                              }
                            }
                            return <span>Selecciona una tienda...</span>;
                          })()
                        ) : (
                          <span>Selecciona una tienda...</span>
                        )}
                        <span className="dropdown-arrow">▼</span>
                      </button>

                      {showTiendaMenu && !loadingUsuarios && (
                        <div className="dropdown-menu">
                          {filtrarUsuariosPorNevera(usuariosTienda, busquedaNevera).map(user => {
                            const tiendasFiltradas = user.tiendas?.filter(t => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada) || [];
                            if (tiendasFiltradas.length === 0) return null;

                            return tiendasFiltradas.map(tienda => {
                              const tienePendientes = tienda.neveras?.some(nevera => nevera.pendientes_pago) || false;

                              return (
                                <div key={tienda.id_tienda} className="dropdown-item">
                                  <span className="mes-fecha" style={{ color: tienePendientes ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                                    🏪 {tienda.nombre_tienda}
                                    {tienePendientes && <span style={{ color: 'var(--color-error)', fontWeight: 'bold', marginLeft: '8px' }}>💰 Pendientes</span>}
                                  </span>
                                  <button
                                    className={`btn-consultar ${tiendaSeleccionada === tienda.id_tienda ? 'activo' : ''}`}
                                    onClick={() => {
                                      setTiendaSeleccionada(tienda.id_tienda);
                                      setNeveraSeleccionada(null);
                                      setTransacciones(null);
                                      setShowTiendaMenu(false);
                                    }}
                                    disabled={loading}
                                  >
                                    {loading && tiendaSeleccionada === tienda.id_tienda ? 'Cargando...' : 'Seleccionar'}
                                  </button>
                                </div>
                              );
                            });
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {loading && tiendaSeleccionada && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Consultando transacciones...</span>
              </div>
            )}
            
            {!loading && tiendaSeleccionada && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                {(() => {
                  let userOfStore: UsuarioTienda | undefined;
                  let store: Tienda | undefined;
                  for (const u of usuariosTienda) {
                    const found = u.tiendas?.find(t => t.id_tienda === tiendaSeleccionada);
                    if (found) {
                      userOfStore = u;
                      store = found;
                      break;
                    }
                  }
                  return userOfStore && store ? (
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                        🏪 {store.nombre_tienda}
                      </h4>
                      <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        <strong>Dirección:</strong> {store.direccion} - {store.ciudad}, {store.departamento} <br/>
                        <strong>Usuario:</strong> {userOfStore.nombre_usuario} {userOfStore.apellido_usuario} (ID: {userOfStore.id_usuario}) <br/>
                        <strong>Contacto:</strong> {userOfStore.email} | {userOfStore.celular}
                      </p>

                      <div style={{ marginTop: '1rem' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                          ❄️ Neveras ({store.neveras?.length || 0})
                        </h5>
                        {store.neveras && store.neveras.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {store.neveras.map(nevera => (
                              <div
                                key={nevera.id_nevera}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: nevera.pendientes_pago ? 'var(--color-error-bg)' : (nevera.id_estado_nevera === 2 ? 'var(--color-success-bg)' : 'var(--color-error-bg)'),
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    color: nevera.pendientes_pago ? 'var(--color-error)' : (nevera.id_estado_nevera === 2 ? 'var(--color-success)' : 'var(--color-error)'),
                                    fontSize: '1.2rem'
                                  }}>
                                    ❄️
                                  </span>
                                  <div>
                                    <div style={{
                                      color: 'var(--color-text-primary)',
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem'
                                    }}>
                                      ID: {nevera.id_nevera}
                                    </div>
                                    <div style={{
                                      color: nevera.pendientes_pago ? 'var(--color-error)' : (nevera.id_estado_nevera === 2 ? 'var(--color-success)' : 'var(--color-error)'),
                                      fontSize: '0.8rem',
                                      fontWeight: '500'
                                    }}>
                                      {nevera.id_estado_nevera === 2 ? '✅ Activa' : '❌ Inactiva'} {nevera.pendientes_pago ? '💰 Pendientes' : '✅ Al día'}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  className={`btn-consultar ${neveraSeleccionada === nevera.id_nevera ? 'activo' : ''}`}
                                  onClick={() => {
                                    setNeveraSeleccionada(nevera.id_nevera);
                                    cargarTransacciones(userOfStore.id_usuario, nevera.id_nevera);
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    minWidth: '100px',
                                    backgroundColor: 'var(--color-success)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                  }}
                                >
                                  {loading && neveraSeleccionada === nevera.id_nevera ? 'Consultando...' : 'Consultar'}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            No hay neveras registradas para esta tienda.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      </div>

      {/* Contenido principal después de los selectores */}

      {/* Resumen financiero */}
      {transacciones && tiendaSeleccionada && neveraSeleccionada && transacciones.transacciones && (() => {
           const pendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').length;
           const consolidados = transacciones.transacciones.filter(t => t.nombre_tipo_transaccion === 'ticket_consolidado').length;
           const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
           const montoTotalMes = transacciones.transacciones.filter(t =>
             t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
           ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + t.monto, 0);
           const montoTiendaMes = transacciones.transacciones.filter(t =>
             t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
           ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + (t.costo_tienda || 0), 0);
           const saldoALiquidar = transacciones?.empaques?.length ? saldoTotalLiquidar : 0;

           return (
            <div className="resumen-financiero">
              <div className="resumen-item">
                <span className="resumen-label">📊 Total Transacciones:</span>
                <span className="resumen-value">{transacciones.total_transacciones}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">⏳ Pendientes:</span>
                <span className="resumen-value">{transacciones?.empaques?.length || pendientes}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">✅ Consolidados:</span>
                <span className="resumen-value">{consolidados}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">💰 Saldo Total (Pendientes):</span>
                <span className="resumen-value">
                  {formatMoneda(saldoTotalPendientes + saldoALiquidar)}
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">📅 Monto del Mes:</span>
                <span className="resumen-value">
                  {formatMoneda(montoTotalMes)}
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">🏪 Monto Tienda Mes:</span>
                <span className="resumen-value">
                  {formatMoneda(montoTiendaMes)}
                </span>
              </div>
            </div>
          );
        })()}

      {/* Mensajes de éxito y error */}
      {successMessage && (
        <div className="success-message" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}>
          <div className="success-content">
            <span className="success-icon">✅</span>
            <p>{successMessage}</p>
            <button
              className="success-close-btn"
              onClick={() => setSuccessMessage(null)}
              style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button
              className="error-retry-btn"
              onClick={() => {
                setError(null);
                if (tiendaSeleccionada && neveraSeleccionada) {
                  // Encontrar el ID del usuario de la tienda seleccionada
                  let userId = null;
                  for (const u of usuariosTienda) {
                    const found = u.tiendas?.find(t => t.id_tienda === tiendaSeleccionada);
                    if (found) {
                      userId = u.id_usuario;
                      break;
                    }
                  }
                  if (userId) {
                    cargarTransacciones(userId, neveraSeleccionada);
                  }
                }
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {transacciones && (
        <div className="transacciones-container">
          <TablaTransacciones
            data={transacciones}
            loading={loading}
            error={error}
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={consultarMesEspecifico}
            esFrigorifico={esTienda || puedeVerOtrasTiendas}
          />
        </div>
      )}

      {/* Tabla de empaques pendientes para la nevera seleccionada */}
      {neveraSeleccionada && (
        <div className="empaques-container" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            📦 Empaques Pendientes de Liquidación
          </h3>

          {loadingCuentaNevera ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner" style={{ width: '30px', height: '30px', margin: '0 auto 1rem' }}></div>
              <p>Cargando empaques pendientes...</p>
            </div>
          ) : !transacciones?.empaques?.length ? (
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              No hay empaques pendientes para liquidar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {transacciones.productos?.map(producto => {
                const empaquesProducto = transacciones.empaques?.filter(e => e.id_producto === producto.id_producto) || [];
                const precioTiendaPorcentaje = parseFloat(producto.precio_tienda) || 0;

                const calcularLiquidar = (empaque: EmpaquePendiente) => {
                  const precioVenta = empaque.precio_venta_total;
                  let descuento = 0;
                  let precioConDescuento = precioVenta;

                  if (empaque.promocion) {
                    const promo = transacciones.promociones?.find((p: Promocion) => p.id_promocion === empaque.promocion);
                    if (promo && promo.valor > 0) {
                      descuento = Math.ceil(precioVenta * (promo.valor / 100));
                      precioConDescuento = precioVenta - descuento;
                    }
                  }

                  const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
                  const liquidar = Math.ceil(precioConDescuento - tiendaComision);

                  return { descuento, precioConDescuento, tiendaComision, liquidar };
                };

                const totalPrecio = empaquesProducto.reduce((sum, e) => sum + e.precio_venta_total, 0);
                const totalDescuento = empaquesProducto.reduce((sum, e) => sum + calcularLiquidar(e).descuento, 0);
                const totalComision = empaquesProducto.reduce((sum, e) => sum + calcularLiquidar(e).tiendaComision, 0);
                const totalLiquidar = empaquesProducto.reduce((sum, e) => sum + calcularLiquidar(e).liquidar, 0);
                const isExpanded = expandedProductos.has(producto.id_producto);

                return (
                  <div
                    key={producto.id_producto}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const newExpanded = new Set(expandedProductos);
                        if (newExpanded.has(producto.id_producto)) {
                          newExpanded.delete(producto.id_producto);
                        } else {
                          newExpanded.add(producto.id_producto);
                        }
                        setExpandedProductos(newExpanded);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: 'var(--color-hover-bg)',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                          {producto.nombre_producto} (ID: {producto.id_producto})
                        </span>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          <span>{empaquesProducto.length} empaques</span>
                          <span>Comision Tienda: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalComision)}</span>
                          <span>Venta: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPrecio)}</span>
                          <span style={{ color: totalDescuento > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                            Desc: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalDescuento)}
                          </span>
                          <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                            Liquidar: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalLiquidar)}
                          </span>
                        </div>
                      </div>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '1rem', backgroundColor: 'var(--color-card-bg)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                              <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>ID</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Precio Venta</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Desc</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Venta Final</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Comision Tienda</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Liquidar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empaquesProducto.map((empaque, index) => {
                              const { descuento, precioConDescuento, tiendaComision, liquidar } = calcularLiquidar(empaque);
                              const promoAplicada = empaque.promocion ? transacciones.promociones?.find((p: Promocion) => p.id_promocion === empaque.promocion) : null;
                              return (
                                <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  <td style={{ padding: '0.5rem', color: 'var(--color-text-primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span>{empaque.id_empaque}</span>
                                      {promoAplicada && (
                                        <span
                                          title={`${promoAplicada.nombre} (${promoAplicada.valor}%)`}
                                          style={{
                                            backgroundColor: 'var(--color-success)',
                                            color: 'white',
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            cursor: 'help'
                                          }}
                                        >
                                          -{promoAplicada.valor}%
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-text-primary)' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(empaque.precio_venta_total)}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: totalDescuento > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                    {descuento > 0 ? (
                                      <span title={`${transacciones.promociones?.find((p: Promocion) => p.id_promocion === empaque.promocion)?.nombre || 'Descuento'} (${transacciones.promociones?.find((p: Promocion) => p.id_promocion === empaque.promocion)?.valor}%)`}>
                                        -{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(descuento)}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-success)' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precioConDescuento)}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-error)' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(tiendaComision)}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '600' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(liquidar)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>TOTAL</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPrecio)}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalDescuento)}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPrecio - totalDescuento)}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-error)' }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalComision)}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalLiquidar)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        {precioTiendaPorcentaje > 0 && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                            * Comisión tienda: {precioTiendaPorcentaje}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--color-success)',
                  color: 'white',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                TOTAL A LIQUIDAR: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(
                  transacciones.empaques?.reduce((sum, e) => {
                    const precioTiendaPorcentaje = parseFloat(transacciones.productos?.find((p: ProductoPendiente) => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
                    let descuento = 0;
                    let precioConDescuento = e.precio_venta_total;
                    if (e.promocion) {
                      const promo = transacciones.promociones?.find(p => p.id_promocion === e.promocion);
                      if (promo && promo.valor > 0) {
                        descuento = Math.ceil(e.precio_venta_total * (promo.valor / 100));
                        precioConDescuento = e.precio_venta_total - descuento;
                      }
                    }
                    const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
                    return sum + (precioConDescuento - tiendaComision);
                  }, 0) || 0
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!tiendaSeleccionada && !loading && !error && (
        <div className="no-selection-message" style={{ zIndex: 0, position: 'relative' }}>
          <div className="no-selection-content">
            <span className="no-selection-icon">📋</span>
            <h3>Selecciona una tienda para ver sus neveras</h3>
            <p>
              Elige una tienda de la lista desplegable para ver sus neveras y consultar
              las transacciones de cada una.
            </p>
            {usuariosTienda.length === 0 && (
              <div className="no-users-warning">
                <p>
                  <strong>Nota:</strong> No se encontraron tiendas relacionadas.
                  Esto puede indicar que no tienes permisos para ver estos datos.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

{puedeVerOtrasTiendas && tiendaSeleccionada && neveraSeleccionada && transacciones && (() => {
        return (
          <div className="pago-abono-section" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>💰 Gestión de Cobro</h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Total a Cobrar:</strong> <span style={{ fontSize: '1.2em', color: saldoTotalLiquidar > 0 ? 'var(--color-success)' : (saldoTotalLiquidar < 0 ? 'var(--color-error)' : 'var(--color-success)') }}>{formatMoneda(saldoTotalLiquidar)}</span>
              {saldoTotalLiquidar === 0 && (
                <span style={{ color: 'var(--color-success)', marginLeft: '0.5rem' }}>(✅ Sin deuda pendiente)</span>
              )}
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ color: 'var(--color-text-primary)' }}>
                Tipo de Transacción:
              </label>
              <div className="meses-dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={() => setShowTipoMenu(!showTipoMenu)}
                  style={{
                    opacity: 1,
                    cursor: 'pointer',
                    minWidth: '200px'
                  }}
                >
                  <span>
                    {tipoPago === 'pago' ? 'Cobro Total' : 'Abono'}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {showTipoMenu && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">
                      <span className="mes-fecha">Cobro Total</span>
                      <button
                        className={`btn-consultar ${tipoPago === 'pago' ? 'activo' : ''}`}
                        onClick={() => {
                          setTipoPago('pago');
                          setShowTipoMenu(false);
                        }}
                      >
                        Seleccionar
                      </button>
                    </div>
                    <div className="dropdown-item">
                      <span className="mes-fecha">Abono</span>
                      <button
                        className={`btn-consultar ${tipoPago === 'abono' ? 'activo' : ''}`}
                        onClick={() => {
                          setTipoPago('abono');
                          setShowTipoMenu(false);
                        }}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {tipoPago && (
              tipoPago === 'pago' ? (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Monto a Cobrar:</strong>
                    <div style={{ fontSize: '2em', color: 'var(--color-success)', marginTop: '0.5rem' }}>
                      {formatMoneda(saldoTotalLiquidar)}
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                      Nota:
                    </label>
                    <input
                      type="text"
                      value={notaPago}
                      onChange={(e) => setNotaPago(e.target.value)}
                      placeholder={`cobro total hecho por el usuario logistica ${user?.name || ''}`}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                      Monto del Abono:
                    </label>
                    <input
                      type="number"
                      value={montoPago || ''}
                      onChange={(e) => setMontoPago(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                      Nota:
                    </label>
                    <input
                      type="text"
                      value={notaPago}
                      onChange={(e) => setNotaPago(e.target.value)}
                      placeholder="Nota opcional para el abono"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    />
                  </div>
                </div>
              )
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                manejarPago();
                return false;
              }}
              disabled={procesandoPago}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: procesandoPago ? 'not-allowed' : 'pointer',
                opacity: procesandoPago ? 0.7 : 1,
                width: 'auto',
                display: 'inline-block',
                pointerEvents: procesandoPago ? 'none' : 'auto',
                outline: 'none'
              }}
            >
              {procesandoPago ? 'Procesando...' : 'Cobrar'}
            </button>
          </div>
        );
      })()}
    </div>
  );
};

export default CuentasTiendaPage;