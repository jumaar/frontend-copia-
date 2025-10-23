import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthFailureHandler } from '../services/api';

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

const getRoleName = (roleId: number): User['role'] => {
  switch (roleId) {
    case 1: return 'superadmin';
    case 2: return 'admin';
    case 3: return 'frigorifico';
    case 4: return 'logistica';
    case 5: return 'tienda';
    default: return 'tienda';
  }
};

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
    // Evitar múltiples llamadas simultáneas al logout
    if (isRestoring.current) {
      return;
    }
    isRestoring.current = true;

    try {
      // Intentar logout en el backend, pero sin depender de él
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorar errores del logout del backend, ya que es opcional
      console.log('Backend logout failed, but continuing with local cleanup');
    } finally {
      // Limpiar estado local siempre
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsLoading(false);
      hasRestoredSession.current = false;
      isRestoring.current = false;
    }
  }, []);

  useEffect(() => {
    setAuthFailureHandler(logout);

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
        const token = localStorage.getItem('authToken');

        // Si no hay token, terminar inmediatamente
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await api.post('/auth/refresh');

        const { accessToken } = response.data;
        if (!accessToken) {
          throw new Error('No accessToken received from refresh');
        }

        localStorage.setItem('authToken', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        const decoded: any = jwtDecode(accessToken);

        const restoredUser: User = {
          id: String(decoded.sub),
          email: decoded.email,
          role: getRoleName(decoded.roleId),
          name: `${decoded.nombre_usuario || ''} ${decoded.apellido_usuario || ''}`.trim(),
        };

        setUser(restoredUser);

      } catch (error) {
        setAuthError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        setUser(null);
      } finally {
        hasRestoredSession.current = true;
        isRestoring.current = false;
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [logout]);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    // Limpiar cualquier error anterior antes de intentar login
    setAuthError(null);

    // Asegurar que tenemos todos los parámetros requeridos
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email y contraseña son requeridos');
    }

    try {
      // Crear el payload de login
      const loginPayload = {
        email: email.trim(),
        password: password.trim(),
        ...(turnstileToken && { turnstileToken })
      };

      const response = await api.post('/auth/login', loginPayload);
      const { accessToken, ...userDataResponse } = response.data;

      if (!accessToken) {
        throw new Error('No se recibió token de acceso del servidor');
      }

      localStorage.setItem('authToken', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      const decoded: any = jwtDecode(accessToken);

      const newUser: User = {
        id: String(decoded.sub),
        email: decoded.email,
        role: getRoleName(decoded.roleId),
        name: `${userDataResponse.nombre_usuario || ''} ${userDataResponse.apellido_usuario || ''}`.trim()
      };

      setUser(newUser);
      setWelcomeMessage(`¡Bienvenido, ${newUser.name}!`);
      return newUser;
    } catch (error: any) {
      // Limpiar el estado de usuario en caso de error
      setUser(null);
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];

      // Manejar errores específicos del login
      if (error.response?.status === 400) {
        throw new Error('Usuario o contraseña inválidos');
      } else if (error.response?.status === 401) {
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