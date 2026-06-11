import React from 'react';
import SurtirNeveraModal from '../SurtirNeveraModal/SurtirNeveraModal';
import './NeverasSurtirPanel.css';

interface Nevera {
  id_nevera: number;
  nombre_tienda: string;
  direccion: string;
  ciudad?: string;
  id_ciudad?: number;
}

interface NeverasSurtirResponse {
  neveras_activas: Nevera[];
  total_neveras: number;
}

interface NeverasSurtirPanelProps {
  showSurtir?: boolean;
  esAdmin?: boolean;
  renderModal?: boolean;
  neverasData: NeverasSurtirResponse | null;
  loadingNeveras: boolean;
  errorNeveras: string | null;
  searchId: string;
  expandedCities: Set<string>;
  isSurtirModalOpen: boolean;
  selectedNeveraId: number | null;
  toggleCityExpansion: (ciudad: string) => void;
  handleSurtir: (idNevera: number) => void;
  handleSurtirFlujo?: (idNevera: number, nombreTienda: string) => void;
  handleCloseSurtirModal: () => void;
  handleBuscar?: () => void;
  esValidacionDelDia?: () => boolean;
  setSearchId: React.Dispatch<React.SetStateAction<string>>;
}

const NeverasSurtirPanel: React.FC<NeverasSurtirPanelProps> = ({
  showSurtir = false,
  esAdmin = false,
  renderModal = true,
  neverasData,
  loadingNeveras,
  errorNeveras,
  searchId,
  expandedCities,
  isSurtirModalOpen,
  selectedNeveraId,
  toggleCityExpansion,
  handleSurtir,
  handleSurtirFlujo,
  handleCloseSurtirModal,
  handleBuscar,
  esValidacionDelDia,
  setSearchId,
}) => {
  return (
    <>
      <section className="card" style={{ marginTop: '2rem' }}>
        <div style={{ padding: '1rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            Neveras para Surtir
          </h2>

          {loadingNeveras ? (
            <div>Cargando neveras...</div>
          ) : errorNeveras ? (
                <div style={{ color: 'red', padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
                  {errorNeveras}
                </div>
              ) : neverasData ? (
                <>
                  <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                    {handleBuscar && (
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
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {(() => {
                      const filteredNeveras = neverasData.neveras_activas.filter(
                        (nevera) => searchId === '' || nevera.id_nevera.toString().includes(searchId)
                      );

                      if (filteredNeveras.length === 0) {
                        return (
                          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
                            {searchId ? 'No se encontraron neveras con ese ID.' : 'No hay neveras disponibles.'}
                          </p>
                        );
                      }

                      const neverasPorCiudad: Record<string, Nevera[]> = {};
                      filteredNeveras.forEach((nevera) => {
                        const ciudad = nevera.ciudad || 'Sin Ciudad';
                        if (!neverasPorCiudad[ciudad]) neverasPorCiudad[ciudad] = [];
                        neverasPorCiudad[ciudad].push(nevera);
                      });

                      const ciudadesOrdenadas = Object.keys(neverasPorCiudad).sort();

                      return ciudadesOrdenadas.map((ciudad) => {
                        const isExpanded = expandedCities.has(ciudad) || searchId !== '';

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
                                borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                                {ciudad} ({neverasPorCiudad[ciudad].length})
                              </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div style={{ padding: '1rem', display: 'grid', gap: '1rem', backgroundColor: 'var(--color-card-bg)' }}>
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
                                      <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
                                        Nevera ID: {nevera.id_nevera}
                                      </h4>
                                      <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
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
                                      {showSurtir && !esAdmin && (
                                        <button
                                          className="action-button"
                                          onClick={() => handleSurtirFlujo?.(nevera.id_nevera, nevera.nombre_tienda)}
                                          disabled={esValidacionDelDia ? !esValidacionDelDia() : false}
                                          title={esValidacionDelDia && !esValidacionDelDia() ? 'Debes ejecutar "Validar Empaques" hoy antes de surtir' : ''}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            minWidth: '80px',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                          }}
                                        >
                                          Surtir
                                        </button>
                                      )}
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
        </div>
      </section>

      {renderModal && (
        <SurtirNeveraModal
          isOpen={isSurtirModalOpen}
          onClose={handleCloseSurtirModal}
          idNevera={selectedNeveraId || 0}
        />
      )}
    </>
  );
};

export type { NeverasSurtirPanelProps, Nevera as NeveraSurtir, NeverasSurtirResponse };
export default NeverasSurtirPanel;
