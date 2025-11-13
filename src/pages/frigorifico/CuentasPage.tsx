import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTransaccionesCuentas, getHermanos } from '../../services/api';
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
  const [mesesHistoricos, setMesesHistoricos] = useState<Array<{mes: number, año: number, fecha: string}>>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{mes: number, año: number} | null>(null);
  const [showMesesMenu, setShowMesesMenu] = useState(false);

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
      setTransacciones(null);
      
      const data = await getTransaccionesCuentas(idUsuario, mes, año);
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


  // Obtener nombre completo del usuario
  const getNombreCompleto = (usuario: UsuarioHermano) => {
    return `${usuario.nombre_usuario} ${usuario.apellido_usuario}`;
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
                        {getNombreCompleto(usuario)}
                      </h4>
                      <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        Email: {usuario.email} | Celular: {usuario.celular}
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
          const consolidados = transacciones.transacciones.filter(t => t.nombre_tipo_transaccion === 'CONSOLIDADO').length;
          const saldoTotalPendientes = transacciones.transacciones.filter(t => t.nombre_estado_transaccion === 'PENDIENTE').reduce((sum, t) => sum + t.monto, 0);
          const montoTotalMes = transacciones.transacciones.reduce((sum, t) => sum + t.monto, 0);
          
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
                  window.location.reload();
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
    </div>
  );
};

export default CuentasPage;