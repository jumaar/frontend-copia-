import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getNeverasSurtir, getSurtidoPorNevera } from '../../../../services/api';
import NeverasSurtirPanel, { type NeverasSurtirResponse } from '../components/NeverasSurtirPanel/NeverasSurtirPanel';
import ParametrosSurtirModal from '../components/ParametrosSurtirModal/ParametrosSurtirModal';
import { VALIDACION_STORAGE_KEY } from '../hooks/useLogisticaInventario';

type InventarioNeverasMode = 'admin' | 'logistica' | 'tienda';

interface SurtirParams {
  idNevera: number;
  nombreTienda: string;
}

interface InventarioNeverasScreenProps {
  mode: InventarioNeverasMode;
  onIniciarSurtido?: (data: any) => void;
  validacionDelDia?: () => boolean;
}

function getValidacionDelDia(userId: string): boolean {
  try {
    const key = VALIDACION_STORAGE_KEY + '_' + userId;
    const stored = localStorage.getItem(key);
    if (!stored) return false;
    const ultima = new Date(stored);
    const hoy = new Date();
    return (
      ultima.getFullYear() === hoy.getFullYear() &&
      ultima.getMonth() === hoy.getMonth() &&
      ultima.getDate() === hoy.getDate()
    );
  } catch {
    return false;
  }
}

const InventarioNeverasScreen: React.FC<InventarioNeverasScreenProps> = ({
  mode,
  onIniciarSurtido,
  validacionDelDia: validacionDelDiaProp,
}) => {
  const esLogistica = mode === 'logistica';

  const [neverasData, setNeverasData] = useState<NeverasSurtirResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);
  const [selectedNeveraId, setSelectedNeveraId] = useState<number | null>(null);

  const [isParametrosSurtirModalOpen, setIsParametrosSurtirModalOpen] = useState(false);
  const [surtirParams, setSurtirParams] = useState<SurtirParams | null>(null);

  const { user } = useAuth();
  const esValidacionDelDia = validacionDelDiaProp || (() => getValidacionDelDia(user?.id || '0'));

  const handleConsultarNeveras = useCallback(async () => {
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
  }, []);

  const toggleCityExpansion = useCallback((ciudad: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(ciudad)) next.delete(ciudad);
      else next.add(ciudad);
      return next;
    });
  }, []);

  const handleSurtir = useCallback((idNevera: number) => {
    if (esLogistica) {
      if (!esValidacionDelDia()) {
        alert('⚠️ Debes validar los empaques primero.\n\nVe a "Gestión Inventario" y presiona el botón "VALIDAR EMPAQUES" antes de poder surtir.');
        return;
      }
      // Logistica: abrir ParametrosSurtirModal en vez del modal normal
      const nevera = neverasData?.neveras_activas?.find(n => n.id_nevera === idNevera);
      setSurtirParams({
        idNevera,
        nombreTienda: nevera?.nombre_tienda || `Nevera #${idNevera}`,
      });
      setIsParametrosSurtirModalOpen(true);
      return;
    }

    // Admin/superadmin: abrir SurtirNeveraModal normal
    setSelectedNeveraId(idNevera);
    setIsSurtirModalOpen(true);
  }, [esLogistica, esValidacionDelDia, neverasData]);

  const handleSurtirFlujo = useCallback((idNevera: number, nombreTienda: string) => {
    if (esLogistica) {
      if (!esValidacionDelDia()) {
        alert('⚠️ Debes validar los empaques primero.\n\nVe a "Gestión Inventario" y presiona el botón "VALIDAR EMPAQUES" antes de poder surtir.');
        return;
      }
      setSurtirParams({ idNevera, nombreTienda });
      setIsParametrosSurtirModalOpen(true);
      return;
    }
    // Admin: sin flujo surtir
  }, [esLogistica, esValidacionDelDia]);

  const handleConfirmParametrosSurtir = useCallback(async (idCiudades: number[], diasExcluir: number) => {
    if (!surtirParams) return;
    const { idNevera, nombreTienda } = surtirParams;

    try {
      setLoading(true);
      const response = await getSurtidoPorNevera(idNevera, idCiudades, diasExcluir);

      setIsParametrosSurtirModalOpen(false);
      setSurtirParams(null);

      onIniciarSurtido?.({
        idNevera,
        nombreTienda,
        stockData: [],
        phase: 'review',
        neveraData: response,
        scannedEpcs: [],
        confirmations: {},
      });
    } catch (err: any) {
      console.error('Error al obtener datos de surtido:', err);
      alert(err.response?.data?.message || '❌ Error al obtener los datos de surtido. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [onIniciarSurtido, surtirParams]);

  const handleCloseParametrosSurtirModal = useCallback(() => {
    setIsParametrosSurtirModalOpen(false);
    setSurtirParams(null);
  }, []);

  const handleCloseSurtirModal = useCallback(() => {
    setIsSurtirModalOpen(false);
    setSelectedNeveraId(null);
  }, []);

  const handleBuscar = useCallback(() => {
    setNeverasData(null);
    setError(null);
    setSearchId('');
    setExpandedCities(new Set());
  }, []);

  useEffect(() => {
    handleConsultarNeveras();
  }, [handleConsultarNeveras]);

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Inventario Neveras</h1>
        <p>Neveras activas de todas las tiendas en el sistema</p>
      </div>

      <NeverasSurtirPanel
        showSurtir={esLogistica}
        esAdmin={false}
        esValidacionDelDia={esValidacionDelDia}
        neverasData={neverasData}
        loadingNeveras={loading}
        errorNeveras={error}
        searchId={searchId}
        expandedCities={expandedCities}
        isSurtirModalOpen={esLogistica ? false : isSurtirModalOpen}
        selectedNeveraId={selectedNeveraId}
        toggleCityExpansion={toggleCityExpansion}
        handleSurtir={handleSurtir}
        handleSurtirFlujo={handleSurtirFlujo}
        handleCloseSurtirModal={handleCloseSurtirModal}
        handleBuscar={handleBuscar}
        setSearchId={setSearchId}
      />

      {esLogistica && surtirParams && (
        <ParametrosSurtirModal
          isOpen={isParametrosSurtirModalOpen}
          onClose={handleCloseParametrosSurtirModal}
          onConfirm={handleConfirmParametrosSurtir}
          idNevera={surtirParams.idNevera}
        />
      )}
    </div>
  );
};

export default InventarioNeverasScreen;
