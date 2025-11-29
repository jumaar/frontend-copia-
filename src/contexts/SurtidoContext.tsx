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

interface SurtidoData {
  idNevera: number;
  nombreTienda: string;
  stockData: ProductoSurtido[];
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

  // Función para obtener la clave de localStorage específica del usuario
  const getStorageKey = useCallback((userId: string) => `surtidoEnCurso_${userId}`, []);

  // Cargar surtido desde localStorage cuando el usuario cambia
  useEffect(() => {
    if (user?.id) {
      const storageKey = getStorageKey(user.id);
      const surtidoGuardado = localStorage.getItem(storageKey);

      if (surtidoGuardado) {
        try {
          const surtidoData: SurtidoData = JSON.parse(surtidoGuardado);

          // Verificar que el surtido pertenece al usuario actual
          if (surtidoData.userId === user.id) {
            setSurtidoEnCurso(surtidoData);
            setIsModalOpen(true);
          } else {
            // Si no pertenece al usuario actual, limpiar
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Error al cargar surtido guardado:', error);
          localStorage.removeItem(storageKey);
        }
      }
    } else {
      // Si no hay usuario, limpiar estado
      setSurtidoEnCurso(null);
      setIsModalOpen(false);
    }
  }, [user?.id, getStorageKey]);

  const iniciarSurtido = useCallback((data: Omit<SurtidoData, 'timestamp' | 'userId'>) => {
    if (!user?.id) return;

    const surtidoData: SurtidoData = {
      ...data,
      timestamp: new Date().toISOString(),
      userId: user.id
    };

    setSurtidoEnCurso(surtidoData);
    setIsModalOpen(true);

    // Guardar en localStorage
    const storageKey = getStorageKey(user.id);
    localStorage.setItem(storageKey, JSON.stringify(surtidoData));
  }, [user?.id, getStorageKey]);

  const finalizarSurtido = useCallback(() => {
    if (!user?.id) return;

    setSurtidoEnCurso(null);
    setIsModalOpen(false);

    // Limpiar localStorage
    const storageKey = getStorageKey(user.id);
    localStorage.removeItem(storageKey);
  }, [user?.id, getStorageKey]);

  const mostrarModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const ocultarModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const value: SurtidoContextType = {
    surtidoEnCurso,
    isModalOpen,
    iniciarSurtido,
    finalizarSurtido,
    mostrarModal,
    ocultarModal,
  };

  return (
    <SurtidoContext.Provider value={value}>
      {children}
    </SurtidoContext.Provider>
  );
};