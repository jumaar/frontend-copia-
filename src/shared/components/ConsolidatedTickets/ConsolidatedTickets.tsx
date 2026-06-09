import React from 'react';
import { formatMoneda, formatFecha } from '../../config/format';
import './ConsolidatedTickets.css';

interface ConsolidatedTransaction {
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

interface ConsolidatedTicket {
  ticket: ConsolidatedTransaction;
  productos: ConsolidatedTransaction[];
}

interface ConsolidatedTicketsProps {
  variant: 'proveedor' | 'cliente' | 'admin';
  consolidados: ConsolidatedTicket[];
  expandedConsolidados: Set<number>;
  toggleConsolidado: (id: number) => void;
  expandedNotas?: Set<number>;
  toggleNota?: (id: number) => void;
}

const VARIANTS = {
  proveedor: { costoLabel: 'Costo Frigorifico', gananciaLabel: 'Ganancia frigorifico' },
  cliente: { costoLabel: 'Costo Tienda', gananciaLabel: 'Ganancia tienda' },
  admin: { costoLabel: '', gananciaLabel: '' },
} as const;

const ConsolidatedTickets: React.FC<ConsolidatedTicketsProps> = ({
  variant,
  consolidados,
  expandedConsolidados,
  toggleConsolidado,
  expandedNotas,
  toggleNota,
}) => {
  const { costoLabel, gananciaLabel } = VARIANTS[variant];
  const isAdmin = variant === 'admin';

  return (
    <div className="consolidated-tickets">
      <h3 className="seccion-titulo">
        <span className="icon">✅</span>
        Tickets Consolidados Pagados ({consolidados.length})
      </h3>
      <div className="consolidados-lista">
        {consolidados.map(({ ticket, productos }) => {
          const isExpanded = expandedConsolidados.has(ticket.id_transaccion);
          const gananciaTienda = productos.reduce((sum, p) => sum + (p.costo_tienda || 0), 0);

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
                    {!isAdmin && (
                      <p className="consolidado-ganancia">{gananciaLabel}: {formatMoneda(gananciaTienda)}</p>
                    )}
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
                <div className="info-pago-section">
                  <h6>Información del Pago</h6>
                  <p>
                    <strong>Cobrado por:</strong> {ticket.info_pago.nombre_usuario_pago} (ID: {ticket.info_pago.id_usuario_pago})
                  </p>
                  {ticket.info_pago.nota_opcional_pago && (
                    <p>
                      <strong>Nota:</strong> {ticket.info_pago.nota_opcional_pago}
                    </p>
                  )}
                </div>
              )}

              {isExpanded && (
                <div className="consolidado-detalle">
                  <h5>Productos incluidos en este ticket:</h5>
                  <div className="tabla-container">
                    <table className="productos-table">
                      <thead>
                        <tr>
                          <th>ID Transacción</th>
                          <th>ID Empaque</th>
                          <th>Monto</th>
                          {!isAdmin && <th>{costoLabel}</th>}
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
                            {!isAdmin && (
                              <td className="monto-cell">{formatMoneda(producto.costo_tienda ?? 0)}</td>
                            )}
                            <td>{producto.hora_transaccion ? formatFecha(producto.hora_transaccion) : '-'}</td>
                            <td className="nota-cell">
                              <span className="nota-text">{producto.nota_opcional}</span>
                              {toggleNota && expandedNotas && producto.nota_opcional && (
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
  );
};

export type { ConsolidatedTransaction, ConsolidatedTicket, ConsolidatedTicketsProps };
export default ConsolidatedTickets;
