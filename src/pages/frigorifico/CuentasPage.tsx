import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTransaccionesFrigorifico, getHermanos, procesarPago } from '../../services/api';
import TablaTransacciones from '../../components/TablaTransacciones';
import './CuentasPage.css';

interface UsuarioHermano {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: string;
  rol?: string;
}

interface TransaccionesData {
  transacciones: any[];
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

const CuentasPage: React.FC = () => {
  const { user } = useAuth();
  const [usuariosHermanos, setUsuariosHermanos] = useState<UsuarioHermano[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mesesHistoricos, setMesesHistoricos] = useState<Array<{mes: number, año: number, fecha: string}>>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{mes: number, año: number} | null>(null);
  const [showMesesMenu, setShowMesesMenu] = useState(false);
  const [tipoPago, setTipoPago] = useState<'pago' | 'abono' | ''>('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [notaPago, setNotaPago] = useState<string>('');
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [showTipoMenu, setShowTipoMenu] = useState(false);

  // Determinar el tipo de usuario
  const esFrigorifico = user?.role === 'frigorifico';
  const esLogistica = user?.role === 'logistica';

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
    if (esFrigorifico && user?.id) {
      // Para frigorífico: cargar directamente sus transacciones (mes actual)
      cargarTransacciones(parseInt(user.id));
    } else if ((esLogistica || user?.role === 'admin' || user?.role === 'superadmin') && user) {
      // Para logística y admin: cargar lista de frigoríficos para seleccionar
      setLoadingUsuarios(true);
      cargarUsuariosHermanos();
    }
  }, [esFrigorifico, esLogistica, user?.id, user?.role]);

  // Actualizar meses históricos cuando se cargan transacciones de frigorífico
  useEffect(() => {
    if ((esFrigorifico || esLogistica) && transacciones?.fecha_creacion_usuario) {
      const meses = generarMesesHistoricos(transacciones.fecha_creacion_usuario);
      setMesesHistoricos(meses);
      // Establecer mes actual como seleccionado
      if (meses.length > 0) {
        setMesSeleccionado({ mes: meses[0].mes, año: meses[0].año });
      }
    }
  }, [esFrigorifico, esLogistica, transacciones?.fecha_creacion_usuario]);

  // Actualizar monto de pago cuando cambie el tipo o las transacciones
  useEffect(() => {
    if (transacciones && tipoPago === 'pago') {
      const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
      setMontoPago(saldoTotalPendientes);
    } else if (tipoPago === 'abono') {
      setMontoPago(0);
    }
  }, [tipoPago, transacciones]);

