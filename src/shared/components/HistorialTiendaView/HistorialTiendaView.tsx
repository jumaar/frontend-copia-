import React from 'react';
import type {
  HistorialTiendaResponse,
  MesItem,
  ResumenGlobal,
} from '../../types/historial-tienda.types';
import {
  formatMoneda,
  formatFecha,
  agruparConsolidados,
  filtrarPendientes,
  calcularLiquidacion,
} from '../../hooks/useHistorialTienda';
import '../../../shared/components/TablaTransacciones/TablaTransacciones.css';

interface HistorialTiendaViewProps {
  historial: HistorialTiendaResponse;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  mesesHistoricos: MesItem[];
  mesSeleccionado: { mes: number; año: number } | null;
  showMesesMenu: boolean;
  expandedNeveras: Set<number>;
  expandedConsolidados: Set<number>;
  expandedProductos: Set<string>;
  resumenGlobal: ResumenGlobal | null;
  toggleNevera: (id: number) => void;
  toggleConsolidado: (id: number) => void;
  toggleProducto: (key: string) => void;
  consultarMesEspecifico: (mes: number, año: number) => void;
  setShowMesesMenu: (show: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
}

const HistorialTiendaView: React.FC<HistorialTiendaViewProps> = ({
  historial,
  loading,
  error,
  successMessage,
  mesesHistoricos,
  mesSeleccionado,
  showMesesMenu,
  expandedNeveras,
  expandedConsolidados,
  expandedProductos,
  resumenGlobal,
  toggleNevera,
  toggleConsolidado,
  toggleProducto,
  consultarMesEspecifico,
  setShowMesesMenu,
  setError,
  setSuccessMessage,
}) => {
  const infoUsuario = historial;
  const neveras = historial?.neveras || [];

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        <h1>Historial Tienda</h1>
        <p className="subtitle">
          Consulta el historial completo de movimientos por nevera en el mes seleccionado
        </p>
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
                    Consultar Meses Anteriores
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

              const totalEmpaques = neveraData.empaques?.reduce((sum: number, e: any) => {
                const precioTienda = parseFloat(neveraData.productos?.find((p: any) => p.id_producto === e.id_producto)?.precio_tienda || '0') || 0;
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
                    backgroundColor: 'var(--color-card-bg)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleNevera(neveraData.nevera.id_nevera)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem 1.5rem', border: 'none', cursor: 'pointer',
                      backgroundColor: 'var(--color-hover-bg)',
                      textAlign: 'left',
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
                                  liquidar: acc.liquidar + r.liquidar,
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
                                      border: 'none', cursor: 'pointer', textAlign: 'left',
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
                                            const promoAplicada = empaque.promocion ? neveraData.promociones?.find((p: any) => p.id_promocion === empaque.promocion) : null;
                                            return (
                                              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '0.4rem', color: 'var(--color-text-primary)' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span>{empaque.id_empaque}</span>
                                                    {promoAplicada && (
                                                      <span title={`${promoAplicada.nombre} (${promoAplicada.valor}%)`} style={{
                                                        backgroundColor: 'var(--color-success)', color: 'white',
                                                        padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.65rem',
                                                        fontWeight: 'bold', cursor: 'help',
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
                        borderRadius: '6px', border: '1px solid var(--color-border)',
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
    </div>
  );
};

export default HistorialTiendaView;
