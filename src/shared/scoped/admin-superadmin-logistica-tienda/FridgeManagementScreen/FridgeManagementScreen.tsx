import React, { useState } from 'react';
import { getNeverasSurtir } from '../../../../services/api';
import NeverasSurtirPanel, { type NeverasSurtirResponse } from '../components/NeverasSurtirPanel/NeverasSurtirPanel';
import './FridgeManagementScreen.css';

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

      <NeverasSurtirPanel
        showConsultar
        neverasData={neverasData}
        loadingNeveras={loading}
        errorNeveras={error}
        showNeverasSection={neverasData !== null}
        searchId={searchId}
        expandedCities={expandedCities}
        isSurtirModalOpen={isSurtirModalOpen}
        selectedNeveraId={selectedNeveraId}
        handleConsultarNeveras={handleConsultarNeveras}
        toggleCityExpansion={toggleCityExpansion}
        handleSurtir={handleSurtir}
        handleCloseSurtirModal={handleCloseSurtirModal}
        setSearchId={setSearchId}
      />
    </div>
  );
};

export default FridgeManagementPage;