  // Cargar usuarios hermanos (solo para roles administrativos)
  const cargarUsuariosHermanos = async () => {
    try {
      setLoadingUsuarios(true);
      setError(null);
      const data = await getHermanos();
      
      // Verificar la estructura de la respuesta - el backend retorna data.hermanos
      if (data.hermanos && Array.isArray(data.hermanos)) {
        setUsuariosHermanos(data.hermanos);
        console.log('Usuarios hermanos cargados:', data.hermanos);
      } else if (data.usuarios && Array.isArray(data.usuarios)) {
        // Fallback para compatibilidad
        setUsuariosHermanos(data.usuarios);
      } else if (Array.isArray(data)) {
        setUsuariosHermanos(data);
      } else {
        console.warn('Estructura de respuesta inesperada:', data);
        setUsuariosHermanos([]);
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Cargar transacciones cuando se selecciona un usuario y/o mes
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

  // Consultar transacciones de un mes específico
  const consultarMesEspecifico = (mes: number, año: number) => {
    if ((esFrigorifico && user?.id) || (esLogistica && usuarioSeleccionado)) {
      setMesSeleccionado({ mes, año });
      const userId = esFrigorifico ? parseInt(user.id) : usuarioSeleccionado;
      if (userId) {
        cargarTransacciones(userId, mes, año);
      }
    }
  };

  // Función para recargar datos del usuario seleccionado
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

  // Manejar el procesamiento del pago
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

    // Usar setTimeout para manejar el confirm de manera segura
    setTimeout(() => {
      if (!window.confirm(confirmMessage)) return;

      procesarPagoSeguro();
    }, 100);

    const procesarPagoSeguro = async () => {
      try {
        setProcesandoPago(true);
        // Redondear el monto antes de enviar
        const montoRedondeado = Math.round(montoFinal);
        const respuesta = await procesarPago(usuarioSeleccionado, montoRedondeado, undefined, notaFinal);
        
        // Verificar el tipo de operación
        const esAdelantoSinDeuda = respuesta.resumen?.tipo_operacion === 'adelanto_sin_deuda';
        
        // Actualizar transacciones localmente para mostrar inmediatamente
        if (transacciones) {
          const nuevasTransacciones = [...transacciones.transacciones];
          
          if (!esAdelantoSinDeuda) {
            // Manejo de pago normal con deuda
            // Agregar la nueva transacción consolidada
            nuevasTransacciones.push({
              ...respuesta,
              nombre_tipo_transaccion: 'ticket_consolidado',
              nombre_estado_transaccion: 'CONSOLIDADO'
            });
            // Cambiar estado de pendientes a PAGADO y agregar id_transaccion_rel
            nuevasTransacciones.forEach(t => {
              if (t.nombre_estado_transaccion === 'PENDIENTE') {
                t.nombre_estado_transaccion = 'PAGADO';
                t.id_transaccion_rel = respuesta.id_transaccion;
              }
            });
          } else {
            // Manejo de abono adelantado sin deuda
            nuevasTransacciones.push({
              ...respuesta,
              nombre_tipo_transaccion: 'abono_adelantado',
              nombre_estado_transaccion: 'ADELANTADO',
              id_transaccion_rel: respuesta.id_transaccion
            });
          }
          
          setTransacciones({ ...transacciones, transacciones: nuevasTransacciones });
        }
        
        // Resetear estados
        setTipoPago('');
        setMontoPago(0);
        setNotaPago('');
        
        // Mostrar mensaje de éxito detallado según el tipo de operación
        let mensajeDetallado = '';
        if (esAdelantoSinDeuda) {
          mensajeDetallado = `
✅ ${respuesta.message}

📋 RESUMEN DEL ABONO ADELANTADO:
👤 Usuario: ID ${respuesta.resumen.usuario_consolidado}
💸 Monto Abonado: $${respuesta.resumen.monto_abonado.toLocaleString()}
🏷️ Tipo: Abono Adelantado (Sin Deuda Pendiente)
          `.trim();
        } else {
          mensajeDetallado = `
✅ ${respuesta.message}

📋 RESUMEN DE LA CONSOLIDACIÓN:
👤 Usuario Consolidado: ID ${respuesta.resumen.usuario_consolidado}
💰 Usuario Acreedor: ID ${respuesta.resumen.usuario_acreedor}
💵 Monto Consolidado: $${respuesta.resumen.monto_consolidado.toLocaleString()}
💸 Monto Abonado: $${respuesta.resumen.monto_abonado.toLocaleString()}
          `.trim();
        }
        
        alert(mensajeDetallado);
        setSuccessMessage('Pago procesado exitosamente.');
        
        // Recargar datos del usuario seleccionado después del pago
        await recargarDatosUsuario();
        
        // Auto-ocultar mensaje después de 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        console.error('Error al procesar pago:', err);
        
        // Verificar si es un error específico del backend para abonos adelantados
        const errorMessage = err.response?.data?.message || err.message;
        if (errorMessage.includes('adelanto') || errorMessage.includes('sin deuda')) {
          setError('Error en el abono adelantado: ' + errorMessage);
        } else {
          setError('Error al procesar el pago: ' + errorMessage);
        }
        
        // Auto-ocultar error después de 5 segundos
        setTimeout(() => setError(null), 5000);
      } finally {
        setProcesandoPago(false);
      }
    };
  };


  // Obtener nombre completo del usuario con ID
  const getNombreCompleto = (usuario: UsuarioHermano) => {
    return `${usuario.nombre_usuario} ${usuario.apellido_usuario} (ID: ${usuario.id_usuario})`;
  };

  

  // Formatear moneda
  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  if (loadingUsuarios && !esFrigorifico) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        {esFrigorifico ? (
          <>
            <h1>Mis Cuentas Globales</h1>
            <p className="subtitle">
              Revisa tus transacciones de productos pendientes y consolidados
            </p>
          </>
        ) : (
          <>
            <h1>Cuentas Globales</h1>

            <p className="subtitle">
              Consulta las transacciones de productos pendientes y consolidados por usuario
            </p>
          </>
        )}
        

      {/* Menú desplegable de usuarios hermanos para logística y admin */}
      {(esLogistica || user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="usuario-selector">
          <div className="selector-container">
            <h3 style={{ color: 'var(--color-text-primary)' }}>
              SELECCIONAR FRIGORIFICO:
            </h3>
            {loadingUsuarios ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Cargando usuarios...</span>
              </div>
            ) : usuariosHermanos.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                No hay frigoríficos relacionados disponibles.
              </p>
            ) : (
              <div className="meses-dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={() => {
                    setShowMesesMenu(!showMesesMenu);
                  }}
                  disabled={loadingUsuarios}
                  style={{
                    opacity: loadingUsuarios ? 0.7 : 1,
                    cursor: loadingUsuarios ? 'not-allowed' : 'pointer'
                  }}
                >
                  {usuarioSeleccionado && usuariosHermanos.length > 0 ? (
                    <span>
                      {(() => {
                        const usuario = usuariosHermanos.find(u => u.id_usuario === usuarioSeleccionado);
                        return usuario ? `${getNombreCompleto(usuario)} ` : 'Selecciona un frigorífico...';
                      })()}
                    </span>
                  ) : (
                    <span>Selecciona un frigorífico...</span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showMesesMenu && !loadingUsuarios && (
                  <div className="dropdown-menu">
                    {usuariosHermanos.map(usuario => (
                      <div key={usuario.id_usuario} className="dropdown-item">
                        <span className="mes-fecha">
                          {getNombreCompleto(usuario)} 
                        </span>
                        <button
                          className={`btn-consultar ${usuarioSeleccionado === usuario.id_usuario ? 'activo' : ''}`}
                          onClick={() => {
                            setUsuarioSeleccionado(usuario.id_usuario);
                            cargarTransacciones(usuario.id_usuario);
                            setShowMesesMenu(false);
                          }}
                          disabled={loading}
                        >
                          {loading && usuarioSeleccionado === usuario.id_usuario ? 'Consultando...' : 'Consultar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {loading && usuarioSeleccionado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Consultando transacciones...</span>
              </div>
            )}
            
            {usuarioSeleccionado && usuariosHermanos.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                {(() => {
                  const usuario = usuariosHermanos.find(u => u.id_usuario === usuarioSeleccionado);
                  return usuario ? (
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                        {usuario.nombre_usuario} {usuario.apellido_usuario}
                      </h4>
                      <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        ID: {usuario.id_usuario} | Email: {usuario.email} | Celular: {usuario.celular}
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}
        {/* Resumen financiero - Para frigorífico, logística y admin */}
        {transacciones && (() => {
           const pendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').length;
           const consolidados = transacciones.transacciones.filter(t => t.nombre_tipo_transaccion === 'ticket_consolidado').length;
           const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
           const montoTotalMes = transacciones.transacciones.filter(t =>
             t.nombre_estado_transaccion === 'PENDIENTE' || t.nombre_estado_transaccion === 'PAGADO'
           ).filter(t => t.id_empaque !== null).reduce((sum, t) => sum + t.monto, 0);
          
          return (
            <div className="resumen-financiero">
              <div className="resumen-item">
                <span className="resumen-label">📊 Total Transacciones:</span>
                <span className="resumen-value">{transacciones.total_transacciones}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">⏳ Pendientes:</span>
                <span className="resumen-value">{pendientes}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">✅ Consolidados:</span>
                <span className="resumen-value">{consolidados}</span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">💰 Saldo Total (Pendientes):</span>
                <span className="resumen-value">
                  {formatMoneda(saldoTotalPendientes)}
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">📅 Monto del Mes:</span>
                <span className="resumen-value">
                  {formatMoneda(montoTotalMes)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Mensaje de éxito */}
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

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button
              className="error-retry-btn"
              onClick={() => {
                setError(null);
                if (usuarioSeleccionado) {
                  cargarTransacciones(usuarioSeleccionado);
                } else {
                  // Evitar recarga de página completa
                  console.log('No hay usuario seleccionado para recargar datos');
                }
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de transacciones */}
      {transacciones && (
        <div className="transacciones-container">
          <TablaTransacciones
            data={transacciones}
            loading={loading}
            error={error}
            mesesHistoricos={mesesHistoricos}
            mesSeleccionado={mesSeleccionado}
            onConsultarMes={consultarMesEspecifico}
            esFrigorifico={esFrigorifico || esLogistica}
          />
        </div>
      )}

      {/* Mensaje cuando no hay usuario seleccionado - Solo para roles administrativos */}
      {!esFrigorifico && !usuarioSeleccionado && !loading && !error && (
        <div className="no-selection-message">
          <div className="no-selection-content">
            <span className="no-selection-icon">📋</span>
            <h3>Selecciona un usuario para ver sus transacciones</h3>
            <p>
              Elige un usuario de la lista desplegable para consultar sus productos pendientes
              y tickets consolidados pagados.
            </p>
            {usuariosHermanos.length === 0 && (
              <div className="no-users-warning">
                <p>
                  <strong>Nota:</strong> No se encontraron usuarios relacionados.
                  Esto puede indicar que no tienes permisos para ver estos datos.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Pago/Abono - Para usuarios logística y admin con frigorífico seleccionado */}
      {(esLogistica || user?.role === 'admin' || user?.role === 'superadmin') && usuarioSeleccionado && transacciones && (() => {
        const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
        return (
          <div className="pago-abono-section" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>💰 Gestión de Pagos</h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Saldo Total Pendiente:</strong> <span style={{ fontSize: '1.2em', color: saldoTotalPendientes > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>{formatMoneda(saldoTotalPendientes)}</span>
              {saldoTotalPendientes === 0 && (
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
                    {tipoPago === 'pago' ? 'Pago Total' : 'Abono'}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {showTipoMenu && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">
                      <span className="mes-fecha">Pago Total</span>
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

            {/* Los campos de monto y nota solo aparecen después de seleccionar el tipo */}
            {tipoPago && (
              tipoPago === 'pago' ? (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Monto a Pagar:</strong>
                    <div style={{ fontSize: '2em', color: 'var(--color-success)', marginTop: '0.5rem' }}>
                      {formatMoneda(montoPago)}
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
                      placeholder={`pago total de deuda hecha por el usuario logistica ${user?.name || ''}`}
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
              {procesandoPago ? 'Procesando...' : 'Pagar'}
            </button>
          </div>
        );
      })()}
    </div>
  );
};

export default CuentasPage;