import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  const dismissWelcomeMessage = useCallback(() => {
    setWelcomeMessage(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during backend logout:', error);
    } finally {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsLoading(false); // Detener la carga al cerrar sesión
      console.log('🧹 Session closed and local state cleaned.');
    }
  }, []);

  useEffect(() => {
    setAuthFailureHandler(logout);

    let isMounted = true;

    const restoreSession = async () => {
      try {
        console.log('🔄 Attempting to restore session...');
        const { data } = await api.post('/auth/refresh');
        const { accessToken } = data;

        localStorage.setItem('authToken', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        const decoded: any = jwtDecode(accessToken);
        const restoredUser: User = {
          id: String(decoded.sub),
          email: decoded.email,
          role: getRoleName(decoded.roleId),
          name: `${decoded.nombre_usuario || ''} ${decoded.apellido_usuario || ''}`.trim(),
        };
        
        if (isMounted) {
          setUser(restoredUser);
          console.log('✅ Session restored successfully.');
        }
      } catch (error) {
        console.log('ℹ️ No session to restore or refresh token is invalid.');
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    const response = await api.post('/auth/login', { email, password, turnstileToken });
    const { accessToken, ...userDataResponse } = response.data;

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
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    welcomeMessage,
    dismissWelcomeMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};