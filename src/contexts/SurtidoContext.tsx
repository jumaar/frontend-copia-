import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ProductoSurtido {
  id_nevera: number;
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  stock_ideal_final: number;
  stock_en_tiempo_real: number;
  calificacion_surtido: string | null;
}

interface EmpaqueCambio {
  id_empaque: number;
  epc: string;
  peso_exacto_g: number;
  id_producto: number;
  fecha_vencimiento: string;
  porcentaje_vida: number;
}

interface ParaCambio5 {
  para_cambio: EmpaqueCambio[];
  vencidos: EmpaqueCambio[];
}

interface ProductoNevera {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  tiene_stock: boolean;
  id_stock: number | null;
  stock_minimo: number;
  stock_maximo: number;
  venta_semanal: number;
  stock_ideal_final: number;
  calificacion_surtido: string;
  mensaje_sistema: string;
  stock_en_tiempo_real: number;
  activo: boolean;
  cantidad_a_surtir: number;
  empaques_disponibles_logistica: number;
  empaques_prioritarios_asignados: number;
}

interface NeveraCompletaData {
  nevera: {
    id_nevera: number;
    id_tienda: number;
    nombre_tienda: string;
    hora_ultimo_surtido?: string;
  };
  estadisticas: {
    total_productos: number;
    productos_con_stock: number;
    productos_sin_stock: number;
  };
  productos: ProductoNevera[];
  para_cambio_5?: ParaCambio5;
  resumen_logistica?: {
    id_logistica: number;
    total_empaques_estado_2: number;
    total_empaques_prioritarios_estado_6: number;
    neveras_competidoras_consideradas: number;
    neveras_excluidas_por_surtido_reciente: number;
    parametros: {
      dias_excluir: number;
      modo: string;
    };
  };
}

type SurtidoPhase = 'review' | 'removal' | 'scanning';

interface SurtidoData {
  idNevera: number;
  nombreTienda: string;
  stockData: ProductoSurtido[];
  phase: SurtidoPhase;
  neveraData: NeveraCompletaData | null;
  scannedEpcs: Array<{ epc: string; id_empaque?: number }>;
  confirmations: Record<number, boolean>;
  timestamp: string;
  userId: string;
}

interface SurtidoContextType {
  surtidoEnCurso: SurtidoData | null;
  isModalOpen: boolean;
  iniciarSurtido: (data: Omit<SurtidoData, 'timestamp' | 'userId'>) => void;
  finalizarSurtido: () => void;
  mostrarModal: () => void;
  ocultarModal: () => void;
  actualizarFase: (phase: SurtidoPhase) => void;
  agregarEpc: (item: { epc: string; id_empaque?: number }) => void;
  setScannedEpcs: (epcs: Array<{ epc: string; id_empaque?: number }>) => void;
  actualizarConfirmations: (confirmations: Record<number, boolean>) => void;
}

const SurtidoContext = createContext<SurtidoContextType | undefined>(undefined);

export const useSurtido = () => {
  const context = useContext(SurtidoContext);
  if (context === undefined) {
    throw new Error('useSurtido must be used within a SurtidoProvider');
  }
  return context;
};

interface SurtidoProviderProps {
  children: ReactNode;
}

export const SurtidoProvider: React.FC<SurtidoProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [surtidoEnCurso, setSurtidoEnCurso] = useState<SurtidoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStorageKey = useCallback((userId: string) => `surtidoEnCurso_${userId}`, []);

  useEffect(() => {
    if (user?.id) {
      const storageKey = getStorageKey(user.id);
      const surtidoGuardado = localStorage.getItem(storageKey);

      if (surtidoGuardado) {
        try {
          const surtidoData: SurtidoData = JSON.parse(surtidoGuardado);

          if (surtidoData.userId === user.id) {
            setSurtidoEnCurso(surtidoData);
            setIsModalOpen(true);
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Error al cargar surtido guardado:', error);
          localStorage.removeItem(storageKey);
        }
      }
    } else {
      setSurtidoEnCurso(null);
      setIsModalOpen(false);
    }
  }, [user?.id, getStorageKey]);

  const persistir = useCallback((data: SurtidoData) => {
    if (!user?.id) return;
    const storageKey = getStorageKey(user.id);
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSurtidoEnCurso(data);
  }, [user?.id, getStorageKey]);

  const iniciarSurtido = useCallback((data: Omit<SurtidoData, 'timestamp' | 'userId'>) => {
    if (!user?.id) return;

    const surtidoData: SurtidoData = {
      ...data,
      timestamp: new Date().toISOString(),
      userId: user.id
    };

    persistir(surtidoData);
    setIsModalOpen(true);
  }, [user?.id, persistir]);

  const finalizarSurtido = useCallback(() => {
    if (!user?.id) return;

    setSurtidoEnCurso(null);
    setIsModalOpen(false);

    const storageKey = getStorageKey(user.id);
    localStorage.removeItem(storageKey);
  }, [user?.id, getStorageKey]);

  const mostrarModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const ocultarModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const actualizarFase = useCallback((phase: SurtidoPhase) => {
    setSurtidoEnCurso(prev => {
      if (!prev) return prev;
      const updated = { ...prev, phase };
      if (user?.id) {
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
      }
      return updated;
    });
  }, [user?.id, getStorageKey]);

  const agregarEpc = useCallback((item: { epc: string; id_empaque?: number }) => {
    setSurtidoEnCurso(prev => {
      if (!prev) return prev;
      const updated = { ...prev, scannedEpcs: [...prev.scannedEpcs, item] };
      if (user?.id) {
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
      }
      return updated;
    });
  }, [user?.id, getStorageKey]);

  const setScannedEpcs = useCallback((epcs: Array<{ epc: string; id_empaque?: number }>) => {
    setSurtidoEnCurso(prev => {
      if (!prev) return prev;
      const updated = { ...prev, scannedEpcs: epcs };
      if (user?.id) {
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
      }
      return updated;
    });
  }, [user?.id, getStorageKey]);

  const actualizarConfirmations = useCallback((confirmations: Record<number, boolean>) => {
    setSurtidoEnCurso(prev => {
      if (!prev) return prev;
      const updated = { ...prev, confirmations };
      if (user?.id) {
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
      }
      return updated;
    });
  }, [user?.id, getStorageKey]);

  const value: SurtidoContextType = {
    surtidoEnCurso,
    isModalOpen,
    iniciarSurtido,
    finalizarSurtido,
    mostrarModal,
    ocultarModal,
    actualizarFase,
    agregarEpc,
    setScannedEpcs,
    actualizarConfirmations,
  };

  return (
    <SurtidoContext.Provider value={value}>
      {children}
    </SurtidoContext.Provider>
  );
};
