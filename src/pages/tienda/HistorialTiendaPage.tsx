import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getHistorialTienda, getTiendasSobrinas } from '../../services/api';
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
  costo_tienda: number | null;
  hora_transaccion?: string;
  nombre_tipo_transaccion: string;
  nombre_estado_transaccion?: string;
  nota_opcional: string;
  info_pago?: {
    id_usuario_pago: number;
    nombre_usuario_pago: string;
    nota_opcional_pago: string;
  };
}

interface HistorialNeveraData {
  nevera: {
    id_nevera: number;
    id_tienda: number;
    nombre_tienda: string;
  };
  empaques: EmpaquePendiente[];
  productos: ProductoPendiente[];
  promociones: Promocion[];
  transacciones: Transaccion[];
  total_transacciones: number;
}

interface HistorialTiendaResponse {
  neveras: HistorialNeveraData[];
  fecha_creacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  periodo: { mes: number; año: number };
  fecha_inicio_periodo?: string;
  fecha_fin_periodo?: string;
  parametros_usados?: {
    mes_pedido: number | null;
    año_pedido: number | null;
    mes_devuelto: number | null;
    año_devuelto: number | null;
    es_periodo_actual: boolean;
  };
}

interface TicketConsolidado {
  ticket: Transaccion;
  productos: Transaccion[];
}

