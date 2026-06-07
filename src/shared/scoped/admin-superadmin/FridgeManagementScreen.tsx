import React, { useState } from 'react';
import { getNeverasSurtir } from '../../../services/api';
import SurtirNeveraModal from '../admin-superadmin-logistica-tienda/SurtirNeveraModal/SurtirNeveraModal';
import './ManagementPage.css';

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

const FridgeManagementPage: React.FC = () => {
  const [neverasData, setNeverasData] = useState<NeverasSurtirResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);
  const [selectedNeveraId, setSelectedNeveraId] = useState<number | null>(null);

  const handleConsultarNeveras = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNeverasSurtir();
      setNeverasData(response);
    } catch (err: any) {
      console.error('Error fetching neveras:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        setError('Error al cargar las neveras. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
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

  const handleCloseSurtirModal = () => {
    setIsSurtirModalOpen(false);
    setSelectedNeveraId(null);
  };

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Neveras</h1>
        <p>Neveras activas de todas las tiendas en el sistema</p>
      </div>

      <section className="card" style={{ marginTop: "calc(var(--spacing-unit) * -4)" }}>
        <div style={{ padding: '1rem' }}>
          {!neverasData ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <button
                className="action-button"
                onClick={handleConsultarNeveras}
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'Consultando...' : 'Consultar Neveras'}
              </button>
            </div>
          ) : (
            <>
              {loading ? (
                <div>Cargando neveras...</div>
              ) : error ? (
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
              ) : (
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

                  {/* Resumen */}
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-hover-bg)',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                      Total de neveras activas: {neverasData.total_neveras}
                    </span>
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
                                      backgroundColor: 'white',
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
                                        {nevera.nombre_tienda} - {nevera.direccion}
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => handleSurtir(nevera.id_nevera)}
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
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        }}
                                      >
                                        Inventario
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
    </div>
  );
};

export default FridgeManagementPage;
