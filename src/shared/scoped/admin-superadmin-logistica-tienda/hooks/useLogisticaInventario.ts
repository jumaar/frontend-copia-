import { useState, useEffect} from 'react';
import {
  getLogistica,
  getNeverasSurtir,
  darDeBajaEmpaque,
  getSurtidoPorNevera,
  postValidacionEmpaques,
} from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';

type SurtidoPhase = 'review' | 'removal' | 'scanning';

interface SurtidoInitData {
  idNevera: number;
  nombreTienda: string;
  stockData: any[];
  phase: SurtidoPhase;
  neveraData: any;
  scannedEpcs: Array<{ epc: string; id_empaque?: number }>;
  confirmations: Record<number, boolean>;
}

export interface Empaque {
  id_empaque: number;
  peso_exacto_g: string;
  EPC_id: string;
}

export interface EmpaqueEstado6Item {
  id_empaque: number;
  peso_exacto_g: string;
  EPC_id: string;
  porcentaje_transcurrido: number;
}

export interface EmpaqueEstado6Data {
  logistica_prioridad: EmpaqueEstado6Item[];
  vencidos: EmpaqueEstado6Item[];
}

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal: number;
  empaques: Empaque[];
  empaques_estado_6?: EmpaqueEstado6Data;
}

export interface EmpaquePrioridad {
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

export interface NeveraPrioridad {
  id_nevera: number;
  nombre_tienda: string;
  direccion: string;
  empaques: EmpaquePrioridad[];
}

export interface CiudadPrioridad {
  id_ciudad: number;
  nombre_ciudad: string;
  neveras: NeveraPrioridad[];
}

export interface LogisticaInventarioResponse {
  productos_por_logistica: Producto[];
  total_productos_diferentes: number;
  total_empaques: number;
  id_logistica_usuario: number;
  ultima_hora_calificacion?: string;
  para_cambio?: CiudadPrioridad[];
  vencidos?: CiudadPrioridad[];
}

export interface LogisticaData {
  id_logistica: number;
  nombre_empresa: string;
  placa_vehiculo: string;
}

export interface GestionLogisticaResponse {
  logistica: LogisticaData[] | null;
  hermanos?: any[];
}

export interface Nevera {
  id_nevera: number;
  nombre_tienda: string;
  direccion: string;
  ciudad?: string;
  id_ciudad?: number;
}

export interface NeverasSurtirResponse {
  neveras_activas: Nevera[];
  total_neveras: number;
}

export interface UsuarioLogistica {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: string;
}

export interface UseLogisticaInventarioReturn {
  inventarioData: LogisticaInventarioResponse | null;
  selectedLogisticaId: number | null;
  loading: boolean;
  error: string | null;
  lastDistributionTime: string | null;
  expandedProducts: Set<number>;
  expandedVencidosProducts: Set<number>;
  expandedCities: Set<string>;
  expandedPrioridadCities: Set<number>;
  expandedPrioridadNeveras: Set<number>;
  expandedVencidosCities: Set<number>;
  expandedVencidosNeveras: Set<number>;
  neverasData: NeverasSurtirResponse | null;
  loadingNeveras: boolean;
  errorNeveras: string | null;
  searchId: string;
  showNeverasSection: boolean;
  isSurtirModalOpen: boolean;
  selectedNeveraId: number | null;
  isParametrosSurtirModalOpen: boolean;
  surtirParamsNevera: { idNevera: number; nombreTienda: string } | null;
  validandoEmpaques: boolean;
  esAdmin: boolean;
  selectedUserId: number | null;
  usuariosLogistica: UsuarioLogistica[];
  showUserDropdown: boolean;
  loadingUsuarios: boolean;
  toggleProductExpansion: (productId: number) => void;
  toggleVencidosProductExpansion: (productId: number) => void;
  toggleCityExpansion: (ciudad: string) => void;
  togglePrioridadCity: (cityId: number) => void;
  togglePrioridadNevera: (neveraId: number) => void;
  toggleVencidosCity: (cityId: number) => void;
  toggleVencidosNevera: (neveraId: number) => void;
  handleSurtir: (idNevera: number) => void;
  handleSurtirFlujo: (idNevera: number, nombreTienda: string) => void;
  handleConfirmParametrosSurtir: (idCiudades: number[], diasExcluir: number) => Promise<void>;
  handleCloseSurtirModal: () => void;
  handleCloseParametrosSurtirModal: () => void;
  handleBuscar: () => void;
  handleValidarEmpaques: () => Promise<void>;
  handleConsultarNeveras: () => Promise<void>;
  handleSeleccionarLogistica: (idUsuario: number) => Promise<void>;
  handleDarDeBaja: (idEmpaque: number, nombreProducto: string) => Promise<void>;
  esValidacionDelDia: () => boolean;
  setSearchId: React.Dispatch<React.SetStateAction<string>>;
  setShowUserDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUsuariosLogistica: () => Promise<void>;
}

export function useLogisticaInventario({
  mode,
  onIniciarSurtido,
}: {
  mode: 'self' | 'admin';
  onIniciarSurtido?: (data: SurtidoInitData) => void;
}): UseLogisticaInventarioReturn {
  const { user } = useAuth();
  const [inventarioData, setInventarioData] = useState<LogisticaInventarioResponse | null>(null);
  const [selectedLogisticaId, setSelectedLogisticaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [expandedVencidosProducts, setExpandedVencidosProducts] = useState<Set<number>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedPrioridadCities, setExpandedPrioridadCities] = useState<Set<number>>(new Set());
  const [expandedPrioridadNeveras, setExpandedPrioridadNeveras] = useState<Set<number>>(new Set());
  const [expandedVencidosCities, setExpandedVencidosCities] = useState<Set<number>>(new Set());
  const [expandedVencidosNeveras, setExpandedVencidosNeveras] = useState<Set<number>>(new Set());
  const [neverasData, setNeverasData] = useState<NeverasSurtirResponse | null>(null);
  const [loadingNeveras, setLoadingNeveras] = useState(false);
  const [errorNeveras, setErrorNeveras] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [showNeverasSection, setShowNeverasSection] = useState(false);
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);
  const [selectedNeveraId, setSelectedNeveraId] = useState<number | null>(null);
  const [isParametrosSurtirModalOpen, setIsParametrosSurtirModalOpen] = useState(false);
  const [surtirParamsNevera, setSurtirParamsNevera] = useState<{
    idNevera: number;
    nombreTienda: string;
  } | null>(null);
  const [lastDistributionTime, setLastDistributionTime] = useState<string | null>(null);
  const [validandoEmpaques, setValidandoEmpaques] = useState(false);

