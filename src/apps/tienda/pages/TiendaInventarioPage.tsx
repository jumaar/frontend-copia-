import React, { useState, useEffect } from 'react';
import { getTiendas } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import SurtirNeveraModal from '../../../shared/scoped/admin-superadmin-logistica-tienda/SurtirNeveraModal/SurtirNeveraModal';
import ListaTiendasNeveras, { type TiendaData } from '../components/ListaTiendasNeveras';

interface TiendasResponse {
  tiendas: TiendaData[];
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
          <ListaTiendasNeveras
            tiendas={tiendasData?.tiendas || []}
            onSurtir={handleMostrarSurtir}
          />
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
