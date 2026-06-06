import { useState, useEffect, useCallback } from 'react';
import { getHermanos, getGestionLogisticaByUser, cambiarEstadoEmpaques } from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { numberToWords } from '../../../../shared/utils/numberToWords';
import type {
  Hermano,
  LogisticaData,
  GestionLogisticaResponse,
  Frigorifico,
  GestionData,
  SearchResult,
} from '../types/logistica.types';

export function useLogisticaGestion() {
  const { user } = useAuth();
  const [logisticaData, setLogisticaData] = useState<LogisticaData[] | null>(null);
  const [hermanos, setHermanos] = useState<Hermano[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<GestionData | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedFrigorifico, setSelectedFrigorifico] = useState<Frigorifico | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultingUser, setConsultingUser] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchEPC, setSearchEPC] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [currentUserLogisticaId, setCurrentUserLogisticaId] = useState<number | null>(null);
  const [confirmedProducts, setConfirmedProducts] = useState<Set<string>>(new Set());

  const hasLogisticaData = !!(logisticaData && logisticaData.length > 0);

  const refreshUserData = useCallback(async () => {
    if (selectedUserData && selectedUserName) {
      try {
        const userId = hermanos.find(h => `${h.nombre_usuario} ${h.apellido_usuario}` === selectedUserName)?.id_usuario;
        if (userId) {
          const refreshedData = await getGestionLogisticaByUser(userId);
          setSelectedUserData(refreshedData);
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    }
  }, [selectedUserData, selectedUserName, hermanos]);

  useEffect(() => {
    const fetchLogisticaData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: GestionLogisticaResponse = await getHermanos();
        setLogisticaData(response.logistica);
        setHermanos(response.hermanos || []);

        if (response.logistica && response.logistica.length > 0) {
          setCurrentUserLogisticaId(response.logistica[0].id_logistica);
        }
      } catch (err: any) {
        console.error('Error fetching logistica data:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Redirigiendo al login...');
          window.location.href = '/login';
        } else {
          setError('Error al cargar la lista de usuarios. Inténtalo de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLogisticaData();
    }
  }, [user?.id]);

  const handleConsultUser = useCallback(async (userId: number, userName: string) => {
    if (!logisticaData || logisticaData.length === 0) {
      alert(
        '⚠️ NO PUEDES CONSULTAR FRIGORÍFICOS ⚠️\n\n' +
        'Debes completar tus datos de empresa logística primero.\n\n' +
        'Ve al Dashboard Principal y haz clic en "Editar" para llenar esta información.'
      );
      return;
    }

    try {
      setConsultingUser(userId);
      setError(null);
      setSelectedUserData(null);
      setSelectedFrigorifico(null);
      setSearchResult(null);

      const gestionData = await getGestionLogisticaByUser(userId);
      setSelectedUserData(gestionData);
      setSelectedUserName(userName);

      if (gestionData.frigorificos && gestionData.frigorificos.length > 0) {
        setSelectedFrigorifico(gestionData.frigorificos[0]);
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        setError(`Error al consultar datos del usuario ${userName}. Inténtalo de nuevo.`);
      }
    } finally {
      setConsultingUser(null);
    }
  }, [logisticaData]);

  const handleSearch = useCallback((epc?: string) => {
    const query = epc ?? searchEPC;

    if (!selectedUserData) {
      alert('Primero consulta los datos de un usuario.');
      return;
    }

    if (query.length < 10) {
      alert('El EPC debe tener al menos 10 caracteres.');
      return;
    }

    let foundProduct: import('../types/logistica.types').Producto | null = null;
    let foundEstacion: string = '';

    for (const frigorifico of selectedUserData.frigorificos) {
      for (const estacion of frigorifico.estaciones) {
        for (const producto of estacion.productos) {
          const empaque = producto.empaques.find((e) => e.epc === query);
          if (empaque) {
            foundProduct = { ...producto, empaques: [empaque] };
            foundEstacion = estacion.id_estacion;
            break;
          }
        }
        if (foundProduct) break;
      }
      if (foundProduct) break;
    }

    if (foundProduct) {
      setSearchResult({ producto: foundProduct, estacion: foundEstacion });
      setError(null);
      setSearchEPC('');
    } else {
      setSearchResult(null);
      setError('No se encontró ningún empaque con ese EPC.');
      setSearchEPC('');
    }
  }, [searchEPC, selectedUserData]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const toggleProductExpansion = useCallback((productId: number) => {
    const productIdStr = productId.toString();
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productIdStr)) {
        next.delete(productIdStr);
      } else {
        next.add(productIdStr);
      }
      return next;
    });
  }, []);

  const handleConfirmarCambioEstado = useCallback(async (
    estacionId: string,
    productoId: number,
    productoName: string,
    cantidadTotal: number
  ) => {
    if (!currentUserLogisticaId) {
      alert('❌ ERROR: No se puede proceder sin datos de logística.\nCompleta tu perfil primero.');
      return;
    }

    let verificationText: string;
    let expectedInput: string;

    if (cantidadTotal >= 1000) {
      verificationText = `LO LOGRAMOS HP`;
      expectedInput = `LO LOGRAMOS HP`;
    } else {
      const cantidadEnPalabras = numberToWords(cantidadTotal);
      verificationText = cantidadEnPalabras;
      expectedInput = cantidadEnPalabras;
    }

    const inputValue = prompt(
      `CONFIRMACIÓN CRÍTICA - PASO 1/2\n\n` +
      `Producto: ${productoName}\n` +
      `Cantidad a confirmar: ${cantidadTotal} empaques\n\n` +
      `EJEMPLO DE LO QUE DEBES ESCRIBIR:\n` +
      `**${verificationText}**\n\n` +
      `Por favor, escribe exactamente la palabra${cantidadTotal >= 1000 ? 's' : ''} de arriba para confirmar:`
    );

    if (inputValue === null) return;
    if (inputValue.trim().toUpperCase() !== expectedInput.toUpperCase()) {
      alert(`❌ ERROR: La palabra${cantidadTotal >= 1000 ? 's' : ''} ingresada${cantidadTotal >= 1000 ? 's' : ''} no coincide${cantidadTotal >= 1000 ? 'n' : ''}.\nDebe${cantidadTotal >= 1000 ? 'n' : ''} escribir: "${expectedInput}"`);
      return;
    }

    if (window.confirm(
      `⚠️ CONFIRMACIÓN FINAL ⚠️\n\n` +
      `PRODUCTO: ${productoName.toUpperCase()}\n` +
      `CANTIDAD: ${cantidadTotal} EMPAQUES\n` +
      `ESTACIÓN: ${estacionId}\n\n` +
      `Esta acción cambiará el estado de ${cantidadTotal} empaques.\n\n` +
      `¿Estás seguro de que quieres proceder?`
    )) {
      try {
        const response = await cambiarEstadoEmpaques(estacionId, productoId, currentUserLogisticaId);

        if (response.actualizados !== undefined) {
          alert(`✅ CAMBIO REALIZADO EXITOSAMENTE\n\n` +
                `📦 Empaques actualizados: ${response.actualizados}\n` +
                `📅 Fecha del cambio: ${new Date(response.fecha_cambio).toLocaleString('es-CO')}\n` +
                `🚛 ID Logística guardado: ${response.id_logistica}`);

          const productKey = `${estacionId}-${productoId}`;
          setConfirmedProducts(prev => new Set([...prev, productKey]));

          await refreshUserData();
        }
      } catch (err: any) {
        console.error('Error al cambiar estado de empaques:', err);

        if (err.response?.status === 403) {
          const errorCode = err.response.data?.code;
          if (errorCode === 'PERMISSION_DENIED') {
            alert('❌ SIN PERMISOS\n\nNo tienes permisos para realizar esta operación.');
          } else if (errorCode === 'HIERARCHY_ERROR') {
            alert('❌ ERROR DE JERARQUÍA\n\nNo se pudo determinar la jerarquía del usuario.\nContacta al administrador.');
          } else {
            alert('❌ ACCESO DENEGADO\n\nNo tienes permisos para realizar esta operación.');
          }
        } else if (err.response?.status === 404) {
          alert('❌ ESTACIÓN NO ENCONTRADA\n\nLa estación no existe o no tienes permisos para acceder a ella.');
        } else if (err.response?.status === 401) {
          alert('⚠️ SESIÓN EXPIRADA\n\nRedirigiendo al login...');
          window.location.href = '/login';
        } else {
          alert('❌ ERROR INESPERADO\n\nOcurrió un error al actualizar el producto. Inténtalo de nuevo.');
        }
      }
    }
  }, [currentUserLogisticaId, refreshUserData]);

  const allEstaciones = selectedUserData?.frigorificos.flatMap(f => f.estaciones) || [];
  const allProductos = allEstaciones.flatMap(e => e.productos);
  const productosHoy = allProductos.reduce((total, producto) => total + producto.cantidad_total, 0);
  const pesoTotal = allProductos.reduce((total, producto) =>
    total + producto.empaques.reduce((sum, empaque) => sum + parseFloat(empaque.peso_g), 0), 0
  ) / 1000;

  return {
    logisticaData,
    hermanos,
    selectedUserData,
    selectedUserName,
    selectedFrigorifico,
    loading,
    consultingUser,
    error,
    searchEPC,
    setSearchEPC,
    searchResult,
    expandedProducts,
    confirmedProducts,
    hasLogisticaData,
    allEstaciones,
    productosHoy,
    pesoTotal,
    setError,
    handleConsultUser,
    handleSearch,
    handleKeyPress,
    toggleProductExpansion,
    handleConfirmarCambioEstado,
  };
}