  const esAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [usuariosLogistica, setUsuariosLogistica] = useState<UsuarioLogistica[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const esValidacionDelDia = (): boolean => {
    if (!lastDistributionTime) return false;
    const hoy = new Date();
    const ultima = new Date(lastDistributionTime);
    return (
      ultima.getFullYear() === hoy.getFullYear() &&
      ultima.getMonth() === hoy.getMonth() &&
      ultima.getDate() === hoy.getDate()
    );
  };

  const fetchLogisticaData = async () => {
    try {
      setLoading(true);
      setError(null);

      const logisticaResponse: LogisticaInventarioResponse | GestionLogisticaResponse = await getLogistica();

      if ('productos_por_logistica' in logisticaResponse) {
        setInventarioData(logisticaResponse as LogisticaInventarioResponse);
        setSelectedLogisticaId(logisticaResponse.id_logistica_usuario);
        setLastDistributionTime(logisticaResponse.ultima_hora_calificacion || null);
      } else if (
        'logistica' in logisticaResponse &&
        Array.isArray(logisticaResponse.logistica) &&
        logisticaResponse.logistica.length > 0
      ) {
        throw new Error('La API debería devolver directamente los datos de inventario');
      } else {
        throw new Error('No se encontraron los datos esperados en la respuesta');
      }
    } catch (err: any) {
      console.error('Error fetching logistica data:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        setError('Error al cargar los datos de logística. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error fetching usuarios logistica:', err);
      setError('Error al cargar la lista de usuarios logística.');
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
      if ('productos_por_logistica' in response) {
        setInventarioData(response as LogisticaInventarioResponse);
        setSelectedLogisticaId(response.id_logistica_usuario);
        setLastDistributionTime(response.ultima_hora_calificacion || null);
      } else {
        throw new Error('No se encontraron los datos de inventario.');
      }
    } catch (err: any) {
      console.error('Error fetching logistica data:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        setError('Error al cargar los datos de logística. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      if (mode === 'admin') {
        fetchUsuariosLogistica();
      } else {
        fetchLogisticaData();
      }
    }
  }, [user?.id, mode]);

  const handleConsultarNeveras = async () => {
    try {
      setLoadingNeveras(true);
      setErrorNeveras(null);
      const neverasResponse: NeverasSurtirResponse = await getNeverasSurtir();
      setNeverasData(neverasResponse);
      setShowNeverasSection(true);
    } catch (err: any) {
      console.error('Error fetching neveras data:', err);
      if (err.response?.status === 401) {
        setErrorNeveras('Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        setErrorNeveras('Error al cargar las neveras para surtir. Inténtalo de nuevo.');
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
    setSurtirParamsNevera({ idNevera, nombreTienda });
    setIsParametrosSurtirModalOpen(true);
  };

  const handleConfirmParametrosSurtir = async (idCiudades: number[], diasExcluir: number) => {
    if (!surtirParamsNevera) return;

    const { idNevera, nombreTienda } = surtirParamsNevera;

    try {
      setLoading(true);
      setError(null);
      const response = await getSurtidoPorNevera(idNevera, idCiudades, diasExcluir);

      setIsParametrosSurtirModalOpen(false);
      setSurtirParamsNevera(null);

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
  };

  const handleCloseSurtirModal = () => {
    setIsSurtirModalOpen(false);
    setSelectedNeveraId(null);
  };

  const handleCloseParametrosSurtirModal = () => {
    setIsParametrosSurtirModalOpen(false);
    setSurtirParamsNevera(null);
  };

  const handleBuscar = () => {
    // La búsqueda se hace automáticamente con el filtro en el render
  };

  const handleValidarEmpaques = async () => {
    if (!window.confirm('⚠️ ¿Ejecutar validación global de empaques?\n\nEsto realizará un escaneo general en busca de empaques vencidos y actualizará las calificaciones de todos los productos. Asegúrese de estar fuera del frigorífico.')) {
      return;
    }

    try {
      setValidandoEmpaques(true);
      setError(null);
      const response = await postValidacionEmpaques();

      const { resumen } = response;
      let mensaje = `✅ ${response.message || 'Validación completada'}\n\n`;
      mensaje += `📅 Hora: ${new Date(response.hora_calificacion).toLocaleString('es-CO')}\n`;
      mensaje += `📍 Ciudad: ${resumen.ciudad_procesada?.nombre_ciudad || 'N/A'}\n`;
      mensaje += `🧊 Neveras procesadas: ${resumen.neveras_procesadas}\n`;
      mensaje += `📦 Productos procesados: ${resumen.productos_procesados}\n`;
      mensaje += `⚠️ Empaques en para_cambio: ${resumen.empaques_en_para_cambio}`;

      alert(mensaje);

      setLastDistributionTime(response.hora_calificacion);

      if (showNeverasSection) {
        handleConsultarNeveras();
      }
      fetchLogisticaData();
    } catch (err: any) {
      console.error('Error al validar empaques:', err);
      alert(err.response?.data?.message || '❌ Error al ejecutar la validación de empaques.');
    } finally {
      setValidandoEmpaques(false);
    }
  };

  const handleDarDeBaja = async (idEmpaque: number, nombreProducto: string) => {
    if (!window.confirm(`¿Dar de baja el empaque ${idEmpaque} del producto ${nombreProducto}?`)) return;
    try {
      await darDeBajaEmpaque(idEmpaque);
      alert(`Empaque ${idEmpaque} dado de baja exitosamente.`);
      if (mode === 'admin' && selectedUserId) {
        handleSeleccionarLogistica(selectedUserId);
      } else {
        fetchLogisticaData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al dar de baja el empaque.');
    }
  };

  return {
    inventarioData,
    selectedLogisticaId,
    loading,
    error,
    lastDistributionTime,
    expandedProducts,
    expandedVencidosProducts,
    expandedCities,
    expandedPrioridadCities,
    expandedPrioridadNeveras,
    expandedVencidosCities,
    expandedVencidosNeveras,
    neverasData,
    loadingNeveras,
    errorNeveras,
    searchId,
    showNeverasSection,
    isSurtirModalOpen,
    selectedNeveraId,
    isParametrosSurtirModalOpen,
    surtirParamsNevera,
    validandoEmpaques,
    esAdmin,
    selectedUserId,
    usuariosLogistica,
    showUserDropdown,
    loadingUsuarios,
    toggleProductExpansion,
    toggleVencidosProductExpansion,
    toggleCityExpansion,
    togglePrioridadCity,
    togglePrioridadNevera,
    toggleVencidosCity,
    toggleVencidosNevera,
    handleSurtir,
    handleSurtirFlujo,
    handleConfirmParametrosSurtir,
    handleCloseSurtirModal,
    handleCloseParametrosSurtirModal,
    handleBuscar,
    handleValidarEmpaques,
    handleConsultarNeveras,
    handleSeleccionarLogistica,
    handleDarDeBaja,
    esValidacionDelDia,
    setSearchId,
    setShowUserDropdown,
    fetchUsuariosLogistica,
  };
}
