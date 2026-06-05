import React, { useState } from 'react';
import { getEmpaque } from '../../../services/api';
import Alert from '../Alert/Alert';
import './TrazabilidadEmpaquePage.css';

interface Departamento {
  id__departamento: number;
  nombre_departamento: string;
}

interface Ciudad {
  id_ciudad: number;
  nombre_ciudad: string;
  departamento: Departamento;
}

interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
}

interface EstadoEmpaque {
  id_estado_empaque: number;
  nombre_estado: string;
}

interface EstadoNevera {
  id_estado_nevera: number;
  estado_nevera: string;
}

interface LineaDeTiempo {
  creacion: string | null;
  envio_logistica: string | null;
  llegada_nevera: string | null;
  pendiente_pago: string | null;
  marcado_para_cambio: string | null;
  surtido_final: string | null;
  finalizacion: string | null;
}

interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
}

interface OrigenEstacion {
  id_estacion: string;
  fecha_creacion: string;
  fecha_activacion: string;
}

interface OrigenFrigorifico {
  id_frigorifico: number;
  nombre_frigorifico: string;
  direccion: string;
  ciudad: Ciudad;
  usuario: Usuario;
}

interface Origen {
  estacion: OrigenEstacion;
  frigorifico: OrigenFrigorifico;
}

interface Logistica {
  id_logistica: number;
  nombre_empresa: string;
  placa_vehiculo: string;
  usuario: Usuario;
}

interface NeveraData {
  id_nevera: number;
  version_software: string;
  fecha_activacion: string;
  ultima_conexion: string;
  hora_ultimo_surtido: string;
  estadoNevera: EstadoNevera;
  tienda: Tienda;
}

interface Tienda {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: Ciudad;
  usuario: Usuario;
}

interface TipoTransaccion {
  id_tipo: number;
  nombre_codigo: string;
  descripcion_amigable: string;
}

interface EstadoTransaccion {
  id_estado_transaccion: number;
  nombre_estado: string;
}

interface Transaccion {
  id_transaccion: number;
  monto: number;
  hora_transaccion: string;
  nota_opcional: string | null;
  tipoTransaccion: TipoTransaccion;
  estadoTransaccion: EstadoTransaccion;
  usuario: Usuario;
  nevera: { id_nevera: number };
}

interface Promocion {
  id_promocion: number;
  nombre_promocion: string;
}

interface EmpaqueData {
  id_empaque: number;
  EPC_id: string;
  peso_exacto_g: number;
  precio_venta_total: number;
  costo_frigorifico: number;
  costo_tienda: number;
  fecha_vencimiento: string;
  estado_actual: EstadoEmpaque;
  linea_de_tiempo: LineaDeTiempo;
  producto: Producto;
  origen: Origen;
  logistica: Logistica;
  nevera_actual: NeveraData | null;
  nevera_anterior: NeveraData | null;
  promocion: Promocion | null;
  transacciones: Transaccion[];
}

interface EmpaqueResponse {
  empaque: EmpaqueData;
}

interface TimelineNode {
  key: string;
  color: string;
  timestamp: string;
  title: string;
  details: { label: string; value: string }[];
}

const TIMELINE_COLORS: Record<string, string> = {
  creacion: '#22c55e',
  envio_logistica: '#eab308',
  llegada_nevera: '#3b82f6',
  pendiente_pago: '#a855f7',
  marcado_para_cambio: '#f97316',
  surtido_final: '#f97316',
  finalizacion: '#6b7280',
  traslado: '#3b82f6',
};

const formatDateTime = (isoStr: string): string => {
  const d = new Date(isoStr);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
};

