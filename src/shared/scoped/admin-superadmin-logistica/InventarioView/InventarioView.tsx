// @ts-nocheck
import React from 'react';
import SurtirNeveraModal from '../../admin-superadmin-logistica-tienda/SurtirNeveraModal/SurtirNeveraModal';
import './InventarioView.css';
import type {
  LogisticaInventarioResponse,
  NeverasSurtirResponse,
  Producto,
  Empaque,
  Nevera,
} from '../useLogisticaInventario';

interface InventarioViewProps {
  inventarioData: LogisticaInventarioResponse | null;
  loading: boolean;
  error: string | null;
  neverasData: NeverasSurtirResponse | null;
  loadingNeveras: boolean;
  errorNeveras: string | null;
  expandedProducts: Set<number>;
  expandedVencidosProducts: Set<number>;
  expandedCities: Set<string>;
  expandedPrioridadCities: Set<number>;
  expandedPrioridadNeveras: Set<number>;
  expandedVencidosCities: Set<number>;
  expandedVencidosNeveras: Set<number>;
  lastDistributionTime: string | null;
  selectedLogisticaId: number | null;
  validandoEmpaques: boolean;
  showNeverasSection: boolean;
  isSurtirModalOpen: boolean;
  selectedNeveraId: number | null;
  searchId: string;
  esAdmin: boolean;
  toggleProductExpansion: (productId: number) => void;
  toggleVencidosProductExpansion: (productId: number) => void;
  toggleCityExpansion: (ciudad: string) => void;
  togglePrioridadCity: (cityId: number) => void;
  togglePrioridadNevera: (neveraId: number) => void;
  toggleVencidosCity: (cityId: number) => void;
  toggleVencidosNevera: (neveraId: number) => void;
  handleSurtir: (idNevera: number) => void;
  handleSurtirFlujo: (idNevera: number, nombreTienda: string) => void;
  handleCloseSurtirModal: () => void;
  handleBuscar: () => void;
  handleValidarEmpaques: () => Promise<void>;
  handleConsultarNeveras: () => Promise<void>;
  handleDarDeBaja: (idEmpaque: number, nombreProducto: string) => Promise<void>;
  esValidacionDelDia: () => boolean;
  setSearchId: React.Dispatch<React.SetStateAction<string>>;
}

const InventarioView: React.FC<InventarioViewProps> = ({
  inventarioData,
  loading,
  error,
  neverasData,
  loadingNeveras,
  errorNeveras,
  expandedProducts,
  expandedVencidosProducts,
  expandedCities,
  expandedPrioridadCities,
  expandedPrioridadNeveras,
  expandedVencidosCities,
  expandedVencidosNeveras,
  lastDistributionTime,
  selectedLogisticaId,
  validandoEmpaques,
  showNeverasSection,
  isSurtirModalOpen,
  selectedNeveraId,
  searchId,
  esAdmin,
  toggleProductExpansion,
  toggleVencidosProductExpansion,
  toggleCityExpansion,
  togglePrioridadCity,
  togglePrioridadNevera,
  toggleVencidosCity,
  toggleVencidosNevera,
  handleSurtir,
  handleSurtirFlujo,
  handleCloseSurtirModal,
  handleBuscar,
  handleValidarEmpaques,
  handleConsultarNeveras,
  handleDarDeBaja,
  esValidacionDelDia,
  setSearchId,
}) => {
  if (loading) {
    return <div className="management-page">Cargando inventario...</div>;
  }

  if (error) {
    return (
      <div className="management-page">
        <div
          style={{
            color: 'red',
            padding: '1rem',
            border: '1px solid red',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!inventarioData) {
    return (
      <div className="management-page">
        <p>No se encontraron datos de inventario.</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <section
        className="card"
        style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}
      >
        <div style={{ padding: '1rem' }}>
          {inventarioData ? (
            <>
              {(() => {
                const pesoTotal =
                  inventarioData.productos_por_logistica.reduce(
                    (total: number, producto: Producto) => {
                      const pesoE2 = producto.empaques.reduce(
                        (sum: number, empaque: Empaque) => {
                          return sum + parseFloat(empaque.peso_exacto_g);
                        },
                        0
                      );
                      const pesoPrioridad = (producto.empaques_estado_6?.logistica_prioridad || []).reduce(
                        (sum, e) => sum + parseFloat(e.peso_exacto_g),
                        0
                      );
                      const pesoVencidosLogistica = (producto.empaques_estado_6?.vencidos || []).reduce(
                        (sum, e) => sum + parseFloat(e.peso_exacto_g),
                        0
                      );
                      return total + pesoE2 + pesoPrioridad + pesoVencidosLogistica;
                    },
                    0
                  );

                const totalEmpaquesAll = inventarioData.productos_por_logistica.reduce(
                  (sum, p) =>
                    sum +
                    p.empaques.length +
                    (p.empaques_estado_6?.logistica_prioridad?.length || 0) +
                    (p.empaques_estado_6?.vencidos?.length || 0),
                  0
                );

                const totalE2 = inventarioData.productos_por_logistica.reduce(
                  (sum, p) => sum + p.empaques.length, 0
                );
                const totalPrioridad = inventarioData.productos_por_logistica.reduce(
                  (sum, p) => sum + (p.empaques_estado_6?.logistica_prioridad?.length || 0), 0
                );
                const totalVencidosLog = inventarioData.productos_por_logistica.reduce(
                  (sum, p) => sum + (p.empaques_estado_6?.vencidos?.length || 0), 0
                );
                return (
                  <div
                    style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--color-card-bg)',
                      padding: '1rem',
                      borderRadius: 'var(--border-radius)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: '0',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Total de Productos Diferentes:{' '}
                        {inventarioData.total_productos_diferentes}
                      </h3>
                      <p
                        style={{
                          margin: '0.25rem 0 0 0',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        ID Logística: {selectedLogisticaId}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3
                        style={{ margin: '0', color: 'var(--color-primary)' }}
                      >
                        Peso Total: {(pesoTotal / 1000).toFixed(2)} kg
                      </h3>
                      <p
                        style={{
                          margin: '0.25rem 0 0 0',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {totalEmpaquesAll} empaques total
                        {' '}
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                          ({totalE2} normales
                          {totalPrioridad > 0 && <span style={{ color: '#b45309' }}>, {totalPrioridad} prioridad</span>}
                          {totalVencidosLog > 0 && <span style={{ color: '#dc2626' }}>, {totalVencidosLog} vencidos</span>})
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              {inventarioData.productos_por_logistica.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                    padding: '2rem',
                  }}
                >
                  No hay productos en inventario para mostrar.
                </p>
              ) : (
                <div
                  className="products-container"
                  style={{ overflowX: 'auto' }}
                >
                  <table
                    className="products-table"
                    style={{ marginTop: '1rem', minWidth: '950px' }}
                  >
                    <tbody>
                      {inventarioData.productos_por_logistica.map(
                        (producto) => (
                          <React.Fragment key={producto.id_producto}>
                            <tr
                              className="product-header-row"
                              style={{
                                backgroundColor: 'var(--color-hover-bg)',
                                borderBottom: '2px solid var(--color-border)',
                              }}
                            >
                              <td colSpan={4}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem',
                                    gap: '1rem',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 'bold',
                                      color: 'var(--color-text-primary)',
                                    }}
                                  >
                                    {producto.id_producto} -{' '}
                                    {producto.nombre_producto}{' '}
                                    {producto.peso_nominal}g
                                  </span>
                                  <button
                                    onClick={() =>
                                      toggleProductExpansion(
                                        producto.id_producto
                                      )
                                    }
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      color: 'var(--color-primary)',
                                      textDecoration: 'underline',
                                      padding: '0.25rem 0.5rem',
                                    }}
                                  >
                                    Ver {producto.empaques.length + (producto.empaques_estado_6?.logistica_prioridad?.length || 0)} empaques{' '}
                                    {expandedProducts.has(producto.id_producto)
                                      ? '▲'
                                      : '▼'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedProducts.has(producto.id_producto) && (
                              <>
                                <tr
                                  className="empaque-header-row"
                                  style={{
                                    backgroundColor: 'var(--color-card-bg)',
                                    fontWeight: 'bold',
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  <th style={{ width: '100px' }}>
                                    ID Empaque
                                  </th>
                                  <th style={{ width: '250px' }}>Producto</th>
                                  <th style={{ width: '150px' }}>Peso (g)</th>
                                  <th>EPC ID</th>
                                </tr>
                                {producto.empaques_estado_6?.logistica_prioridad && producto.empaques_estado_6.logistica_prioridad.length > 0 &&
                                  producto.empaques_estado_6.logistica_prioridad.map((empaque) => (
                                    <tr
                                      key={`prioridad-${producto.id_producto}-${empaque.id_empaque}`}
                                      style={{
                                        borderBottom: '1px solid #f59e0b',
                                        background: '#fffbeb',
                                      }}
                                    >
                                      <td style={{ fontWeight: 'bold', color: '#b45309' }}>
                                        <span style={{
                                          display: 'inline-block',
                                          padding: '0.1rem 0.4rem',
                                          borderRadius: '3px',
                                          backgroundColor: '#ef4444',
                                          color: 'white',
                                          fontSize: '0.65rem',
                                          fontWeight: 'bold',
                                          marginRight: '0.35rem',
                                          verticalAlign: 'middle',
                                          textTransform: 'uppercase',
                                        }}>
                                          PRIORIDAD
                                        </span>
                                        {empaque.id_empaque}
                                      </td>
                                      <td style={{ fontWeight: 'bold', color: '#b45309' }}>
                                        {producto.nombre_producto}
                                      </td>
                                      <td style={{ fontWeight: 'bold', color: '#b45309' }}>
                                        {parseFloat(empaque.peso_exacto_g).toFixed(2)} g
                                      </td>
                                      <td>
                                        <span style={{ fontWeight: 'bold', color: '#b45309' }}>
                                          {empaque.EPC_id}
                                        </span>
                                        <span style={{
                                          display: 'inline-block',
                                          marginLeft: '0.5rem',
                                          padding: '0.1rem 0.35rem',
                                          borderRadius: '4px',
                                          backgroundColor: empaque.porcentaje_transcurrido >= 90 ? '#fecaca' : empaque.porcentaje_transcurrido >= 75 ? '#fef3c7' : '#bbf7d0',
                                          color: empaque.porcentaje_transcurrido >= 90 ? '#991b1b' : empaque.porcentaje_transcurrido >= 75 ? '#b45309' : '#166534',
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                        }}>
                                          {empaque.porcentaje_transcurrido.toFixed(0)}%
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                }
                                {producto.empaques.map((empaque, index) => (
                                  <tr
                                    key={`${producto.id_producto}-${index}`}
                                    style={{
                                      borderBottom:
                                        '1px solid var(--color-border)',
                                    }}
                                  >
                                    <td>{empaque.id_empaque}</td>
                                    <td>{producto.nombre_producto}</td>
                                    <td>
                                      {parseFloat(
                                        empaque.peso_exacto_g
                                      ).toFixed(2)}{' '}
                                      g
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: 'bold',
                                        color: '#ff6b35',
                                      }}
                                    >
                                      {' '}
                                      {empaque.EPC_id}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </React.Fragment>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p>No se encontraron datos de inventario.</p>
          )}
        </div>
      </section>

      {/* Sección: Empaques Vencidos (tabla simple) */}
      {(() => {
        const todosVencidos = inventarioData?.productos_por_logistica
          ?.flatMap((producto) =>
            (producto.empaques_estado_6?.vencidos || []).map((empaque) => ({
              ...empaque,
              id_producto: producto.id_producto,
              nombre_producto: producto.nombre_producto,
            }))
          ) || [];

        if (todosVencidos.length === 0) return null;

        const agrupadosPorProducto = todosVencidos.reduce<
          Record<number, typeof todosVencidos>
        >((acc, empaque) => {
          if (!acc[empaque.id_producto]) {
            acc[empaque.id_producto] = [];
          }
          acc[empaque.id_producto].push(empaque);
          return acc;
        }, {});

        return (
          <section className="card" style={{ marginTop: '1rem' }}>
            <div style={{ padding: '1rem' }}>
              <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>
                Empaques Vencidos
              </h2>
              <div className="products-container" style={{ overflowX: 'auto' }}>
                <table className="products-table" style={{ marginTop: '1rem', minWidth: '950px' }}>
                  <tbody>
                    {Object.entries(agrupadosPorProducto).map(
                      ([idProducto, empaques]) => {
                        const productoId = Number(idProducto);
                        const nombreProducto = empaques[0].nombre_producto;
                        const isExpanded = expandedVencidosProducts.has(productoId);

                        return (
                          <React.Fragment key={`vencidos-tabla-${idProducto}`}>
                            <tr
                              className="product-header-row"
                              style={{
                                backgroundColor: '#fef2f2',
                                borderBottom: '2px solid #fca5a5',
                              }}
                            >
                              <td colSpan={5}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem',
                                    gap: '1rem',
                                  }}
                                >
                                  <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                                    {idProducto} - {nombreProducto}
                                  </span>
                                  <button
                                    onClick={() => toggleVencidosProductExpansion(productoId)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      color: '#dc2626',
                                      textDecoration: 'underline',
                                      padding: '0.25rem 0.5rem',
                                    }}
                                  >
                                    Ver {empaques.length} empaques vencidos{' '}
                                    {isExpanded ? '▲' : '▼'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <>
                                <tr
                                  className="empaque-header-row"
                                  style={{
                                    backgroundColor: 'var(--color-card-bg)',
                                    fontWeight: 'bold',
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  <th style={{ width: '100px' }}>ID Emp.</th>
                                  <th style={{ width: '200px' }}>Producto</th>
                                  <th style={{ width: '120px' }}>Peso (g)</th>
                                  <th>EPC</th>
                                  {esAdmin && <th style={{ width: '90px' }}>Acción</th>}
                                </tr>
                                {empaques.map((empaque) => (
                                  <tr
                                    key={`vencidos-tabla-emp-${empaque.id_empaque}`}
                                    style={{
                                      borderBottom: '1px solid var(--color-border)',
                                      backgroundColor: '#fff5f5',
                                    }}
                                  >
                                    <td>{empaque.id_empaque}</td>
                                    <td>{empaque.nombre_producto}</td>
                                    <td>{parseFloat(empaque.peso_exacto_g).toFixed(2)} g</td>
                                    <td>
                                      <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                                        {empaque.EPC_id}
                                      </span>
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          marginLeft: '0.5rem',
                                          padding: '0.1rem 0.35rem',
                                          borderRadius: '4px',
                                          backgroundColor: empaque.porcentaje_transcurrido >= 90 ? '#fecaca' : empaque.porcentaje_transcurrido >= 75 ? '#fef3c7' : '#bbf7d0',
                                          color: empaque.porcentaje_transcurrido >= 90 ? '#991b1b' : empaque.porcentaje_transcurrido >= 75 ? '#b45309' : '#166534',
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {empaque.porcentaje_transcurrido.toFixed(0)}%
                                      </span>
                                    </td>
                                    {esAdmin && (
                                      <td>
                                        <button
                                          onClick={() => handleDarDeBaja(empaque.id_empaque, empaque.nombre_producto)}
                                          style={{
                                            padding: '0.2rem 0.4rem',
                                            backgroundColor: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem',
                                          }}
                                        >
                                          Dar de baja
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}
                          </React.Fragment>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Sección del botón de validar empaques — solo logística */}
      {!esAdmin && (
      <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem' }}>
        {lastDistributionTime && (
          <div style={{ marginBottom: '1rem', color: 'white', fontSize: '0.9rem' }}>
            Última validación: {new Date(lastDistributionTime).toLocaleString('es-CO')}
          </div>
        )}
        <button
          onClick={handleValidarEmpaques}
          disabled={validandoEmpaques}
          style={{
            padding: '1.5rem 4rem',
            background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: validandoEmpaques ? 'not-allowed' : 'pointer',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            boxShadow: '0 6px 12px rgba(234, 88, 12, 0.3)',
            transition: 'all 0.2s ease',
            opacity: validandoEmpaques ? 0.7 : 1,
            width: '100%',
            maxWidth: '500px'
          }}
        >
          {validandoEmpaques ? 'PROCESANDO...' : 'VALIDAR EMPAQUES'}
        </button>
        <p style={{ marginTop: '1rem', color: 'red', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ⚠️ Solo presionar al salir del frigorífico
        </p>
      </div>
      )}

      {/* Sección: Empaques con Prioridad (para_cambio) */}
      {inventarioData?.para_cambio && inventarioData.para_cambio.length > 0 && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <div style={{ padding: '1rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              EMPAQUES CON PRIORIDAD EN NEVERA
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {inventarioData.para_cambio
                .sort((a, b) => a.nombre_ciudad.localeCompare(b.nombre_ciudad))
                .map((ciudad) => {
                  const isCityExpanded = expandedPrioridadCities.has(ciudad.id_ciudad);
                  return (
                    <div
                      key={`prioridad-${ciudad.id_ciudad}`}
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--border-radius-md)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => togglePrioridadCity(ciudad.id_ciudad)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          backgroundColor: 'var(--color-hover-bg)',
                          border: 'none',
                          borderBottom: isCityExpanded ? '1px solid var(--color-border)' : 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {ciudad.nombre_ciudad} ({ciudad.neveras.length} neveras)
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {isCityExpanded ? '▲' : '▼'}
                        </span>
                      </button>
                      {isCityExpanded && (
                        <div
                          style={{
                            padding: '1rem',
                            display: 'grid',
                            gap: '0.75rem',
                            backgroundColor: 'var(--color-card-bg)',
                          }}
                        >
                          {ciudad.neveras.map((nevera) => {
                            const isNeveraExpanded = expandedPrioridadNeveras.has(nevera.id_nevera);
                            return (
                              <div
                                key={`prioridad-nevera-${nevera.id_nevera}`}
                                style={{
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--border-radius-md)',
                                  overflow: 'hidden',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => togglePrioridadNevera(nevera.id_nevera)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--color-modal-bg)',
                                    border: 'none',
                                    borderBottom: isNeveraExpanded ? '1px solid var(--color-border)' : 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
                                      Nevera #{nevera.id_nevera} - {nevera.nombre_tienda}
                                    </h4>
                                    <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                      {nevera.direccion}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        backgroundColor: '#fef3c7',
                                        color: '#b45309',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {nevera.empaques.length} empaques
                                    </span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                      {isNeveraExpanded ? '▲' : '▼'}
                                    </span>
                                  </div>
                                </button>
                                {isNeveraExpanded && (
                                  <div style={{ overflowX: 'auto', backgroundColor: 'white' }}>
                                    <table
                                      className="products-table"
                                      style={{ marginTop: '0', minWidth: '800px', width: '100%' }}
                                    >
                                      <thead>
                                        <tr
                                          className="empaque-header-row"
                                          style={{
                                            backgroundColor: 'var(--color-card-bg)',
                                            fontWeight: 'bold',
                                            color: 'var(--color-text-secondary)',
                                          }}
                                        >
                                          <th style={{ width: '100px' }}>ID Emp.</th>
                                          <th style={{ width: '220px' }}>EPC</th>
                                          <th>Producto</th>
                                          <th style={{ width: '120px' }}>F. Empaque</th>
                                          <th style={{ width: '120px' }}>F. Vencim.</th>
                                          <th style={{ width: '80px' }}>Días</th>
                                          <th style={{ width: '80px' }}>% Trans.</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {nevera.empaques.map((empaque) => (
                                          <tr
                                            key={`prioridad-emp-${empaque.id_empaque}`}
                                            style={{
                                              borderBottom: '1px solid var(--color-border)',
                                            }}
                                          >
                                            <td>{empaque.id_empaque}</td>
                                            <td
                                              style={{
                                                fontWeight: 'bold',
                                                color: '#ff6b35',
                                              }}
                                            >
                                              {empaque.epc}
                                            </td>
                                            <td>{empaque.nombre_producto}</td>
                                            <td>
                                              {new Date(empaque.fecha_empaque_1).toLocaleDateString('es-CO')}
                                            </td>
                                            <td>
                                              {new Date(empaque.fecha_vencimiento).toLocaleDateString('es-CO')}
                                            </td>
                                            <td>{empaque.dias_vencimiento}</td>
                                            <td>
                                              <span
                                                style={{
                                                  padding: '0.15rem 0.4rem',
                                                  borderRadius: '4px',
                                                  backgroundColor:
                                                    empaque.porcentaje_transcurrido >= 90
                                                      ? '#fecaca'
                                                      : empaque.porcentaje_transcurrido >= 75
                                                      ? '#fef3c7'
                                                      : '#bbf7d0',
                                                  color:
                                                    empaque.porcentaje_transcurrido >= 90
                                                      ? '#991b1b'
                                                      : empaque.porcentaje_transcurrido >= 75
                                                      ? '#b45309'
                                                      : '#166534',
                                                  fontWeight: 'bold',
                                                  fontSize: '0.85rem',
                                                }}
                                              >
                                                {empaque.porcentaje_transcurrido.toFixed(1)}%
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Sección: Empaques Vencidos */}
      {inventarioData?.vencidos && inventarioData.vencidos.length > 0 && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <div style={{ padding: '1rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>
              EMPAQUES VENCIDOS EN NEVERA
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {inventarioData.vencidos
                .sort((a, b) => a.nombre_ciudad.localeCompare(b.nombre_ciudad))
                .map((ciudad) => {
                  const isCityExpanded = expandedVencidosCities.has(ciudad.id_ciudad);
                  return (
                    <div
                      key={`vencidos-${ciudad.id_ciudad}`}
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--border-radius-md)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleVencidosCity(ciudad.id_ciudad)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          backgroundColor: '#fef2f2',
                          border: 'none',
                          borderBottom: isCityExpanded ? '1px solid var(--color-border)' : 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: '#dc2626',
                          }}
                        >
                          {ciudad.nombre_ciudad} ({ciudad.neveras.length} neveras)
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {isCityExpanded ? '▲' : '▼'}
                        </span>
                      </button>
                      {isCityExpanded && (
                        <div
                          style={{
                            padding: '1rem',
                            display: 'grid',
                            gap: '0.75rem',
                            backgroundColor: 'var(--color-card-bg)',
                          }}
                        >
                          {ciudad.neveras.map((nevera) => {
                            const isNeveraExpanded = expandedVencidosNeveras.has(nevera.id_nevera);
                            return (
                              <div
                                key={`vencidos-nevera-${nevera.id_nevera}`}
                                style={{
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--border-radius-md)',
                                  overflow: 'hidden',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleVencidosNevera(nevera.id_nevera)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--color-modal-bg)',
                                    border: 'none',
                                    borderBottom: isNeveraExpanded ? '1px solid var(--color-border)' : 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
                                      Nevera #{nevera.id_nevera} - {nevera.nombre_tienda}
                                    </h4>
                                    <p style={{ margin: '0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                      {nevera.direccion}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {nevera.empaques.length} empaques
                                    </span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                      {isNeveraExpanded ? '▲' : '▼'}
                                    </span>
                                  </div>
                                </button>
                                {isNeveraExpanded && (
                                  <div style={{ overflowX: 'auto', backgroundColor: 'white' }}>
                                    <table
                                      className="products-table"
                                      style={{ marginTop: '0', minWidth: '800px', width: '100%' }}
                                    >
                                      <thead>
                                        <tr
                                          className="empaque-header-row"
                                          style={{
                                            backgroundColor: 'var(--color-card-bg)',
                                            fontWeight: 'bold',
                                            color: 'var(--color-text-secondary)',
                                          }}
                                        >
                                          <th style={{ width: '100px' }}>ID Emp.</th>
                                          <th style={{ width: '220px' }}>EPC</th>
                                          <th>Producto</th>
                                          <th style={{ width: '120px' }}>F. Empaque</th>
                                          <th style={{ width: '120px' }}>F. Vencim.</th>
                                          <th style={{ width: '80px' }}>Días</th>
                                          <th style={{ width: '80px' }}>% Trans.</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {nevera.empaques.map((empaque) => (
                                          <tr
                                            key={`vencidos-emp-${empaque.id_empaque}`}
                                            style={{
                                              borderBottom: '1px solid var(--color-border)',
                                              backgroundColor: '#fef2f2',
                                            }}
                                          >
                                            <td>{empaque.id_empaque}</td>
                                            <td
                                              style={{
                                                fontWeight: 'bold',
                                                color: '#dc2626',
                                              }}
                                            >
                                              {empaque.epc}
                                            </td>
                                            <td>{empaque.nombre_producto}</td>
                                            <td>
                                              {new Date(empaque.fecha_empaque_1).toLocaleDateString('es-CO')}
                                            </td>
                                            <td>
                                              {new Date(empaque.fecha_vencimiento).toLocaleDateString('es-CO')}
                                            </td>
                                            <td>{empaque.dias_vencimiento}</td>
                                            <td>
                                              <span
                                                style={{
                                                  padding: '0.15rem 0.4rem',
                                                  borderRadius: '4px',
                                                  backgroundColor: '#fecaca',
                                                  color: '#991b1b',
                                                  fontWeight: 'bold',
                                                  fontSize: '0.85rem',
                                                }}
                                              >
                                                {empaque.porcentaje_transcurrido.toFixed(1)}%
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Nueva sección para neveras surtir — solo logística */}
      {!esAdmin && (
        <>
      <section className="card" style={{ marginTop: '2rem' }}>
        <div style={{ padding: '1rem' }}>
          <h2
            style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}
          >
            Neveras para Surtir
          </h2>

          {!showNeverasSection ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <button
                className="action-button"
                onClick={handleConsultarNeveras}
                disabled={loadingNeveras}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loadingNeveras ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                {loadingNeveras ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          ) : (
            <>
              {loadingNeveras ? (
                <div>Cargando neveras...</div>
              ) : errorNeveras ? (
                <div
                  style={{
                    color: 'red',
                    padding: '1rem',
                    border: '1px solid red',
                    borderRadius: '4px',
                  }}
                >
                  {errorNeveras}
                </div>
              ) : neverasData ? (
                <>
                  {/* Buscador */}
                  <div
                    style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Buscar por ID de nevera..."
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        flex: 1,
                        maxWidth: '300px',
                      }}
                    />
                    <button
                      className="action-button"
                      onClick={handleBuscar}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        minWidth: '80px',
                      }}
                    >
                      Buscar
                    </button>
                  </div>

                  {/* Lista de neveras agrupada por ciudad */}
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {(() => {
                      const filteredNeveras =
                        neverasData.neveras_activas.filter(
                          (nevera) =>
                            searchId === '' ||
                            nevera.id_nevera.toString().includes(searchId)
                        );

                      if (filteredNeveras.length === 0) {
                        return (
                          <p
                            style={{
                              textAlign: 'center',
                              color: 'var(--color-text-secondary)',
                              padding: '2rem',
                            }}
                          >
                            {searchId
                              ? 'No se encontraron neveras con ese ID.'
                              : 'No hay neveras disponibles.'}
                          </p>
                        );
                      }

                      const neverasPorCiudad: Record<string, Nevera[]> = {};
                      filteredNeveras.forEach((nevera) => {
                        const ciudad = nevera.ciudad || 'Sin Ciudad';
                        if (!neverasPorCiudad[ciudad]) {
                          neverasPorCiudad[ciudad] = [];
                        }
                        neverasPorCiudad[ciudad].push(nevera);
                      });

                      const ciudadesOrdenadas =
                        Object.keys(neverasPorCiudad).sort();

                      return ciudadesOrdenadas.map((ciudad) => {
                        const isExpanded =
                          expandedCities.has(ciudad) || searchId !== '';

                        return (
                          <div
                            key={ciudad}
                            style={{
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--border-radius-md)',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleCityExpansion(ciudad)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: 'var(--color-hover-bg)',
                                border: 'none',
                                borderBottom: isExpanded
                                  ? '1px solid var(--color-border)'
                                  : 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 'bold',
                                  fontSize: '1.1rem',
                                  color: 'var(--color-text-primary)',
                                }}
                              >
                                {ciudad} ({neverasPorCiudad[ciudad].length})
                              </span>
                              <span
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div
                                style={{
                                  padding: '1rem',
                                  display: 'grid',
                                  gap: '1rem',
                                  backgroundColor: 'var(--color-card-bg)',
                                }}
                              >
                                {neverasPorCiudad[ciudad].map((nevera) => (
                                  <div
                                    key={nevera.id_nevera}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '1rem',
                                      border: '1px solid var(--color-border)',
                                      borderRadius: 'var(--border-radius-md)',
                                      backgroundColor: 'var(--color-modal-bg)',
                                    }}
                                  >
                                    <div>
                                      <h4
                                        style={{
                                          margin: '0 0 0.25rem 0',
                                          color: 'var(--color-text-primary)',
                                        }}
                                      >
                                        Nevera ID: {nevera.id_nevera}
                                      </h4>
                                      <p
                                        style={{
                                          margin: '0',
                                          color: 'var(--color-text-secondary)',
                                        }}
                                      >
                                        {nevera.nombre_tienda} -{' '}
                                        {nevera.direccion}
                                      </p>
                                    </div>
                                    <div
                                      style={{ display: 'flex', gap: '0.5rem' }}
                                    >
                                      <button
                                        onClick={() =>
                                          handleSurtir(nevera.id_nevera)
                                        }
                                        style={{
                                          padding: '0.5rem 1rem',
                                          backgroundColor: '#059669',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          minWidth: '90px',
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          boxShadow:
                                            '0 2px 4px rgba(0,0,0,0.1)',
                                        }}
                                      >
                                        Inventario
                                      </button>
                                      <button
                                        className="action-button"
                                        onClick={() =>
                                          handleSurtirFlujo(
                                            nevera.id_nevera, nevera.nombre_tienda
                                          )
                                        }
                                        disabled={!esValidacionDelDia()}
                                        title={!esValidacionDelDia() ? 'Debes ejecutar "Validar Empaques" hoy antes de surtir' : ''}
                                        style={{
                                          padding: '0.5rem 1rem',
                                          backgroundColor: esValidacionDelDia() ? '#667eea' : '#9ca3af',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: esValidacionDelDia() ? 'pointer' : 'not-allowed',
                                          minWidth: '80px',
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          opacity: esValidacionDelDia() ? 1 : 0.6,
                                        }}
                                      >
                                        Surtir
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              ) : (
                <p>No se encontraron datos de neveras.</p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Modal para surtir nevera (Inventario) */}
      <SurtirNeveraModal
        isOpen={isSurtirModalOpen}
        onClose={handleCloseSurtirModal}
        idNevera={selectedNeveraId || 0}
      />
        </>
      )}
    </div>
  );
};

export default InventarioView;
