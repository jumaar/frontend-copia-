import React, { useState, useEffect } from 'react';
import { getTiendas } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SurtirNeveraModal from '../../components/SurtirNeveraModal';
import './TiendaDashboardPage.css';

interface Nevera {
  id_nevera: number;
  contraseña: string;
  id_estado_nevera: number;
}

interface Tienda {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  neveras: Nevera[];
}

interface TiendasResponse {
  tiendas: Tienda[];
  ciudades_disponibles: Array<{
    id_ciudad: number;
    nombre_ciudad: string;
    departamento: string;
  }>;
}

const TiendaInventarioPage: React.FC = () => {
  const { user } = useAuth();
  const [tiendasData, setTiendasData] = useState<TiendasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);
  const [selectedNeveraId, setSelectedNeveraId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTiendas = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          setError(null);
          const data: TiendasResponse = await getTiendas(Number(user.id));
          setTiendasData(data);
        } catch (err: any) {
          console.error('Error fetching tiendas:', err);
          setError('Error al cargar las tiendas');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTiendas();
  }, [user?.id]);

  const handleMostrarSurtir = (neveraId: number) => {
    setSelectedNeveraId(neveraId);
    setIsSurtirModalOpen(true);
  };

  const handleCloseSurtirModal = () => {
    setIsSurtirModalOpen(false);
    setSelectedNeveraId(null);
  };

  if (loading) {
    return <div className="frigorifico-page">Cargando tiendas...</div>;
  }

  if (error) {
    return <div className="frigorifico-page" style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="frigorifico-page">
      <div className="cuentas-header">
        <h1>Surtir Neveras</h1>
        <p>Gestión de surtido de productos en neveras de tus tiendas.</p>
      </div>

      <section className="card" style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}>
        <div style={{ padding: '1rem' }}>
          {tiendasData?.tiendas.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
              No tienes tiendas asignadas.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {tiendasData?.tiendas.map((tienda) => (
                <div
                  key={tienda.id_tienda}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--color-card-bg)'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
                      {tienda.nombre_tienda}
                    </h4>
                    <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
                      {tienda.direccion} - {tienda.ciudad}, {tienda.departamento}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      Neveras activas: {tienda.neveras.filter(n => n.id_estado_nevera === 2).length}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {tienda.neveras.filter(n => n.id_estado_nevera === 2).map((nevera) => (
                      <button
                        key={nevera.id_nevera}
                        className="action-button"
                        onClick={() => handleMostrarSurtir(nevera.id_nevera)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          minWidth: '100px'
                        }}
                      >
                        Mostrar Nevera {nevera.id_nevera}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <SurtirNeveraModal
        isOpen={isSurtirModalOpen}
        onClose={handleCloseSurtirModal}
        idNevera={selectedNeveraId || 0}
      />
    </div>
  );
};

export default TiendaInventarioPage;