const buildTimelineNodes = (empaque: EmpaqueData): TimelineNode[] => {
  const nodes: TimelineNode[] = [];
  const lt = empaque.linea_de_tiempo;

  if (lt.creacion) {
    nodes.push({
      key: 'creacion',
      color: TIMELINE_COLORS.creacion,
      timestamp: lt.creacion,
      title: 'Empacado en estación',
      details: [
        { label: 'Estación', value: empaque.origen.estacion.id_estacion },
        { label: 'Frigorífico', value: empaque.origen.frigorifico.nombre_frigorifico },
        { label: 'Ciudad', value: empaque.origen.frigorifico.ciudad.nombre_ciudad },
        { label: 'Producto', value: empaque.producto.nombre_producto },
        { label: 'Peso', value: `${empaque.peso_exacto_g}g` },
      ],
    });
  }

  if (lt.envio_logistica) {
    nodes.push({
      key: 'envio_logistica',
      color: TIMELINE_COLORS.envio_logistica,
      timestamp: lt.envio_logistica,
      title: 'Recogido por logística',
      details: [
        { label: 'Empresa', value: empaque.logistica.nombre_empresa },
        { label: 'Placa', value: empaque.logistica.placa_vehiculo },
        { label: 'Entregado por', value: empaque.logistica.usuario.nombre_usuario },
      ],
    });
  }

  if (lt.llegada_nevera) {
    if (empaque.nevera_anterior) {
      nodes.push({
        key: 'traslado',
        color: TIMELINE_COLORS.traslado,
        timestamp: lt.llegada_nevera,
        title: `Trasladado desde Nevera #${empaque.nevera_anterior.id_nevera}`,
        details: [
          { label: 'Tienda anterior', value: empaque.nevera_anterior.tienda.nombre_tienda },
        ],
      });
    }
    const neveraRef = empaque.nevera_actual;
    nodes.push({
      key: 'llegada_nevera',
      color: TIMELINE_COLORS.llegada_nevera,
      timestamp: lt.llegada_nevera,
      title: 'Instalado en nevera',
      details: [
        { label: 'Nevera', value: neveraRef ? `#${neveraRef.id_nevera}` : '-' },
        { label: 'Tienda', value: neveraRef ? neveraRef.tienda.nombre_tienda : '-' },
        { label: 'Dirección', value: neveraRef ? neveraRef.tienda.direccion : '-' },
        { label: 'Ciudad', value: neveraRef ? neveraRef.tienda.ciudad.nombre_ciudad : '-' },
      ],
    });
  }

  if (lt.pendiente_pago) {
    nodes.push({
      key: 'pendiente_pago',
      color: TIMELINE_COLORS.pendiente_pago,
      timestamp: lt.pendiente_pago,
      title: 'Vendido - Pendiente de pago',
      details: [
        { label: 'Precio venta', value: formatMoneda(empaque.precio_venta_total) },
      ],
    });
  }

  if (lt.marcado_para_cambio) {
    nodes.push({
      key: 'marcado_para_cambio',
      color: TIMELINE_COLORS.marcado_para_cambio,
      timestamp: lt.marcado_para_cambio,
      title: 'Marcado para cambio',
      details: [],
    });
  }

  if (lt.surtido_final) {
    nodes.push({
      key: 'surtido_final',
      color: TIMELINE_COLORS.surtido_final,
      timestamp: lt.surtido_final,
      title: 'Surtido finalizado',
      details: [],
    });
  }

  if (lt.finalizacion) {
    nodes.push({
      key: 'finalizacion',
      color: TIMELINE_COLORS.finalizacion,
      timestamp: lt.finalizacion,
      title: 'Ciclo finalizado',
      details: [
        { label: 'Estado final', value: empaque.estado_actual.nombre_estado },
      ],
    });
  }

  return nodes;
};

