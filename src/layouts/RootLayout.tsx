import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Alert from '../components/Alert';
import './RootLayout.css';
import { AuthContext, useAuth } from '../contexts/AuthContext';

// Hook simple para detectar el tamaño de la pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

interface RootLayoutProps {
  children: ReactNode;
  isLoading: boolean;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children, isLoading }) => {
  const auth = useContext(AuthContext);
  const { welcomeMessage, dismissWelcomeMessage } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const routeTitles: { [key: string]: string } = {
    '/admin/dashboard': 'Dashboard Admin',
    '/admin/users': 'Gestión de Usuarios',
    '/admin/tiendas': 'Gestión de Tiendas',
    '/admin/frigorificos': 'Gestión de Frigoríficos',
    '/admin/logistica': 'Gestión de Logística',
    '/admin/productos': 'Gestión de Productos',
    '/admin/neveras': 'Gestión de Neveras',
    '/admin/accounts': 'Cuentas Globales',
    '/frigorifico/dashboard': 'Dashboard Frigorífico',
    '/logistica/dashboard': 'Dashboard Logística',
    '/tienda': 'Inventario de Tienda',
  };

  const currentPageTitle = routeTitles[location.pathname] || '';

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div>Loading...</div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar sidebar ni header
  if (!auth || !(auth as any).isAuthenticated) {
    return <main className="page-content">{children}</main>;
  }

  return (
    <div className={`root-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {welcomeMessage && <Alert message={welcomeMessage} onDismiss={dismissWelcomeMessage} type="welcome" />}
      {isSidebarOpen && isMobile && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={isMobile ? toggleSidebar : undefined}
        onToggleSidebar={toggleSidebar}
      />
      <div className="main-content">
        <Header
          onToggleSidebar={toggleSidebar}
          pageTitle={currentPageTitle}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default RootLayout;