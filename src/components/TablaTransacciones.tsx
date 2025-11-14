import React, { useState } from 'react';
import './TablaTransacciones.css';

interface Transaccion {
  id_transaccion: number;
  id_empaque: number | null;
  id_transaccion_rel: number | null;
  monto: number;
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

interface TransaccionesData {
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

interface TablaTransaccionesProps {
  data: TransaccionesData;
  loading?: boolean;
  error?: string | null;
  mesesHistoricos?: Array<{mes: number, año: number, fecha: string}>;
  mesSeleccionado?: {mes: number, año: number} | null;
  onConsultarMes?: (mes: number, año: number) => void;
  esFrigorifico?: boolean;
}

const TablaTransacciones: React.FC<TablaTransaccionesProps> = ({
  data,
  loading = false,
  error = null,
  mesesHistoricos = [],
  mesSeleccionado = null,
  onConsultarMes = () => {},
  esFrigorifico = false
}) => {
  const [expandedConsolidados, setExpandedConsolidados] = useState<Set<number>>(new Set());
  const [showMesesMenu, setShowMesesMenu] = useState(false);
  const [expandedNotas, setExpandedNotas] = useState<Set<number>>(new Set());

  const toggleNota = (idTransaccion: number) => {
    const newExpanded = new Set(expandedNotas);
    if (newExpanded.has(idTransaccion)) {
      newExpanded.delete(idTransaccion);
    } else {
      newExpanded.add(idTransaccion);
    }
    setExpandedNotas(newExpanded);
  };

  const toggleConsolidado = (idTransaccion: number) => {
    const newExpanded = new Set(expandedConsolidados);
    if (newExpanded.has(idTransaccion)) {
      newExpanded.delete(idTransaccion);
    } else {
      newExpanded.add(idTransaccion);
    }
    setExpandedConsolidados(newExpanded);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const agruparTransacciones = () => {
    // Validar que los datos existan
    if (!data || !data.transacciones || !Array.isArray(data.transacciones)) {
      console.warn('Datos de transacciones inválidos:', data);
      return { pendientes: [], consolidados: [] };
    }

    const pendientes: Transaccion[] = [];
    const consolidados = new Map<number, {
      ticket: Transaccion;
      productos: Transaccion[];
    }>();

    data.transacciones.forEach((transaccion, index) => {
      // Validar cada transacción individual
      if (!transaccion || typeof transaccion !== 'object') {
        console.warn(`Transacción inválida en índice ${index}:`, transaccion);
        return;
      }

      if (transaccion.nombre_estado_transaccion === 'PENDIENTE') {
        pendientes.push(transaccion);
      } else if (transaccion.nombre_tipo_transaccion === 'ticket_consolidado') {
        // Ticket consolidado (nueva transacción que agrupa productos)
        consolidados.set(transaccion.id_transaccion, {
          ticket: transaccion,
          productos: []
        });
      } else if (transaccion.nombre_estado_transaccion === 'PAGADO' && transaccion.id_transaccion_rel) {
        // Producto pagado que pertenece a un consolidado
        const consolidado = consolidados.get(transaccion.id_transaccion_rel);
        if (consolidado) {
          consolidado.productos.push(transaccion);
        }
      }
    });

    return { pendientes, consolidados: Array.from(consolidados.values()) };
  };

  const { pendientes, consolidados } = agruparTransacciones();

  if (loading) {
    return (
      <div className="transacciones-loading">
        <div className="loading-spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transacciones-error">
        <p>Error al cargar las transacciones: {error}</p>
      </div>
    );
  }

  if (!data || data.transacciones.length === 0) {
    return (
      <div className="transacciones-empty">
        <p>No hay transacciones para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="tabla-transacciones">
      {/* Información del usuario y período */}
      <div className="transacciones-header">
        <div className="user-info">
          <h2>{data.nombre_usuario} {data.apellido_usuario}</h2>
          <p className="periodo-info">
            Período: {data.periodo.mes}/{data.periodo.año}
            {data.parametros_usados.es_periodo_actual && <span className="badge-actual">ACTUAL</span>}
          </p>
          <p className="fecha-creacion">
            Usuario desde: {formatFecha(data.fecha_creacion_usuario)}
          </p>
          
          {/* Menú desplegable de meses históricos - Solo para frigorífico */}
          {esFrigorifico && mesesHistoricos.length > 0 && (
            <div className="meses-dropdown">
              <button
                className="dropdown-toggle"
                onClick={() => setShowMesesMenu(!showMesesMenu)}
              >
                Consultar Meses Anteriores
                <span className={`dropdown-arrow ${showMesesMenu ? 'open' : ''}`}>▼</span>
              </button>
              
              {showMesesMenu && (
                <div className="dropdown-menu">
                  {mesesHistoricos.map((mesItem) => (
                    <div key={`${mesItem.mes}-${mesItem.año}`} className="dropdown-item">
                      <span className="mes-fecha">{mesItem.fecha}</span>
                      <button
                        className={`btn-consultar ${mesSeleccionado?.mes === mesItem.mes && mesSeleccionado?.año === mesItem.año ? 'activo' : ''}`}
                        onClick={() => {
                          onConsultarMes(mesItem.mes, mesItem.año);
                          setShowMesesMenu(false); // Cerrar dropdown al seleccionar
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
        </div>
        <div className="summary-info">
          {!esFrigorifico && (
            <>
              <div className="summary-item">
                <span className="summary-label">Total Transacciones:</span>
                <span className="summary-value">{data.total_transacciones}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pendientes:</span>
                <span className="summary-value">{pendientes.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Consolidados:</span>
                <span className="summary-value">{consolidados.length}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sección de productos pendientes */}
      {pendientes.length > 0 && (
        <div className="seccion-pendientes">
          <h3 className="seccion-titulo">
            <span className="icon">⏳</span>
            Productos Pendientes ({pendientes.length})
          </h3>
          <div className="tabla-container">
            <table className="transacciones-table">
              <thead>
                <tr>
                  <th>ID Transacción</th>
                  <th>ID Empaque</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map(transaccion => (
                  <tr key={transaccion.id_transaccion} className="fila-pendiente">
                    <td className="id-cell">{transaccion.id_transaccion}</td>
                    <td>
                      {transaccion.id_empaque ? transaccion.id_empaque : (
                        <span className="badge estado-pendiente">Saldo</span>
                      )}
                    </td>
                    <td className="monto-cell">{formatMoneda(transaccion.monto)}</td>
                    <td>{transaccion.hora_transaccion ? formatFecha(transaccion.hora_transaccion) : '-'}</td>
                    <td>
                      <span className="badge tipo-venta">{transaccion.nombre_tipo_transaccion}</span>
                    </td>
                    <td>
                      <span className="badge estado-pendiente">PENDIENTE</span>
                    </td>
                    <td className={`nota-cell ${expandedNotas.has(transaccion.id_transaccion) ? 'nota-expanded' : ''}`}>
                      <span className="nota-text">{transaccion.nota_opcional}</span>
                      {transaccion.nota_opcional && (
                        <button
                          className="nota-toggle"
                          onClick={() => toggleNota(transaccion.id_transaccion)}
                        >
                          {expandedNotas.has(transaccion.id_transaccion) ? 'ver menos' : 'ver más'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección de productos consolidados pagados */}
      {consolidados.length > 0 && (
        <div className="seccion-consolidados">
          <h3 className="seccion-titulo">
            <span className="icon">✅</span>
            Tickets Consolidados Pagados ({consolidados.length})
          </h3>
          <div className="consolidados-lista">
            {consolidados.map(({ ticket, productos }) => {
              const isExpanded = expandedConsolidados.has(ticket.id_transaccion);
              return (
                <div key={ticket.id_transaccion} className="consolidado-item">
                  <div 
                    className={`consolidado-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleConsolidado(ticket.id_transaccion)}
                  >
                    <div className="consolidado-info">
                      <button className="expand-button">
                        {isExpanded ? '▼' : '▶'}
                      </button>
                      <div className="consolidado-datos">
                        <h4>Ticket #{ticket.id_transaccion}</h4>
                        <p className="consolidado-monto">{formatMoneda(ticket.monto)}</p>
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
                  
                  {isExpanded && (
                    <div className="consolidado-detalle">
                      {ticket.info_pago && (
                        <div className="info-pago-section" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <h6 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>Información del Pago</h6>
                          <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
                            <strong>Pagado por:</strong> {ticket.info_pago.nombre_usuario_pago}
                          </p>
                          {ticket.info_pago.nota_opcional_pago && (
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                              <strong>Nota:</strong> {ticket.info_pago.nota_opcional_pago}
                            </p>
                          )}
                        </div>
                      )}
                      <h5>Productos incluidos en este ticket:</h5>
                      <div className="tabla-container">
                        <table className="productos-table">
                          <thead>
                            <tr>
                              <th>ID Transacción</th>
                              <th>ID Empaque</th>
                              <th>Monto</th>
                              <th>Fecha</th>
                              <th>Nota</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productos.map(producto => (
                              <tr key={producto.id_transaccion} className="fila-pagada">
                                <td className="id-cell">{producto.id_transaccion}</td>
                                <td>{producto.id_empaque || '-'}</td>
                                <td className="monto-cell">{formatMoneda(producto.monto)}</td>
                                <td>{producto.hora_transaccion ? formatFecha(producto.hora_transaccion) : '-'}</td>
                                <td className={`nota-cell ${expandedNotas.has(producto.id_transaccion) ? 'nota-expanded' : ''}`}>
                                  <span className="nota-text">{producto.nota_opcional}</span>
                                  {producto.nota_opcional && (
                                    <button
                                      className="nota-toggle"
                                      onClick={() => toggleNota(producto.id_transaccion)}
                                    >
                                      {expandedNotas.has(producto.id_transaccion) ? 'ver menos' : 'ver más'}
                                    </button>
                                  )}
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
        </div>
      )}

      {/* Mensaje cuando no hay transacciones */}
      {pendientes.length === 0 && consolidados.length === 0 && (
        <div className="transacciones-empty">
          <p>No hay transacciones para el período seleccionado.</p>
        </div>
      )}
    </div>
  );
};

export default TablaTransacciones;