const TrazabilidadEmpaquePage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [empaque, setEmpaque] = useState<EmpaqueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'error' | 'welcome' | 'default'>('error');

  const handleSearch = async () => {
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    setLoading(true);
    setEmpaque(null);
    try {
      const data: EmpaqueResponse = await getEmpaque(trimmed);
      setEmpaque(data.empaque);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAlertMsg('Empaque no encontrado');
        setAlertType('error');
      } else {
        setAlertMsg('Error al consultar el empaque');
        setAlertType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const timelineNodes = empaque ? buildTimelineNodes(empaque) : [];
  const margen = empaque
    ? empaque.precio_venta_total - empaque.costo_frigorifico - empaque.costo_tienda
    : 0;

  return (
    <div className="trazabilidad-page">
      {alertMsg && (
        <Alert message={alertMsg} onDismiss={() => setAlertMsg(null)} type={alertType} />
      )}

      <div className="cuentas-header">
        <h1>Trazabilidad de Empaques</h1>
        <p>Consultá el recorrido completo de un empaque desde su creación hasta su estado actual.</p>
      </div>

      <section className="card search-section">
        <div className="search-bar">
          <input
            type="search"
            className="search-input"
            placeholder="Buscar por ID de empaque o código EPC"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="button button-primary search-button" onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </section>

      {loading && (
        <div className="management-page">
          <p style={{ color: 'var(--color-text-primary)', textAlign: 'center', marginTop: '2rem' }}>
            Cargando trazabilidad...
          </p>
        </div>
      )}

      {empaque && !loading && (
        <div className="trazabilidad-content">
          <div className="timeline-panel">
            <div className="timeline-header-info">
              <span className="epc-badge">EPC: {empaque.EPC_id}</span>
              <span className="producto-badge">{empaque.producto.nombre_producto}</span>
              <span className={`estado-badge estado-${empaque.estado_actual.id_estado_empaque}${empaque.estado_actual.nombre_estado.toLowerCase().includes('vencido') ? ' vencido-badge' : ''}`}>
                {empaque.estado_actual.nombre_estado}
              </span>
            </div>

            {timelineNodes.length > 0 && (
              <div className="timeline">
                {timelineNodes.map((node, idx) => {
                  const isLast = idx === timelineNodes.length - 1;
                  return (
                    <div className="timeline-node" key={`${node.key}-${idx}`}>
                      <div className="timeline-line-col">
                        <div
                          className="timeline-dot"
                          style={{ backgroundColor: node.color }}
                        />
                        {!isLast && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <span className="timeline-card-time">{formatDateTime(node.timestamp)}</span>
                          <span
                            className="timeline-card-title"
                            style={{ color: node.color, fontWeight: 600 }}
                          >
                            {node.title}
                          </span>
                        </div>
                        {node.details.length > 0 && (
                          <div className="timeline-card-details">
                            {node.details.map((d, i) => (
                              <div className="detail-row" key={i}>
                                <span className="detail-label">{d.label}:</span>
                                <span className="detail-value">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {timelineNodes.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No hay eventos registrados en la línea de tiempo para este empaque.
              </p>
            )}
          </div>

          <div className="detail-panel">
            <div className="card detail-card">
              <h3>Datos del Producto</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Peso nominal</span>
                  <span className="detail-value">{empaque.producto.peso_nominal_g}g</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Peso exacto</span>
                  <span className="detail-value">{empaque.peso_exacto_g}g</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Precio venta</span>
                  <span className="detail-value">{formatMoneda(empaque.precio_venta_total)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fecha vencimiento</span>
                  <span className="detail-value">{empaque.fecha_vencimiento}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Días de vida</span>
                  <span className="detail-value">{empaque.producto.dias_vencimiento} días</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Descripción</span>
                  <span className="detail-value">{empaque.producto.descripcion_producto}</span>
                </div>
              </div>
            </div>

            <div className="card detail-card">
              <h3>Datos Financieros</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Costo frigorífico</span>
                  <span className="detail-value">{formatMoneda(empaque.costo_frigorifico)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Costo tienda</span>
                  <span className="detail-value">{formatMoneda(empaque.costo_tienda)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Precio venta total</span>
                  <span className="detail-value">{formatMoneda(empaque.precio_venta_total)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Margen</span>
                  <span className="detail-value" style={{ color: margen >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {formatMoneda(margen)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card detail-card">
              <h3>Origen</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Frigorífico</span>
                  <span className="detail-value">{empaque.origen.frigorifico.nombre_frigorifico}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ciudad</span>
                  <span className="detail-value">{empaque.origen.frigorifico.ciudad.nombre_ciudad}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estación</span>
                  <span className="detail-value">{empaque.origen.estacion.id_estacion}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Creado por</span>
                  <span className="detail-value">{empaque.origen.frigorifico.usuario.nombre_usuario} {empaque.origen.frigorifico.usuario.apellido_usuario}</span>
                </div>
              </div>
            </div>

            <div className="card detail-card">
              <h3>Transacciones</h3>
              {empaque.transacciones.length > 0 ? (
                <div className="transactions-table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empaque.transacciones.map((t) => (
                        <tr key={t.id_transaccion}>
                          <td>{t.hora_transaccion ? formatDateTime(t.hora_transaccion) : '-'}</td>
                          <td>{t.tipoTransaccion.descripcion_amigable}</td>
                          <td>{formatMoneda(t.monto)}</td>
                          <td>{t.estadoTransaccion.nombre_estado}</td>
                          <td>{t.usuario.nombre_usuario} {t.usuario.apellido_usuario}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>Sin transacciones registradas.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrazabilidadEmpaquePage;
