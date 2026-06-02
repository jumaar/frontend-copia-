import React, { useState, useEffect } from "react";
import {
  getLogistica,
  getNeverasSurtir,
  darDeBajaEmpaque,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSurtido } from "../../contexts/SurtidoContext";
import SurtirNeveraModal from "../../components/SurtirNeveraModal";
import DistribuirInventarioModal from "../../components/DistribuirInventarioModal";
import "./LogisticaPage.css";

// Interface para la respuesta de logística que incluye el inventario
interface Empaque {
  id_empaque: number;
  peso_exacto_g: string;
  EPC_id: string;
}

interface EmpaqueEstado6Item {
  id_empaque: number;
  peso_exacto_g: string;
  EPC_id: string;
  porcentaje_transcurrido: number;
}

interface EmpaqueEstado6Data {
  logistica_prioridad: EmpaqueEstado6Item[];
  vencidos: EmpaqueEstado6Item[];
}

interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal: number;
  empaques: Empaque[];
  empaques_estado_6?: EmpaqueEstado6Data;
}

interface EmpaquePrioridad {
  id_empaque: number;
  epc: string;
  id_producto: number;
  nombre_producto: string;
  fecha_empaque_1: string;
  fecha_vencimiento: string;
  dias_vencimiento: number;
  porcentaje_transcurrido: number;
  hora_para_cambio_5: string | null;
}

interface NeveraPrioridad {
  id_nevera: number;
  nombre_tienda: string;
  direccion: string;
  empaques: EmpaquePrioridad[];
}

interface CiudadPrioridad {
  id_ciudad: number;
  nombre_ciudad: string;
  neveras: NeveraPrioridad[];
}

interface LogisticaInventarioResponse {
  productos_por_logistica: Producto[];
  total_productos_diferentes: number;
  total_empaques: number;
  id_logistica_usuario: number;
  ultima_hora_calificacion?: string;
  para_cambio?: CiudadPrioridad[];
  vencidos?: CiudadPrioridad[];
}

// Interface para manejar la posible estructura de la respuesta de logística
interface LogisticaData {
  id_logistica: number;
  nombre_empresa: string;
  placa_vehiculo: string;
}

interface GestionLogisticaResponse {
  logistica: LogisticaData[] | null;
  hermanos?: any[];
}

interface Nevera {
  id_nevera: number;
  nombre_tienda: string;
  direccion: string;
  ciudad?: string;
}

interface NeverasSurtirResponse {
  neveras_activas: Nevera[];
  total_neveras: number;
}

interface UsuarioLogistica {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: string;
}

const LogisticaInventarioPage: React.FC = () => {
  const { user } = useAuth();
  const { iniciarSurtido } = useSurtido();
  const [inventarioData, setInventarioData] =
    useState<LogisticaInventarioResponse | null>(null);
  const [selectedLogisticaId, setSelectedLogisticaId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [expandedVencidosProducts, setExpandedVencidosProducts] = useState<Set<number>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedPrioridadCities, setExpandedPrioridadCities] = useState<Set<number>>(new Set());
  const [expandedPrioridadNeveras, setExpandedPrioridadNeveras] = useState<Set<number>>(new Set());
  const [expandedVencidosCities, setExpandedVencidosCities] = useState<Set<number>>(new Set());
  const [expandedVencidosNeveras, setExpandedVencidosNeveras] = useState<Set<number>>(new Set());

  // Estados para neveras surtir
  const [neverasData, setNeverasData] = useState<NeverasSurtirResponse | null>(
    null
  );
  const [loadingNeveras, setLoadingNeveras] = useState(false);
  const [errorNeveras, setErrorNeveras] = useState<string | null>(null);
  const [searchId, setSearchId] = useState("");
  const [showNeverasSection, setShowNeverasSection] = useState(false);
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);
  const [selectedNeveraId, setSelectedNeveraId] = useState<number | null>(null);
  const [distributing] = useState(false);
  const [isDistribuirInventarioModalOpen, setIsDistribuirInventarioModalOpen] =
    useState(false);
  const [lastDistributionTime, setLastDistributionTime] = useState<string | null>(null);

  const esAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [usuariosLogistica, setUsuariosLogistica] = useState<UsuarioLogistica[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const fetchUsuariosLogistica = async () => {
    try {
      setLoadingUsuarios(true);
      setError(null);
      const response = await getLogistica();
      if (response.usuarios_logistica && Array.isArray(response.usuarios_logistica)) {
        setUsuariosLogistica(response.usuarios_logistica);
      } else {
        setUsuariosLogistica([]);
      }
    } catch (err: any) {
      console.error("Error fetching usuarios logistica:", err);
      setError("Error al cargar la lista de usuarios logística.");
    } finally {
      setLoadingUsuarios(false);
      setLoading(false);
    }
  };

  const handleSeleccionarLogistica = async (idUsuario: number) => {
    try {
      setSelectedUserId(idUsuario);
      setShowUserDropdown(false);
      setLoading(true);
      setError(null);
      const response = await getLogistica(idUsuario);
      if ("productos_por_logistica" in response) {
        setInventarioData(response as LogisticaInventarioResponse);
        setSelectedLogisticaId(response.id_logistica_usuario);
        setLastDistributionTime(response.ultima_hora_calificacion || null);
      } else {
        throw new Error("No se encontraron los datos de inventario.");
      }
    } catch (err: any) {
      console.error("Error fetching logistica data:", err);
      if (err.response?.status === 401) {
        setError("Sesión expirada. Redirigiendo al login...");
        window.location.href = "/login";
      } else {
        setError("Error al cargar los datos de logística. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLogisticaData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener los datos de logística e inventario directamente del endpoint
      const logisticaResponse:
        | LogisticaInventarioResponse
        | GestionLogisticaResponse = await getLogistica();

      // Verificar si la respuesta tiene la estructura de inventario
      if ("productos_por_logistica" in logisticaResponse) {
        // La respuesta ya contiene los datos de inventario
        setInventarioData(logisticaResponse as LogisticaInventarioResponse);
        setSelectedLogisticaId(logisticaResponse.id_logistica_usuario);
        setLastDistributionTime(logisticaResponse.ultima_hora_calificacion || null);
      } else if (
        "logistica" in logisticaResponse &&
        Array.isArray(logisticaResponse.logistica) &&
        logisticaResponse.logistica.length > 0
      ) {
        // Si la respuesta tiene la estructura antigua, usarla para obtener el ID
        const logisticaId = logisticaResponse.logistica[0].id_logistica;
        setSelectedLogisticaId(logisticaId);

        // En este caso, necesitaríamos hacer otra llamada, pero como el usuario dijo
        // que el endpoint /logistica ya devuelve todos los datos, no debería suceder
        throw new Error(
          "La API debería devolver directamente los datos de inventario"
        );
      } else {
        throw new Error(
          "No se encontraron los datos esperados en la respuesta"
        );
      }
    } catch (err: any) {
      console.error("Error fetching logistica data:", err);
      if (err.response?.status === 401) {
        setError("Sesión expirada. Redirigiendo al login...");
        window.location.href = "/login";
      } else {
        setError(
          "Error al cargar los datos de logística. Inténtalo de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      if (esAdmin) {
        fetchUsuariosLogistica();
      } else {
        fetchLogisticaData();
      }
    }
  }, [user?.id]);

  const handleConsultarNeveras = async () => {
    try {
      setLoadingNeveras(true);
      setErrorNeveras(null);
      const neverasResponse: NeverasSurtirResponse = await getNeverasSurtir();
      setNeverasData(neverasResponse);
      setShowNeverasSection(true);
    } catch (err: any) {
      console.error("Error fetching neveras data:", err);
      if (err.response?.status === 401) {
        setErrorNeveras("Sesión expirada. Redirigiendo al login...");
        window.location.href = "/login";
      } else {
        setErrorNeveras(
          "Error al cargar las neveras para surtir. Inténtalo de nuevo."
        );
      }
    } finally {
      setLoadingNeveras(false);
    }
  };
  const toggleProductExpansion = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const toggleVencidosProductExpansion = (productId: number) => {
    const newExpanded = new Set(expandedVencidosProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedVencidosProducts(newExpanded);
  };

  const toggleCityExpansion = (ciudad: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(ciudad)) {
      newExpanded.delete(ciudad);
    } else {
      newExpanded.add(ciudad);
    }
    setExpandedCities(newExpanded);
  };

  const togglePrioridadCity = (cityId: number) => {
    const newExpanded = new Set(expandedPrioridadCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedPrioridadCities(newExpanded);
  };

  const togglePrioridadNevera = (neveraId: number) => {
    const newExpanded = new Set(expandedPrioridadNeveras);
    if (newExpanded.has(neveraId)) {
      newExpanded.delete(neveraId);
    } else {
      newExpanded.add(neveraId);
    }
    setExpandedPrioridadNeveras(newExpanded);
  };

  const toggleVencidosCity = (cityId: number) => {
    const newExpanded = new Set(expandedVencidosCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedVencidosCities(newExpanded);
  };

  const toggleVencidosNevera = (neveraId: number) => {
    const newExpanded = new Set(expandedVencidosNeveras);
    if (newExpanded.has(neveraId)) {
      newExpanded.delete(neveraId);
    } else {
      newExpanded.add(neveraId);
    }
    setExpandedVencidosNeveras(newExpanded);
  };

  const handleSurtir = (idNevera: number) => {
    setSelectedNeveraId(idNevera);
    setIsSurtirModalOpen(true);
  };

  const handleSurtirFlujo = (idNevera: number, nombreTienda: string) => {
    iniciarSurtido({
      idNevera,
      nombreTienda,
      stockData: [],
      phase: 'review',
      neveraData: null,
      scannedEpcs: [],
      confirmations: {},
    });
  };

  const handleCloseSurtirModal = () => {
    setIsSurtirModalOpen(false);
    setSelectedNeveraId(null);
  };

  const handleBuscar = () => {
    // La búsqueda se hace automáticamente con el filtro en el render
    // Aquí podríamos agregar lógica adicional si es necesario
  };

  const handleDistribuir = async () => {
    setIsDistribuirInventarioModalOpen(true);
  };

  const handleCloseDistribuirInventarioModal = () => {
    setIsDistribuirInventarioModalOpen(false);
  };

  const handleDistribuirInventario = () => {
    // Recargar datos de neveras después de la distribución
    if (showNeverasSection) {
      handleConsultarNeveras();
    }
    // Recargar datos de logística para actualizar ultima_hora_calificacion
    fetchLogisticaData();
  };

  if (loading && !esAdmin) {
    return <div className="management-page">Cargando inventario...</div>;
  }

  if (esAdmin && loadingUsuarios) {
    return <div className="management-page">Cargando usuarios logística...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>{esAdmin ? 'Inventario de Logística' : 'Inventario Recibido'}</h1>
        <p>{esAdmin ? 'Selecciona un usuario logística para consultar su inventario' : 'Empaques listos y confirmados para entregas en tiendas'}</p>
      </div>

      {esAdmin && (
        <div className="usuario-selector" style={{ marginBottom: '1.5rem' }}>
          <div className="selector-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              SELECCIONAR LOGÍSTICA:
            </h3>
            {usuariosLogistica.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                No hay usuarios logística relacionados disponibles.
              </p>
            ) : (
              <div className="meses-dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {selectedUserId && usuariosLogistica.length > 0 ? (
                    <span>
                      {(() => {
                        const usuario = usuariosLogistica.find(u => u.id_usuario === selectedUserId);
                        return usuario ? `${usuario.nombre_usuario} ${usuario.apellido_usuario} (ID: ${usuario.id_usuario})` : 'Selecciona una logística...';
                      })()}
                    </span>
                  ) : (
                    <span>Selecciona una logística...</span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showUserDropdown && (
                  <div className="dropdown-menu">
                    {usuariosLogistica.map(usuario => (
                      <div key={usuario.id_usuario} className="dropdown-item">
                        <span className="mes-fecha">
                          {usuario.nombre_usuario} {usuario.apellido_usuario} (ID: {usuario.id_usuario})
                        </span>
                        <button
                          className={`btn-consultar ${selectedUserId === usuario.id_usuario ? 'activo' : ''}`}
                          onClick={() => handleSeleccionarLogistica(usuario.id_usuario)}
                          disabled={loading}
                        >
                          {loading && selectedUserId === usuario.id_usuario ? 'Consultando...' : 'Consultar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {selectedUserId && usuariosLogistica.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                {(() => {
                  const usuario = usuariosLogistica.find(u => u.id_usuario === selectedUserId);
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

      {esAdmin && !selectedUserId && !loading ? (
        <div className="no-selection-message">
          <div className="no-selection-content">
            <span className="no-selection-icon">📋</span>
            <h3>Selecciona un usuario logística para ver su inventario</h3>
            <p>Elige un usuario de la lista desplegable para consultar sus productos en inventario.</p>
          </div>
        </div>
      ) : (!esAdmin || (esAdmin && inventarioData)) ? (
      <section
        className="card"
        style={{ marginTop: "calc(var(--spacing-unit) * -4)" }}
      >
        <div style={{ padding: "1rem" }}>
          {error ? (
            <div
              style={{
                color: "red",
                padding: "1rem",
                border: "1px solid red",
                borderRadius: "4px",
              }}
            >
              {error}
            </div>
          ) : inventarioData ? (
            <>
              {/* Calcular peso total de todos los productos incluyendo estado 6 */}
              {(() => {
                const pesoTotal =
                  inventarioData!.productos_por_logistica.reduce(
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

                const totalEmpaquesAll = inventarioData!.productos_por_logistica.reduce(
                  (sum, p) =>
                    sum +
                    p.empaques.length +
                    (p.empaques_estado_6?.logistica_prioridad?.length || 0) +
                    (p.empaques_estado_6?.vencidos?.length || 0),
                  0
                );

                const totalE2 = inventarioData!.productos_por_logistica.reduce(
                  (sum, p) => sum + p.empaques.length, 0
                );
                const totalPrioridad = inventarioData!.productos_por_logistica.reduce(
                  (sum, p) => sum + (p.empaques_estado_6?.logistica_prioridad?.length || 0), 0
                );
                const totalVencidosLog = inventarioData!.productos_por_logistica.reduce(
                  (sum, p) => sum + (p.empaques_estado_6?.vencidos?.length || 0), 0
                );
                return (
                  <div
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--color-card-bg)",
                      padding: "1rem",
                      borderRadius: "var(--border-radius)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        Total de Productos Diferentes:{" "}
                        {inventarioData.total_productos_diferentes}
                      </h3>
                      <p
                        style={{
                          margin: "0.25rem 0 0 0",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        ID Logística: {selectedLogisticaId}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <h3
                        style={{ margin: "0", color: "var(--color-primary)" }}
                      >
                        Peso Total: {(pesoTotal / 1000).toFixed(2)} kg
                      </h3>
                      <p
                        style={{
                          margin: "0.25rem 0 0 0",
                          color: "var(--color-text-secondary)",
                          fontSize: "0.9rem",
                        }}
                       >
                        {totalEmpaquesAll} empaques total
                        {" "}
                        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
                          ({totalE2} normales
                          {totalPrioridad > 0 && <span style={{ color: "#b45309" }}>, {totalPrioridad} prioridad</span>}
                          {totalVencidosLog > 0 && <span style={{ color: "#dc2626" }}>, {totalVencidosLog} vencidos</span>})
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Tabla de productos */}
              {inventarioData.productos_por_logistica.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                    padding: "2rem",
                  }}
                >
                  No hay productos en inventario para mostrar.
                </p>
              ) : (
                <div
                  className="products-container"
                  style={{ overflowX: "auto" }}
                >
                  <table
                    className="products-table"
                    style={{ marginTop: "1rem", minWidth: "950px" }}
                  >
                    <tbody>
                      {inventarioData.productos_por_logistica.map(
                        (producto) => (
                          <React.Fragment key={producto.id_producto}>
                            <tr
                              className="product-header-row"
                              style={{
                                backgroundColor: "var(--color-hover-bg)",
                                borderBottom: "2px solid var(--color-border)",
                              }}
                            >
                              <td colSpan={4}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.5rem",
                                    gap: "1rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "bold",
                                      color: "var(--color-text-primary)",
                                    }}
                                  >
                                    {producto.id_producto} -{" "}
                                    {producto.nombre_producto}{" "}
                                    {producto.peso_nominal}g
                                  </span>
                                  <button
                                    onClick={() =>
                                      toggleProductExpansion(
                                        producto.id_producto
                                      )
                                    }
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontWeight: "bold",
                                      color: "var(--color-primary)",
                                      textDecoration: "underline",
                                      padding: "0.25rem 0.5rem",
                                    }}
                                  >
                                    Ver {producto.empaques.length + (producto.empaques_estado_6?.logistica_prioridad?.length || 0)} empaques{" "}
                                    {expandedProducts.has(producto.id_producto)
                                      ? "▲"
                                      : "▼"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedProducts.has(producto.id_producto) && (
                              <>
                                <tr
                                  className="empaque-header-row"
                                  style={{
                                    backgroundColor: "var(--color-card-bg)",
                                    fontWeight: "bold",
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  <th style={{ width: "100px" }}>
                                    ID Empaque
                                  </th>
                                  <th style={{ width: "250px" }}>Producto</th>
                                  <th style={{ width: "150px" }}>Peso (g)</th>
                                  <th>EPC ID</th>
                                </tr>
                                {producto.empaques_estado_6?.logistica_prioridad && producto.empaques_estado_6.logistica_prioridad.length > 0 &&
                                  producto.empaques_estado_6.logistica_prioridad.map((empaque) => (
                                    <tr
                                      key={`prioridad-${producto.id_producto}-${empaque.id_empaque}`}
                                      style={{
                                        borderBottom: "1px solid #f59e0b",
                                        background: "#fffbeb",
                                      }}
                                    >
                                      <td style={{ fontWeight: "bold", color: "#b45309" }}>
                                        <span style={{
                                          display: "inline-block",
                                          padding: "0.1rem 0.4rem",
                                          borderRadius: "3px",
                                          backgroundColor: "#ef4444",
                                          color: "white",
                                          fontSize: "0.65rem",
                                          fontWeight: "bold",
                                          marginRight: "0.35rem",
                                          verticalAlign: "middle",
                                          textTransform: "uppercase",
                                        }}>
                                          PRIORIDAD
                                        </span>
                                        {empaque.id_empaque}
                                      </td>
                                      <td style={{ fontWeight: "bold", color: "#b45309" }}>
                                        {producto.nombre_producto}
                                      </td>
                                      <td style={{ fontWeight: "bold", color: "#b45309" }}>
                                        {parseFloat(empaque.peso_exacto_g).toFixed(2)} g
                                      </td>
                                      <td>
                                        <span style={{ fontWeight: "bold", color: "#b45309" }}>
                                          {empaque.EPC_id}
                                        </span>
                                        <span style={{
                                          display: "inline-block",
                                          marginLeft: "0.5rem",
                                          padding: "0.1rem 0.35rem",
                                          borderRadius: "4px",
                                          backgroundColor: empaque.porcentaje_transcurrido >= 90 ? "#fecaca" : empaque.porcentaje_transcurrido >= 75 ? "#fef3c7" : "#bbf7d0",
                                          color: empaque.porcentaje_transcurrido >= 90 ? "#991b1b" : empaque.porcentaje_transcurrido >= 75 ? "#b45309" : "#166534",
                                          fontSize: "0.75rem",
                                          fontWeight: "bold",
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
                                        "1px solid var(--color-border)",
                                    }}
                                  >
                                    <td>{empaque.id_empaque}</td>
                                    <td>{producto.nombre_producto}</td>
                                    <td>
                                      {parseFloat(
                                        empaque.peso_exacto_g
                                      ).toFixed(2)}{" "}
                                      g
                                    </td>
                                    <td
                                      style={{
                                        fontWeight: "bold",
                                        color: "#ff6b35",
                                      }}
                                    >
                                      {" "}
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
      ) : null }

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
          <section className="card" style={{ marginTop: "1rem" }}>
            <div style={{ padding: "1rem" }}>
              <h2 style={{ marginBottom: "1rem", color: "#dc2626" }}>
                Empaques Vencidos
              </h2>
              <div className="products-container" style={{ overflowX: "auto" }}>
                <table className="products-table" style={{ marginTop: "1rem", minWidth: "950px" }}>
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
                                backgroundColor: "#fef2f2",
                                borderBottom: "2px solid #fca5a5",
                              }}
                            >
                              <td colSpan={5}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.5rem",
                                    gap: "1rem",
                                  }}
                                >
                                  <span style={{ fontWeight: "bold", color: "#dc2626" }}>
                                    {idProducto} - {nombreProducto}
                                  </span>
                                  <button
                                    onClick={() => toggleVencidosProductExpansion(productoId)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontWeight: "bold",
                                      color: "#dc2626",
                                      textDecoration: "underline",
                                      padding: "0.25rem 0.5rem",
                                    }}
                                  >
                                    Ver {empaques.length} empaques vencidos{" "}
                                    {isExpanded ? "▲" : "▼"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <>
                                <tr
                                  className="empaque-header-row"
                                  style={{
                                    backgroundColor: "var(--color-card-bg)",
                                    fontWeight: "bold",
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  <th style={{ width: "100px" }}>ID Emp.</th>
                                  <th style={{ width: "200px" }}>Producto</th>
                                  <th style={{ width: "120px" }}>Peso (g)</th>
                                  <th>EPC</th>
                                  {esAdmin && <th style={{ width: "90px" }}>Acción</th>}
                                </tr>
                                {empaques.map((empaque) => (
                                  <tr
                                    key={`vencidos-tabla-emp-${empaque.id_empaque}`}
                                    style={{
                                      borderBottom: "1px solid var(--color-border)",
                                      backgroundColor: "#fff5f5",
                                    }}
                                  >
                                    <td>{empaque.id_empaque}</td>
                                    <td>{empaque.nombre_producto}</td>
                                    <td>{parseFloat(empaque.peso_exacto_g).toFixed(2)} g</td>
                                    <td>
                                      <span style={{ fontWeight: "bold", color: "#dc2626" }}>
                                        {empaque.EPC_id}
                                      </span>
                                      <span
                                        style={{
                                          display: "inline-block",
                                          marginLeft: "0.5rem",
                                          padding: "0.1rem 0.35rem",
                                          borderRadius: "4px",
                                          backgroundColor: empaque.porcentaje_transcurrido >= 90 ? "#fecaca" : empaque.porcentaje_transcurrido >= 75 ? "#fef3c7" : "#bbf7d0",
                                          color: empaque.porcentaje_transcurrido >= 90 ? "#991b1b" : empaque.porcentaje_transcurrido >= 75 ? "#b45309" : "#166534",
                                          fontSize: "0.75rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {empaque.porcentaje_transcurrido.toFixed(0)}%
                                      </span>
                                    </td>
                                    {esAdmin && (
                                      <td>
                                        <button
                                          onClick={async () => {
                                            if (!window.confirm(`¿Dar de baja el empaque ${empaque.id_empaque} del producto ${empaque.nombre_producto}?`)) return;
                                            try {
                                              await darDeBajaEmpaque(empaque.id_empaque);
                                              alert(`Empaque ${empaque.id_empaque} dado de baja exitosamente.`);
                                              if (esAdmin && selectedUserId) {
                                                handleSeleccionarLogistica(selectedUserId);
                                              } else {
                                                fetchLogisticaData();
                                              }
                                            } catch (err: any) {
                                              alert(err.response?.data?.message || 'Error al dar de baja el empaque.');
                                            }
                                          }}
                                          style={{
                                            padding: "0.2rem 0.4rem",
                                            backgroundColor: "#dc2626",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            fontSize: "0.75rem",
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

      {/* Sección del botón de distribuir — solo logística */}
      {!esAdmin && (
      <div style={{ marginTop: "2rem", textAlign: "center", padding: "1rem" }}>
        {lastDistributionTime && (
          <div style={{ marginBottom: "1rem", color: "white", fontSize: "0.9rem" }}>
            Última distribución: {new Date(lastDistributionTime).toLocaleString('es-CO')}
          </div>
        )}
        <button
          onClick={handleDistribuir}
          disabled={distributing}
          style={{
            padding: "1.5rem 4rem",
            background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)", // Orange gradient
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: distributing ? "not-allowed" : "pointer",
            fontSize: "1.5rem",
            fontWeight: "bold",
            boxShadow: "0 6px 12px rgba(234, 88, 12, 0.3)",
            transition: "all 0.2s ease",
            opacity: distributing ? 0.7 : 1,
            width: "100%",
            maxWidth: "500px"
          }}
        >
          {distributing ? "PROCESANDO..." : "DISTRIBUIR INVENTARIO"}
        </button>
        <p style={{ marginTop: "1rem", color: "red", fontSize: "0.9rem", fontWeight: "bold" }}>
          ⚠️ Solo presionar al salir del frigorífico
        </p>
      </div>
      )}

      {/* Sección: Empaques con Prioridad (para_cambio) */}
      {inventarioData?.para_cambio && inventarioData.para_cambio.length > 0 && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <div style={{ padding: "1rem" }}>
            <h2 style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}>
              EMPAQUES CON PRIORIDAD EN NEVERA
            </h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {inventarioData.para_cambio
                .sort((a, b) => a.nombre_ciudad.localeCompare(b.nombre_ciudad))
                .map((ciudad) => {
                  const isCityExpanded = expandedPrioridadCities.has(ciudad.id_ciudad);
                  return (
                    <div
                      key={`prioridad-${ciudad.id_ciudad}`}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--border-radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => togglePrioridadCity(ciudad.id_ciudad)}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1rem",
                          backgroundColor: "var(--color-hover-bg)",
                          border: "none",
                          borderBottom: isCityExpanded ? "1px solid var(--color-border)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {ciudad.nombre_ciudad} ({ciudad.neveras.length} neveras)
                        </span>
                        <span style={{ color: "var(--color-text-secondary)" }}>
                          {isCityExpanded ? "▲" : "▼"}
                        </span>
                      </button>
                      {isCityExpanded && (
                        <div
                          style={{
                            padding: "1rem",
                            display: "grid",
                            gap: "0.75rem",
                            backgroundColor: "var(--color-card-bg)",
                          }}
                        >
                          {ciudad.neveras.map((nevera) => {
                            const isNeveraExpanded = expandedPrioridadNeveras.has(nevera.id_nevera);
                            return (
                              <div
                                key={`prioridad-nevera-${nevera.id_nevera}`}
                                style={{
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--border-radius-md)",
                                  overflow: "hidden",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => togglePrioridadNevera(nevera.id_nevera)}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.75rem",
                                    backgroundColor: "white",
                                    border: "none",
                                    borderBottom: isNeveraExpanded ? "1px solid var(--color-border)" : "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  <div>
                                    <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--color-text-primary)" }}>
                                      Nevera #{nevera.id_nevera} - {nevera.nombre_tienda}
                                    </h4>
                                    <p style={{ margin: "0", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                                      {nevera.direccion}
                                    </p>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span
                                      style={{
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "999px",
                                        backgroundColor: "#fef3c7",
                                        color: "#b45309",
                                        fontWeight: "bold",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {nevera.empaques.length} empaques
                                    </span>
                                    <span style={{ color: "var(--color-text-secondary)" }}>
                                      {isNeveraExpanded ? "▲" : "▼"}
                                    </span>
                                  </div>
                                </button>
                                {isNeveraExpanded && (
                                  <div style={{ overflowX: "auto", backgroundColor: "white" }}>
                                    <table
                                      className="products-table"
                                      style={{ marginTop: "0", minWidth: "800px", width: "100%" }}
                                    >
                                      <thead>
                                        <tr
                                          className="empaque-header-row"
                                          style={{
                                            backgroundColor: "var(--color-card-bg)",
                                            fontWeight: "bold",
                                            color: "var(--color-text-secondary)",
                                          }}
                                        >
                                          <th style={{ width: "100px" }}>ID Emp.</th>
                                          <th style={{ width: "220px" }}>EPC</th>
                                          <th>Producto</th>
                                          <th style={{ width: "120px" }}>F. Empaque</th>
                                          <th style={{ width: "120px" }}>F. Vencim.</th>
                                          <th style={{ width: "80px" }}>Días</th>
                                          <th style={{ width: "80px" }}>% Trans.</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {nevera.empaques.map((empaque) => (
                                          <tr
                                            key={`prioridad-emp-${empaque.id_empaque}`}
                                            style={{
                                              borderBottom: "1px solid var(--color-border)",
                                            }}
                                          >
                                            <td>{empaque.id_empaque}</td>
                                            <td
                                              style={{
                                                fontWeight: "bold",
                                                color: "#ff6b35",
                                              }}
                                            >
                                              {empaque.epc}
                                            </td>
                                            <td>{empaque.nombre_producto}</td>
                                            <td>
                                              {new Date(empaque.fecha_empaque_1).toLocaleDateString("es-CO")}
                                            </td>
                                            <td>
                                              {new Date(empaque.fecha_vencimiento).toLocaleDateString("es-CO")}
                                            </td>
                                            <td>{empaque.dias_vencimiento}</td>
                                            <td>
                                              <span
                                                style={{
                                                  padding: "0.15rem 0.4rem",
                                                  borderRadius: "4px",
                                                  backgroundColor:
                                                    empaque.porcentaje_transcurrido >= 90
                                                      ? "#fecaca"
                                                      : empaque.porcentaje_transcurrido >= 75
                                                      ? "#fef3c7"
                                                      : "#bbf7d0",
                                                  color:
                                                    empaque.porcentaje_transcurrido >= 90
                                                      ? "#991b1b"
                                                      : empaque.porcentaje_transcurrido >= 75
                                                      ? "#b45309"
                                                      : "#166534",
                                                  fontWeight: "bold",
                                                  fontSize: "0.85rem",
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
        <section className="card" style={{ marginTop: "1rem" }}>
          <div style={{ padding: "1rem" }}>
            <h2 style={{ marginBottom: "1rem", color: "#dc2626" }}>
              EMPAQUES VENCIDOS EN NEVERA
            </h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {inventarioData.vencidos
                .sort((a, b) => a.nombre_ciudad.localeCompare(b.nombre_ciudad))
                .map((ciudad) => {
                  const isCityExpanded = expandedVencidosCities.has(ciudad.id_ciudad);
                  return (
                    <div
                      key={`vencidos-${ciudad.id_ciudad}`}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--border-radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleVencidosCity(ciudad.id_ciudad)}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1rem",
                          backgroundColor: "#fef2f2",
                          border: "none",
                          borderBottom: isCityExpanded ? "1px solid var(--color-border)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            color: "#dc2626",
                          }}
                        >
                          {ciudad.nombre_ciudad} ({ciudad.neveras.length} neveras)
                        </span>
                        <span style={{ color: "var(--color-text-secondary)" }}>
                          {isCityExpanded ? "▲" : "▼"}
                        </span>
                      </button>
                      {isCityExpanded && (
                        <div
                          style={{
                            padding: "1rem",
                            display: "grid",
                            gap: "0.75rem",
                            backgroundColor: "var(--color-card-bg)",
                          }}
                        >
                          {ciudad.neveras.map((nevera) => {
                            const isNeveraExpanded = expandedVencidosNeveras.has(nevera.id_nevera);
                            return (
                              <div
                                key={`vencidos-nevera-${nevera.id_nevera}`}
                                style={{
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--border-radius-md)",
                                  overflow: "hidden",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleVencidosNevera(nevera.id_nevera)}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.75rem",
                                    backgroundColor: "white",
                                    border: "none",
                                    borderBottom: isNeveraExpanded ? "1px solid var(--color-border)" : "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  <div>
                                    <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--color-text-primary)" }}>
                                      Nevera #{nevera.id_nevera} - {nevera.nombre_tienda}
                                    </h4>
                                    <p style={{ margin: "0", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                                      {nevera.direccion}
                                    </p>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span
                                      style={{
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "999px",
                                        backgroundColor: "#fee2e2",
                                        color: "#dc2626",
                                        fontWeight: "bold",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {nevera.empaques.length} empaques
                                    </span>
                                    <span style={{ color: "var(--color-text-secondary)" }}>
                                      {isNeveraExpanded ? "▲" : "▼"}
                                    </span>
                                  </div>
                                </button>
                                {isNeveraExpanded && (
                                  <div style={{ overflowX: "auto", backgroundColor: "white" }}>
                                    <table
                                      className="products-table"
                                      style={{ marginTop: "0", minWidth: "800px", width: "100%" }}
                                    >
                                      <thead>
                                        <tr
                                          className="empaque-header-row"
                                          style={{
                                            backgroundColor: "var(--color-card-bg)",
                                            fontWeight: "bold",
                                            color: "var(--color-text-secondary)",
                                          }}
                                        >
                                          <th style={{ width: "100px" }}>ID Emp.</th>
                                          <th style={{ width: "220px" }}>EPC</th>
                                          <th>Producto</th>
                                          <th style={{ width: "120px" }}>F. Empaque</th>
                                          <th style={{ width: "120px" }}>F. Vencim.</th>
                                          <th style={{ width: "80px" }}>Días</th>
                                          <th style={{ width: "80px" }}>% Trans.</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {nevera.empaques.map((empaque) => (
                                          <tr
                                            key={`vencidos-emp-${empaque.id_empaque}`}
                                            style={{
                                              borderBottom: "1px solid var(--color-border)",
                                              backgroundColor: "#fef2f2",
                                            }}
                                          >
                                            <td>{empaque.id_empaque}</td>
                                            <td
                                              style={{
                                                fontWeight: "bold",
                                                color: "#dc2626",
                                              }}
                                            >
                                              {empaque.epc}
                                            </td>
                                            <td>{empaque.nombre_producto}</td>
                                            <td>
                                              {new Date(empaque.fecha_empaque_1).toLocaleDateString("es-CO")}
                                            </td>
                                            <td>
                                              {new Date(empaque.fecha_vencimiento).toLocaleDateString("es-CO")}
                                            </td>
                                            <td>{empaque.dias_vencimiento}</td>
                                            <td>
                                              <span
                                                style={{
                                                  padding: "0.15rem 0.4rem",
                                                  borderRadius: "4px",
                                                  backgroundColor: "#fecaca",
                                                  color: "#991b1b",
                                                  fontWeight: "bold",
                                                  fontSize: "0.85rem",
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
      <section className="card" style={{ marginTop: "2rem" }}>
        <div style={{ padding: "1rem" }}>
          <h2
            style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}
          >
            Neveras para Surtir
          </h2>

          {!showNeverasSection ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <button
                className="action-button"
                onClick={handleConsultarNeveras}
                disabled={loadingNeveras}
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loadingNeveras ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {loadingNeveras ? "Consultando..." : "Consultar"}
              </button>
            </div>
          ) : (
            <>
              {loadingNeveras ? (
                <div>Cargando neveras...</div>
              ) : errorNeveras ? (
                <div
                  style={{
                    color: "red",
                    padding: "1rem",
                    border: "1px solid red",
                    borderRadius: "4px",
                  }}
                >
                  {errorNeveras}
                </div>
              ) : neverasData ? (
                <>
                  {/* Buscador */}
                  <div
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Buscar por ID de nevera..."
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--color-border)",
                        flex: 1,
                        maxWidth: "300px",
                      }}
                    />
                    <button
                      className="action-button"
                      onClick={handleBuscar}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        minWidth: "80px",
                      }}
                    >
                      Buscar
                    </button>
                  </div>

                  {/* Lista de neveras agrupada por ciudad */}
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {(() => {
                      // Filtrar neveras primero
                      const filteredNeveras =
                        neverasData.neveras_activas.filter(
                          (nevera) =>
                            searchId === "" ||
                            nevera.id_nevera.toString().includes(searchId)
                        );

                      if (filteredNeveras.length === 0) {
                        return (
                          <p
                            style={{
                              textAlign: "center",
                              color: "var(--color-text-secondary)",
                              padding: "2rem",
                            }}
                          >
                            {searchId
                              ? "No se encontraron neveras con ese ID."
                              : "No hay neveras disponibles."}
                          </p>
                        );
                      }

                      // Agrupar por ciudad
                      const neverasPorCiudad: Record<string, Nevera[]> = {};
                      filteredNeveras.forEach((nevera) => {
                        const ciudad = nevera.ciudad || "Sin Ciudad";
                        if (!neverasPorCiudad[ciudad]) {
                          neverasPorCiudad[ciudad] = [];
                        }
                        neverasPorCiudad[ciudad].push(nevera);
                      });

                      // Ordenar ciudades alfabéticamente
                      const ciudadesOrdenadas =
                        Object.keys(neverasPorCiudad).sort();

                      return ciudadesOrdenadas.map((ciudad) => {
                        const isExpanded =
                          expandedCities.has(ciudad) || searchId !== ""; // Expandir si hay búsqueda

                        return (
                          <div
                            key={ciudad}
                            style={{
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--border-radius-md)",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleCityExpansion(ciudad)}
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "1rem",
                                backgroundColor: "var(--color-hover-bg)",
                                border: "none",
                                borderBottom: isExpanded
                                  ? "1px solid var(--color-border)"
                                  : "none",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "1.1rem",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {ciudad} ({neverasPorCiudad[ciudad].length})
                              </span>
                              <span
                                style={{ color: "var(--color-text-secondary)" }}
                              >
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            </button>

                            {isExpanded && (
                              <div
                                style={{
                                  padding: "1rem",
                                  display: "grid",
                                  gap: "1rem",
                                  backgroundColor: "var(--color-card-bg)",
                                }}
                              >
                                {neverasPorCiudad[ciudad].map((nevera) => (
                                  <div
                                    key={nevera.id_nevera}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      padding: "1rem",
                                      border: "1px solid var(--color-border)",
                                      borderRadius: "var(--border-radius-md)",
                                      backgroundColor: "white",
                                    }}
                                  >
                                    <div>
                                      <h4
                                        style={{
                                          margin: "0 0 0.25rem 0",
                                          color: "var(--color-text-primary)",
                                        }}
                                      >
                                        Nevera ID: {nevera.id_nevera}
                                      </h4>
                                      <p
                                        style={{
                                          margin: "0",
                                          color: "var(--color-text-secondary)",
                                        }}
                                      >
                                        {nevera.nombre_tienda} -{" "}
                                        {nevera.direccion}
                                      </p>
                                    </div>
                                    <div
                                      style={{ display: "flex", gap: "0.5rem" }}
                                    >
                                      <button
                                        onClick={() =>
                                          handleSurtir(nevera.id_nevera)
                                        }
                                        style={{
                                          padding: "0.5rem 1rem",
                                          backgroundColor: "#059669",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "6px",
                                          cursor: "pointer",
                                          minWidth: "90px",
                                          fontSize: "0.9rem",
                                          fontWeight: "bold",
                                          boxShadow:
                                            "0 2px 4px rgba(0,0,0,0.1)",
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
                                        style={{
                                          padding: "0.5rem 1rem",
                                          backgroundColor: "#667eea",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "6px",
                                          cursor: "pointer",
                                          minWidth: "80px",
                                          fontSize: "0.9rem",
                                          fontWeight: "bold",
                                          opacity: 1,
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

      {/* Modal de distribuir inventario — solo logística */}
      {!esAdmin && (
      <DistribuirInventarioModal
        isOpen={isDistribuirInventarioModalOpen}
        onClose={handleCloseDistribuirInventarioModal}
        onDistribuir={handleDistribuirInventario}
        lastDistributionTime={lastDistributionTime}
      />
      )}
    </div>
  );
};

export default LogisticaInventarioPage;
