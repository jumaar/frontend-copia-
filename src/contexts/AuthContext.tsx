import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { getRoleName } from '../shared/config/roles';
import { login as loginService, refreshSession, logout as logoutService } from '../services/domains/auth.service';

interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'frigorifico' | 'logistica' | 'tienda';
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, turnstileToken?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  welcomeMessage: string | null;
  dismissWelcomeMessage: () => void;
  authError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Eliminado: getRoleName ya no se usa con cookies HttpOnly

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Solo estamos "cargando" la sesión si existe un token para verificar
  const [isLoading, setIsLoading] = useState(true); // Siempre empezar en loading
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasRestoredSession = useRef(false);
  const isRestoring = useRef(false);

  const dismissWelcomeMessage = useCallback(() => {
    setWelcomeMessage(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutService();
      // Las cookies se eliminan automáticamente por el backend
    } catch (error) {
      console.error('Error en logout:', error);
    }
    // Limpiar estado local
    setUser(null);
    setIsLoading(false);
    hasRestoredSession.current = false;
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      // Si ya se está restaurando, esperar
      if (isRestoring.current) {
        return;
      }

      // Si ya se intentó restaurar, no hacer nada
      if (hasRestoredSession.current) {
        return;
      }

      isRestoring.current = true;

      try {
        // Verificar si hay una sesión activa haciendo una solicitud al backend
        const userData = await refreshSession();

        const restoredUser: User = {
          id: String(userData.id_usuario || userData.id || userData.sub || 'unknown'),
          email: userData.email || '',
          role: getRoleName(userData.id_rol || userData.role || 5),
          name: `${userData.nombre_usuario || ''} ${userData.apellido_usuario || ''}`.trim() || 'Usuario'
        };

        setUser(restoredUser);
      } catch (error) {
        // Si falla, no hay sesión válida
        console.log('Sesión no válida o expirada:', error);
        setAuthError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        setUser(null);
      } finally {
        hasRestoredSession.current = true;
        isRestoring.current = false;
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    // Limpiar cualquier error anterior antes de intentar login
    setAuthError(null);

    // Asegurar que tenemos todos los parámetros requeridos
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email y contraseña son requeridos');
    }

    try {
      const userData = await loginService(email, password, turnstileToken);

      const newUser: User = {
        id: String(userData.id_usuario || userData.id || userData.sub || 'unknown'),
        email: userData.email || email.trim(),
        role: getRoleName(userData.id_rol || userData.role || 5),
        name: `${userData.nombre_usuario || ''} ${userData.apellido_usuario || ''}`.trim() || 'Usuario'
      };

      setUser(newUser);
      setWelcomeMessage(`¡Bienvenido, ${newUser.name}!`);
      return newUser;
    } catch (error: any) {
      // Limpiar el estado de usuario en caso de error
      setUser(null);

      // Manejar errores específicos del login
      if (error.response?.status === 400) {
        throw new Error('Usuario o contraseña inválidos');
      } else if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message;
        // Verificar si el mensaje indica que el usuario está inactivo
        if (errorMessage && (errorMessage.includes('Usuario inactivo') || errorMessage.includes('User is inactive'))) {
          throw new Error('Su cuenta está desactivada. Por favor, comuníquese con un administrador.');
        }
        throw new Error('Credenciales incorrectas');
      } else if (error.response?.status === 429) {
        throw new Error('Demasiadas solicitudes. Debes esperar 1 minuto antes de intentar nuevamente');
      } else {
        // Para otros errores, usar el mensaje del backend o un mensaje genérico
        throw new Error(error.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    welcomeMessage,
    dismissWelcomeMessage,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};