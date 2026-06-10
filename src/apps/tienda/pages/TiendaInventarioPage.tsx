import React, { useState, useEffect } from 'react';
import NeverasSurtirPanel, { type NeverasSurtirResponse } from '../../../shared/scoped/admin-superadmin-logistica-tienda/components/NeverasSurtirPanel/NeverasSurtirPanel';
import { getNeverasSurtir } from '../../../services/api';

const TiendaInventarioPage: React.FC = () => {
  const [neverasData, setNeverasData] = useState<NeverasSurtirResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);
  const [selectedNeveraId, setSelectedNeveraId] = useState<number | null>(null);

  useEffect(() => {
    const fetchNeveras = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getNeverasSurtir();
        setNeverasData(data);
      } catch (err: any) {
        setError('Error al cargar las neveras');
      } finally {
        setLoading(false);
      }
    };
    fetchNeveras();
  }, []);

  const toggleCityExpansion = (ciudad: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(ciudad)) newExpanded.delete(ciudad);
    else newExpanded.add(ciudad);
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

  if (loading) {
    return <div className="frigorifico-page">Cargando neveras...</div>;
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

      <NeverasSurtirPanel
        showConsultar={false}
        showSurtir={false}
        neverasData={neverasData}
        loadingNeveras={false}
        errorNeveras={null}
        showNeverasSection={true}
        searchId={searchId}
        expandedCities={expandedCities}
        isSurtirModalOpen={isSurtirModalOpen}
        selectedNeveraId={selectedNeveraId}
        toggleCityExpansion={toggleCityExpansion}
        handleSurtir={handleSurtir}
        handleCloseSurtirModal={handleCloseSurtirModal}
        setSearchId={setSearchId}
      />
    </div>
  );
};

export default TiendaInventarioPage;