const HistorialTiendaPage: React.FC = () => {
  const { user } = useAuth();

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

  const [mesesHistoricos, setMesesHistoricos] = useState<Array<{ mes: number; año: number; fecha: string }>>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; año: number } | null>(null);
  const [showMesesMenu, setShowMesesMenu] = useState(false);

  const [expandedNeveras, setExpandedNeveras] = useState<Set<number>>(new Set());
  const [expandedConsolidados, setExpandedConsolidados] = useState<Set<number>>(new Set());
  const [expandedProductos, setExpandedProductos] = useState<Set<string>>(new Set());

  const esTienda = user?.role === 'tienda';
  const esLogistica = user?.role === 'logistica';
  const esAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const puedeVerSelector = esAdmin || esLogistica;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
        setShowMesesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generarMesesHistoricos = (fechaCreacion: string) => {
    const fechaInicio = new Date(fechaCreacion);
    const fechaActual = new Date();
    const meses = [];
    const fechaTemp = new Date(fechaInicio);
    while (fechaTemp <= fechaActual) {
      meses.push({
        mes: fechaTemp.getMonth() + 1,
        año: fechaTemp.getFullYear(),
        fecha: fechaTemp.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      });
      fechaTemp.setMonth(fechaTemp.getMonth() + 1);
    }
    return meses.reverse();
  };

  useEffect(() => {
    if (puedeVerSelector && user) {
      setLoadingUsuarios(true);
      cargarUsuariosTienda();
    }
  }, [puedeVerSelector, user?.id]);

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
    if (esTienda && user) {
      cargarHistorial(parseInt(user.id), mesSeleccionado?.mes, mesSeleccionado?.año);
    }
  }, [esTienda, user?.id]);

  const cargarUsuariosTienda = async () => {
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
  };

  const cargarHistorial = async (idUsuario: number, mes?: number, año?: number) => {
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
  };

  const buscarNevera = () => {
    if (!busquedaNevera.trim()) return;
    const neveraId = parseInt(busquedaNevera.trim());
    if (isNaN(neveraId)) {
      alert('Por favor ingresa un ID válido.');
      return;
    }
    for (const u of usuariosTienda) {
      for (const t of u.tiendas) {
        const nevera = t.neveras?.find(n => n.id_nevera === neveraId);
        if (nevera) {
          setUsuarioSeleccionado(u.id_usuario);
          cargarHistorial(u.id_usuario, mesSeleccionado?.mes, mesSeleccionado?.año);
          setBusquedaNevera('');
          return;
        }
      }
    }
    alert('Nevera no encontrada con ese ID.');
  };

  const consultarMesEspecifico = (mes: number, año: number) => {
    setMesSeleccionado({ mes, año });

    if (esTienda && user?.id) {
      cargarHistorial(parseInt(user.id), mes, año);
    } else if (puedeVerSelector && usuarioSeleccionado) {
      cargarHistorial(usuarioSeleccionado, mes, año);
    }
  };

  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const toggleNevera = (id: number) => {
    const next = new Set(expandedNeveras);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNeveras(next);
  };

  const toggleConsolidado = (id: number) => {
    const next = new Set(expandedConsolidados);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedConsolidados(next);
  };

  const toggleProducto = (key: string) => {
    const next = new Set(expandedProductos);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedProductos(next);
  };

  const agruparConsolidados = (transacciones: Transaccion[]): TicketConsolidado[] => {
    const consolidadosMap = new Map<number, TicketConsolidado>();
    transacciones.forEach(t => {
      if (t.nombre_tipo_transaccion === 'ticket_consolidado') {
        consolidadosMap.set(t.id_transaccion, { ticket: t, productos: [] });
      } else if (t.nombre_estado_transaccion === 'PAGADO' && t.id_transaccion_rel) {
        const consolidado = consolidadosMap.get(t.id_transaccion_rel);
        if (consolidado) consolidado.productos.push(t);
      }
    });
    return Array.from(consolidadosMap.values());
  };

  const filtrarPendientes = (transacciones: Transaccion[]): Transaccion[] => {
    return transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE');
  };

  const calcularLiquidacion = (
    empaque: EmpaquePendiente,
    precioTiendaPorcentaje: number,
    promociones: Promocion[]
  ) => {
    let descuento = 0;
    let precioConDescuento = empaque.precio_venta_total;
    if (empaque.promocion) {
      const promo = promociones.find(p => p.id_promocion === empaque.promocion);
      if (promo && promo.valor > 0) {
        descuento = Math.ceil(empaque.precio_venta_total * (promo.valor / 100));
        precioConDescuento = empaque.precio_venta_total - descuento;
      }
    }
    const tiendaComision = Math.ceil(precioConDescuento * (precioTiendaPorcentaje / 100));
    const liquidar = Math.ceil(precioConDescuento - tiendaComision);
    return { descuento, precioConDescuento, tiendaComision, liquidar };
  };

  const infoUsuario = historial;
  const neveras = historial?.neveras || [];

  const resumenGlobal = (() => {
    if (!historial?.neveras) return null;
    let totalEmpaquesPendientes = 0;
    let totalConsolidados = 0;
    let montoTotalEmpaques = 0;
    let montoTotalConsolidados = 0;
    let montoTotalPendientes = 0;

    historial.neveras.forEach(n => {
      totalEmpaquesPendientes += n.empaques?.length || 0;
      const consolidados = agruparConsolidados(n.transacciones);
      totalConsolidados += consolidados.length;
      montoTotalEmpaques += n.empaques?.reduce((sum, e) => {
        const precioTienda = parseFloat(n.productos?.find(p => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
        const { liquidar } = calcularLiquidacion(e, precioTienda, n.promociones);
        return sum + liquidar;
      }, 0) || 0;
      montoTotalConsolidados += consolidados.reduce((sum, c) => sum + (c.ticket.monto || 0), 0);
      montoTotalPendientes += filtrarPendientes(n.transacciones).reduce((sum, t) => sum + (t.monto || 0), 0);
    });

    return {
      totalNeveras: historial.neveras.length,
      totalEmpaquesPendientes,
      totalConsolidados,
      montoTotalEmpaques,
      montoTotalConsolidados,
      montoTotalPendientes
    };
  })();

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
        <h1>Historial Tienda</h1>
        <p className="subtitle">
          Consulta el historial completo de movimientos por nevera en el mes seleccionado
        </p>

        {puedeVerSelector && (
          <div className="usuario-selector">
            <div className="selector-container">
              <h3 style={{ color: 'var(--color-text-primary)' }}>SELECCIONAR USUARIO TIENDA:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ flex: '1 1 100%', marginBottom: '1rem' }}>
                  <label className="selector-label">🔍 Buscar por ID de Nevera:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="usuario-select"
                      value={busquedaNevera}
                      onChange={e => setBusquedaNevera(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); buscarNevera(); }
                      }}
                      placeholder="Ingresa el ID de la nevera..."
                      style={{
                        flex: '1', padding: '0.75rem', borderRadius: '4px',
                        border: '2px solid #666',
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text-primary)',
                        fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', outline: 'none'
                      }}
                    />
                    <button
                      className="btn-consultar"
                      onClick={buscarNevera}
                      disabled={!busquedaNevera.trim() || loading}
                      style={{
                        backgroundColor: 'var(--color-success)', color: 'white',
                        border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px',
                        cursor: (!busquedaNevera.trim() || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!busquedaNevera.trim() || loading) ? 0.5 : 1,
                        fontSize: '1rem', fontWeight: '500'
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
                        }}
                        disabled={loadingUsuarios}
                        style={{ opacity: loadingUsuarios ? 0.7 : 1, cursor: loadingUsuarios ? 'not-allowed' : 'pointer' }}
                      >
                        {ciudadSeleccionada
                          ? `${ciudades.find(c => c.nombre_ciudad === ciudadSeleccionada)?.nombre_ciudad || ciudadSeleccionada} - ${ciudades.find(c => c.nombre_ciudad === ciudadSeleccionada)?.departamento || ''}`
                          : <span>Selecciona una ciudad...</span>}
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
                                setUsuarioSeleccionado(null);
                                setHistorial(null);
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
                                  setUsuarioSeleccionado(null);
                                  setHistorial(null);
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
                    <label className="selector-label">2. Seleccionar Usuario Tienda:</label>
                    <div className="meses-dropdown">
                      <button
                        className="dropdown-toggle"
                        onClick={() => setShowTiendaMenu(!showTiendaMenu)}
                        disabled={loadingUsuarios}
                        style={{ opacity: loadingUsuarios ? 0.7 : 1, cursor: loadingUsuarios ? 'not-allowed' : 'pointer' }}
                      >
                        {usuarioSeleccionado
                          ? (() => {
                              const u = usuariosTienda.find(ut => ut.id_usuario === usuarioSeleccionado);
                              if (u) return <span>👤 {u.nombre_usuario} {u.apellido_usuario} (ID: {u.id_usuario})</span>;
                              return <span>Selecciona un usuario...</span>;
                            })()
                          : <span>Selecciona un usuario...</span>}
                        <span className="dropdown-arrow">▼</span>
                      </button>
                      {showTiendaMenu && !loadingUsuarios && (
                        <div className="dropdown-menu">
                          {usuariosTienda.map(u => {
                            const tiendasFiltradas = u.tiendas?.filter(t => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada) || [];
                            if (tiendasFiltradas.length === 0) return null;
                            const totalNeveras = tiendasFiltradas.reduce((sum, t) => sum + (t.neveras?.length || 0), 0);
                            return (
                              <div key={u.id_usuario} className="dropdown-item">
                                <span className="mes-fecha">
                                  👤 {u.nombre_usuario} {u.apellido_usuario} (ID: {u.id_usuario})
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                                    {tiendasFiltradas.length} tienda{tiendasFiltradas.length !== 1 ? 's' : ''} · {totalNeveras} nevera{totalNeveras !== 1 ? 's' : ''}
                                  </span>
                                </span>
                                <button
                                  className={`btn-consultar ${usuarioSeleccionado === u.id_usuario ? 'activo' : ''}`}
                                  onClick={() => {
                                    setUsuarioSeleccionado(u.id_usuario);
                                    setHistorial(null);
                                    setShowTiendaMenu(false);
                                    cargarHistorial(u.id_usuario, mesSeleccionado?.mes, mesSeleccionado?.año);
                                  }}
                                  disabled={loading}
                                >
                                  {loading && usuarioSeleccionado === u.id_usuario ? 'Consultando...' : 'Seleccionar'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {loading && usuarioSeleccionado && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                  <span>Consultando historial...</span>
                </div>
              )}

              {!loading && usuarioSeleccionado && (() => {
                const userSelected = usuariosTienda.find(u => u.id_usuario === usuarioSeleccionado);
                if (!userSelected) return null;
                const tiendasVisibles = userSelected.tiendas?.filter(t => !ciudadSeleccionada || t.ciudad === ciudadSeleccionada) || [];
                return (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                      👤 {userSelected.nombre_usuario} {userSelected.apellido_usuario} (ID: {userSelected.id_usuario})
                    </h4>
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      <strong>Contacto:</strong> {userSelected.email} | {userSelected.celular}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {tiendasVisibles.map(store => (
                        <div key={store.id_tienda} style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                          <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>🏪 {store.nombre_tienda}</h5>
                          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                            {store.direccion} — {store.ciudad}, {store.departamento}
                          </p>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            <strong>❄️ Neveras:</strong> {store.neveras?.length || 0}
                            {store.neveras && store.neveras.length > 0 && (
                              <span style={{ marginLeft: '0.5rem' }}>
                                {store.neveras.map((n, i) => (
                                  <span key={n.id_nevera} style={{
                                    display: 'inline-block', marginRight: '0.35rem',
                                    padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.75rem',
                                    backgroundColor: n.id_estado_nevera === 2 ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                                    color: n.id_estado_nevera === 2 ? 'var(--color-success)' : 'var(--color-error)'
                                  }}>
                                    #{n.id_nevera}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

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
            <button className="error-retry-btn" onClick={() => setError(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {historial && infoUsuario && (
        <div className="tabla-transacciones">
          <div className="transacciones-header">
            <div className="user-info">
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                {infoUsuario.nombre_usuario} {infoUsuario.apellido_usuario}
              </div>
              <p className="periodo-info">
                Período: {infoUsuario.periodo.mes}/{infoUsuario.periodo.año}
                {infoUsuario.parametros_usados?.es_periodo_actual && <span className="badge-actual">ACTUAL</span>}
              </p>
              {mesesHistoricos.length > 0 && (
                <div className="meses-dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setShowMesesMenu(!showMesesMenu)}
                  >
                    {mesSeleccionado
                      ? `${mesesHistoricos.find(m => m.mes === mesSeleccionado.mes && m.año === mesSeleccionado.año)?.fecha || 'Consultar Meses Anteriores'}`
                      : 'Consultar Meses Anteriores'}
                    <span className={`dropdown-arrow ${showMesesMenu ? 'open' : ''}`}>▼</span>
                  </button>
                  {showMesesMenu && (
                    <div className="dropdown-menu">
                      {mesesHistoricos.map(mesItem => (
                        <div key={`${mesItem.mes}-${mesItem.año}`} className="dropdown-item">
                          <span className="mes-fecha">{mesItem.fecha}</span>
                          <button
                            className={`btn-consultar ${mesSeleccionado?.mes === mesItem.mes && mesSeleccionado?.año === mesItem.año ? 'activo' : ''}`}
                            onClick={() => {
                              consultarMesEspecifico(mesItem.mes, mesItem.año);
                              setShowMesesMenu(false);
                            }}
                            disabled={loading}
                          >
                            {loading && mesSeleccionado?.mes === mesItem.mes && mesSeleccionado?.año === mesItem.año ? 'Consultando...' : 'Consultar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="summary-info" />
            </div>
          </div>

          {resumenGlobal && neveras.length > 0 && (
            <div className="resumen-financiero">
              <div className="resumen-item">
                <span className="resumen-label">❄️ Total Neveras</span>
                <span className="resumen-value">{resumenGlobal.totalNeveras}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">📦 Empaques Pendientes</span>
                <span className="resumen-value">
                  {resumenGlobal.totalEmpaquesPendientes}
                  <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    {formatMoneda(resumenGlobal.montoTotalEmpaques)}
                  </span>
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">✅ Consolidados</span>
                <span className="resumen-value">
                  {resumenGlobal.totalConsolidados}
                  <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    {formatMoneda(resumenGlobal.montoTotalConsolidados)}
                  </span>
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">💰 Monto Pendientes</span>
                <span className="resumen-value">
                  {formatMoneda(resumenGlobal.montoTotalPendientes)}
                </span>
              </div>
            </div>
          )}

          {neveras.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              <p>No se encontraron neveras con movimientos en este período.</p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {neveras.map(neveraData => {
              const isExpanded = expandedNeveras.has(neveraData.nevera.id_nevera);
              const consolidados = agruparConsolidados(neveraData.transacciones);
              const pendientes = filtrarPendientes(neveraData.transacciones);

              const totalEmpaques = neveraData.empaques?.reduce((sum, e) => {
                const precioTienda = parseFloat(neveraData.productos?.find(p => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
                const { liquidar } = calcularLiquidacion(e, precioTienda, neveraData.promociones);
                return sum + liquidar;
              }, 0) || 0;

              const totalConsolidados = consolidados.reduce((sum, c) => sum + (c.ticket.monto || 0), 0);
              const totalPendientesTransacciones = pendientes.reduce((sum, t) => sum + (t.monto || 0), 0);

              return (
                <div
                  key={neveraData.nevera.id_nevera}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-card-bg)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleNevera(neveraData.nevera.id_nevera)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem 1.5rem', border: 'none', cursor: 'pointer',
                      backgroundColor: 'var(--color-hover-bg)',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>
                        ❄️ Nevera #{neveraData.nevera.id_nevera} — {neveraData.nevera.nombre_tienda}
                      </h3>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        <span>📦 {neveraData.empaques?.length || 0} empaques pendientes</span>
                        <span>✅ {consolidados.length} consolidados</span>
                        <span>⏳ {pendientes.length} transacciones pendientes</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-primary)' }}>
                          📦 Empaques Pendientes de Liquidación
                        </h4>
                        {!neveraData.empaques?.length ? (
                          <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            No hay empaques pendientes para liquidar.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {neveraData.productos?.map(producto => {
                              const empaquesProducto = neveraData.empaques?.filter(e => e.id_producto === producto.id_producto) || [];
                              if (empaquesProducto.length === 0) return null;
                              const precioTiendaPorcentaje = parseFloat(producto.precio_tienda) || 0;
                              const totalPrecio = empaquesProducto.reduce((s, e) => s + e.precio_venta_total, 0);
                              const { descuento: td, precioConDescuento: tpcd, tiendaComision: tcom, liquidar: tliq } = empaquesProducto.reduce((acc, e) => {
                                const r = calcularLiquidacion(e, precioTiendaPorcentaje, neveraData.promociones);
                                return {
                                  descuento: acc.descuento + r.descuento,
                                  precioConDescuento: acc.precioConDescuento + r.precioConDescuento,
                                  tiendaComision: acc.tiendaComision + r.tiendaComision,
                                  liquidar: acc.liquidar + r.liquidar
                                };
                              }, { descuento: 0, precioConDescuento: 0, tiendaComision: 0, liquidar: 0 });
                              const key = `${neveraData.nevera.id_nevera}_${producto.id_producto}`;
                              const isProdExpanded = expandedProductos.has(key);

                              return (
                                <div key={key} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                                  <button
                                    type="button"
                                    onClick={() => toggleProducto(key)}
                                    style={{
                                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '0.75rem 1rem', backgroundColor: 'var(--color-bg)',
                                      border: 'none', cursor: 'pointer', textAlign: 'left'
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                                        {producto.nombre_producto} (ID: {producto.id_producto})
                                      </span>
                                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                        <span>{empaquesProducto.length} empaques</span>
                                        <span>Venta: {formatMoneda(totalPrecio)}</span>
                                        <span style={{ color: td > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                          Desc: {formatMoneda(td)}
                                        </span>
                                        <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                                          Liquidar: {formatMoneda(tliq)}
                                        </span>
                                      </div>
                                    </div>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{isProdExpanded ? '▲' : '▼'}</span>
                                  </button>
                                  {isProdExpanded && (
                                    <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-card-bg)' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>ID</th>
                                            <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Precio Venta</th>
                                            <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Desc</th>
                                            <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Venta Final</th>
                                            <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Comision</th>
                                            <th style={{ textAlign: 'right', padding: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Liquidar</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {empaquesProducto.map((empaque, idx) => {
                                            const r = calcularLiquidacion(empaque, precioTiendaPorcentaje, neveraData.promociones);
                                            const promoAplicada = empaque.promocion ? neveraData.promociones?.find(p => p.id_promocion === empaque.promocion) : null;
                                            return (
                                              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '0.4rem', color: 'var(--color-text-primary)' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span>{empaque.id_empaque}</span>
                                                    {promoAplicada && (
                                                      <span title={`${promoAplicada.nombre} (${promoAplicada.valor}%)`} style={{
                                                        backgroundColor: 'var(--color-success)', color: 'white',
                                                        padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.65rem',
                                                        fontWeight: 'bold', cursor: 'help'
                                                      }}>
                                                        -{promoAplicada.valor}%
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-text-primary)' }}>{formatMoneda(empaque.precio_venta_total)}</td>
                                                <td style={{ padding: '0.4rem', textAlign: 'right', color: r.descuento > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                                  {r.descuento > 0 ? `-${formatMoneda(r.descuento)}` : '-'}
                                                </td>
                                                <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-success)' }}>{formatMoneda(r.precioConDescuento)}</td>
                                                <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-error)' }}>{formatMoneda(r.tiendaComision)}</td>
                                                <td style={{ padding: '0.4rem', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '600' }}>{formatMoneda(r.liquidar)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                        <tfoot>
                                          <tr style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                                            <td style={{ padding: '0.4rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>TOTAL</td>
                                            <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{formatMoneda(totalPrecio)}</td>
                                            <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-warning)' }}>{formatMoneda(td)}</td>
                                            <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>{formatMoneda(tpcd)}</td>
                                            <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-error)' }}>{formatMoneda(tcom)}</td>
                                            <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatMoneda(tliq)}</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                      {precioTiendaPorcentaje > 0 && (
                                        <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                                          * Comisión tienda: {precioTiendaPorcentaje}%
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-primary)' }}>
                          ✅ Transacciones Consolidadas ({consolidados.length})
                        </h4>
                        {consolidados.length === 0 ? (
                          <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            No hay transacciones consolidadas en este período.
                          </p>
                        ) : (
                          <div className="consolidados-lista">
                            {consolidados.map(({ ticket, productos }) => {
                              const isConsExpanded = expandedConsolidados.has(ticket.id_transaccion);
                              const gananciaTienda = productos.reduce((s, p) => s + (p.costo_tienda || 0), 0);
                              return (
                                <div key={ticket.id_transaccion} className="consolidado-item">
                                  <div
                                    className={`consolidado-header ${isConsExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleConsolidado(ticket.id_transaccion)}
                                  >
                                    <div className="consolidado-info">
                                      <button className="expand-button">{isConsExpanded ? '▼' : '▶'}</button>
                                      <div className="consolidado-datos">
                                        <h4>Ticket #{ticket.id_transaccion}</h4>
                                        <p className="consolidado-monto">{formatMoneda(ticket.monto)}</p>
                                        <p className="consolidado-ganancia">Ganancia tienda: {formatMoneda(gananciaTienda)}</p>
                                        <p className="consolidado-fecha">{ticket.hora_transaccion ? formatFecha(ticket.hora_transaccion) : '-'}</p>
                                        <p className="consolidado-productos">
                                          {productos.length} producto{productos.length !== 1 ? 's' : ''} agrupado{productos.length !== 1 ? 's' : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="consolidado-badge">
                                      <span className="badge estado-consolidado">CONSOLIDADO</span>
                                    </div>
                                  </div>
                                  {ticket.info_pago && (
                                    <div className="info-pago-section" style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                      <h6 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>Información del Pago</h6>
                                      <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
                                        <strong>Cobrado por:</strong> {ticket.info_pago.nombre_usuario_pago} (ID: {ticket.info_pago.id_usuario_pago})
                                      </p>
                                      {ticket.info_pago.nota_opcional_pago && (
                                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                          <strong>Nota:</strong> {ticket.info_pago.nota_opcional_pago}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {isConsExpanded && (
                                    <div className="consolidado-detalle">
                                      <h5>Productos incluidos en este ticket:</h5>
                                      <div className="tabla-container">
                                        <table className="productos-table">
                                          <thead>
                                            <tr>
                                              <th>ID Transacción</th>
                                              <th>ID Empaque</th>
                                              <th>Monto</th>
                                              <th>Costo Tienda</th>
                                              <th>Fecha</th>
                                              <th>Nota</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {productos.map(prod => (
                                              <tr key={prod.id_transaccion} className="fila-pagada">
                                                <td className="id-cell">{prod.id_transaccion}</td>
                                                <td>{prod.id_empaque || '-'}</td>
                                                <td className="monto-cell">{formatMoneda(prod.monto)}</td>
                                                <td className="monto-cell">{formatMoneda(prod.costo_tienda ?? 0)}</td>
                                                <td>{prod.hora_transaccion ? formatFecha(prod.hora_transaccion) : '-'}</td>
                                                <td className="nota-cell">
                                                  <span className="nota-text">{prod.nota_opcional}</span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {pendientes.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-primary)' }}>
                            ⏳ Transacciones Pendientes ({pendientes.length})
                          </h4>
                          <div className="tabla-container">
                            <table className="transacciones-table">
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>ID Empaque</th>
                                  <th>Monto</th>
                                  <th>Costo Tienda</th>
                                  <th>Fecha</th>
                                  <th>Tipo</th>
                                  <th>Estado</th>
                                  <th>Nota</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pendientes.map(t => (
                                  <tr key={t.id_transaccion} className="fila-pendiente">
                                    <td className="id-cell">{t.id_transaccion}</td>
                                    <td>{t.id_empaque ? t.id_empaque : <span className="badge estado-pendiente">Saldo</span>}</td>
                                    <td className="monto-cell">{formatMoneda(t.monto)}</td>
                                    <td className="monto-cell">{formatMoneda(t.costo_tienda ?? 0)}</td>
                                    <td>{t.hora_transaccion ? formatFecha(t.hora_transaccion) : '-'}</td>
                                    <td><span className="badge tipo-venta">{t.nombre_tipo_transaccion}</span></td>
                                    <td><span className="badge estado-pendiente">PENDIENTE</span></td>
                                    <td className="nota-cell"><span className="nota-text">{t.nota_opcional}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div style={{
                        padding: '1rem', backgroundColor: 'var(--color-bg)',
                        borderRadius: '6px', border: '1px solid var(--color-border)'
                      }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-primary)' }}>
                          📋 Resumen Nevera #{neveraData.nevera.id_nevera}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ flex: '1 1 150px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>📦 Empaques Pendientes</span>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{neveraData.empaques?.length || 0} ({formatMoneda(totalEmpaques)})</div>
                          </div>
                          <div style={{ flex: '1 1 150px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>✅ Consolidados</span>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{consolidados.length} ({formatMoneda(totalConsolidados)})</div>
                          </div>
                          <div style={{ flex: '1 1 150px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>⏳ Pendientes</span>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{pendientes.length} ({formatMoneda(totalPendientesTransacciones)})</div>
                          </div>
                          <div style={{ flex: '1 1 150px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>💰 Total</span>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatMoneda(totalEmpaques + totalConsolidados + totalPendientesTransacciones)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!historial && !loading && !error && puedeVerSelector && !usuarioSeleccionado && (
        <div className="no-selection-message" style={{ zIndex: 0, position: 'relative' }}>
          <div className="no-selection-content">
            <span className="no-selection-icon">📋</span>
            <h3>Selecciona un usuario tienda para ver su historial</h3>
            <p>
              Elige un usuario de la lista desplegable para consultar el historial completo de movimientos.
            </p>
          </div>
        </div>
      )}

      {!historial && !loading && esTienda && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando historial de la tienda...</p>
        </div>
      )}
    </div>
  );
};

export default HistorialTiendaPage;
