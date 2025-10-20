import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'frigorifico' | 'logistica' | 'tienda';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setToken(storedToken);
          setUser({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
          });
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    try {
      console.log('🔐 Intentando login con:', { email, password: '***', turnstileToken: turnstileToken ? 'presente' : 'ausente' });

      // Comunicación real con backend en localhost:3000
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      console.log('📡 Respuesta del backend:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const data = await response.json();
      console.log('✅ Login exitoso, datos recibidos:', data);

      const { token: newToken } = data;

      localStorage.setItem('authToken', newToken);
      setToken(newToken);

      const decoded: any = jwtDecode(newToken);
      console.log('🔓 Token decodificado:', decoded);

      setUser({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      });

      console.log('🎉 Usuario establecido:', { id: decoded.id, email: decoded.email, role: decoded.role });
    } catch (error) {
      console.error('💥 Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};