import React, { useState, useEffect } from "react";
import {
  getLogistica,
  getNeverasSurtir,
  confirmarSurtidoNevera,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import SurtirNeveraModal from "../../components/SurtirNeveraModal";
import ConfirmarSurtidoModal from "../../components/ConfirmarSurtidoModal";
import DistribuirInventarioModal from "../../components/DistribuirInventarioModal";
import "./LogisticaPage.css";

// Interface para la respuesta de logística que incluye el inventario
interface Empaque {
  peso_exacto_g: string;
  EPC_id: string;
}

interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal: number; // El peso nominal viene directamente de la API
  empaques: Empaque[];
}

interface LogisticaInventarioResponse {
  productos_por_logistica: Producto[];
  total_productos_diferentes: number;
  total_empaques: number;
  id_logistica_usuario: number;
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
const LogisticaInventarioPage: React.FC = () => {
  const { user } = useAuth();
  const [inventarioData, setInventarioData] =
    useState<LogisticaInventarioResponse | null>(null);
  const [selectedLogisticaId, setSelectedLogisticaId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

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
  const [isConfirmarSurtidoModalOpen, setIsConfirmarSurtidoModalOpen] =
    useState(false);
  const [selectedNeveraNombre, setSelectedNeveraNombre] = useState<string>("");
  const [distributing] = useState(false);
  const [isDistribuirInventarioModalOpen, setIsDistribuirInventarioModalOpen] =
    useState(false);

  useEffect(() => {
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

    if (user?.id) {
      fetchLogisticaData();
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

  const toggleCityExpansion = (ciudad: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(ciudad)) {
      newExpanded.delete(ciudad);
    } else {
      newExpanded.add(ciudad);
    }
    setExpandedCities(newExpanded);
  };

  const handleSurtir = (idNevera: number) => {
    setSelectedNeveraId(idNevera);
    setIsSurtirModalOpen(true);
  };

  const handleConfirmarSurtir = (idNevera: number) => {
    // Buscar el nombre de la nevera
    const nevera = neverasData?.neveras_activas.find(
      (n) => n.id_nevera === idNevera
    );
    setSelectedNeveraId(idNevera);
    setSelectedNeveraNombre(nevera ? nevera.nombre_tienda : "Tienda");
    setIsConfirmarSurtidoModalOpen(true);
  };

  const handleRealizarSurtido = async (idNevera: number) => {
    try {
      console.log(`🚀 Iniciando surtido para nevera ID: ${idNevera}`);

      // Realizar la petición GET para confirmar el surtido
      const response = await confirmarSurtidoNevera(idNevera);

      alert(
        `✅ ${
          response.message || "Surtido confirmado exitosamente"
        }\n\n📅 Timestamp: ${new Date().toLocaleString("es-CO")}`
      );

      // Cerrar el modal
      setIsConfirmarSurtidoModalOpen(false);
      setSelectedNeveraId(null);
      setSelectedNeveraNombre("");

      // Recargar los datos si es necesario (opcional)
      console.log("✅ Surtido completado:", response);
    } catch (error: any) {
      console.error("❌ Error al realizar el surtido:", error);

      // Manejar errores específicos
      if (error.response?.status === 404) {
        alert("❌ Nevera no encontrada. Verifica el ID de la nevera.");
      } else if (error.response?.status === 403) {
        alert("❌ No tienes permisos para surtir esta nevera.");
      } else if (error.response?.status === 400) {
        alert(
          "❌ Error en los datos. La nevera no puede ser surtida en este momento."
        );
      } else if (error.response?.status === 401) {
        alert("⚠️ Sesión expirada. Redirigiendo al login...");
        window.location.href = "/login";
      } else {
        alert("❌ Error al realizar el surtido. Por favor intenta de nuevo.");
      }
    }
  };

  const handleCloseConfirmarSurtidoModal = () => {
    setIsConfirmarSurtidoModalOpen(false);
    setSelectedNeveraId(null);
    setSelectedNeveraNombre("");
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
  };

  if (loading) {
    return <div className="management-page">Cargando inventario...</div>;
  }

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventario Recibido</h1>
        <p>Empaques listos y confirmados para entregas en tiendas</p>
      </div>

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
              {/* Calcular peso total de todos los productos */}
              {(() => {
                const pesoTotal =
                  inventarioData!.productos_por_logistica.reduce(
                    (total: number, producto: Producto) => {
                      const pesoProducto = producto.empaques.reduce(
                        (sum: number, empaque: Empaque) => {
                          return sum + parseFloat(empaque.peso_exacto_g);
                        },
                        0
                      );
                      return total + pesoProducto;
                    },
                    0
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
                        {inventarioData.total_empaques} empaques total
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
                                    Ver {producto.empaques.length} empaques{" "}
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
                                    ID Producto
                                  </th>
                                  <th style={{ width: "250px" }}>Producto</th>
                                  <th style={{ width: "150px" }}>Peso (g)</th>
                                  <th>EPC ID</th>
                                </tr>
                                {producto.empaques.map((empaque, index) => (
                                  <tr
                                    key={`${producto.id_producto}-${index}`}
                                    style={{
                                      borderBottom:
                                        "1px solid var(--color-border)",
                                    }}
                                  >
                                    <td>{producto.id_producto}</td>
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

      {/* Sección del botón de distribuir */}
      <div style={{ marginTop: "2rem", textAlign: "center", padding: "1rem" }}>
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

      {/* Nueva sección para neveras surtir */}
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
                                          handleConfirmarSurtir(
                                            nevera.id_nevera
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

      {/* Modal para surtir nevera */}
      <SurtirNeveraModal
        isOpen={isSurtirModalOpen}
        onClose={handleCloseSurtirModal}
        idNevera={selectedNeveraId || 0}
      />

      {/* Modal de confirmación de surtido */}
      <ConfirmarSurtidoModal
        isOpen={isConfirmarSurtidoModalOpen}
        onClose={handleCloseConfirmarSurtidoModal}
        onConfirm={handleRealizarSurtido}
        idNevera={selectedNeveraId || 0}
        nombreTienda={selectedNeveraNombre}
      />

      {/* Modal de distribuir inventario */}
      <DistribuirInventarioModal
        isOpen={isDistribuirInventarioModalOpen}
        onClose={handleCloseDistribuirInventarioModal}
        onDistribuir={handleDistribuirInventario}
      />
    </div>
  );
};

export default LogisticaInventarioPage;
