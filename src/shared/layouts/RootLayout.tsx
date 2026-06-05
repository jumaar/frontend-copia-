import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Alert from '../components/Alert/Alert';
import SurtirFlujoModal from '../components/SurtirFlujoModal/SurtirFlujoModal';
import './RootLayout.css';
import { useAuth } from '../../contexts/AuthContext';
import { useSurtido } from '../../apps/logistica/contexts/SurtidoContext';
import { adminNavItems } from './navigation/admin.nav';
import { superadminNavItems } from './navigation/superadmin.nav';
import { logisticaNavItems } from './navigation/logistica.nav';
import { frigorificoNavItems } from './navigation/frigorifico.nav';
import { tiendaNavItems } from './navigation/tienda.nav';
import type { NavItem } from './Sidebar';

const navItemsByRole: Record<string, NavItem[]> = {
  superadmin: superadminNavItems,
  admin: adminNavItems,
  logistica: logisticaNavItems,
  frigorifico: frigorificoNavItems,
  tienda: tiendaNavItems,
};

const categoryByRole: Record<string, string> = {
  superadmin: 'Super Administración',
  admin: 'Administración',
  logistica: 'Logística',
  frigorifico: 'Frigorífico',
  tienda: 'Tienda',
};

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
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, welcomeMessage, dismissWelcomeMessage, user } = useAuth();
  const { surtidoEnCurso, isModalOpen, finalizarSurtido } = useSurtido();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const routeTitles: { [key: string]: string } = {
    '/admin/dashboard': 'Dashboard',
    '/admin/users': 'Gestión de Usuarios',
    '/admin/frigorificos': 'Gestión de Frigoríficos',
    '/admin/logistica': 'Gestión Frigoríficos',
    '/admin/productos': 'Gestión de Productos',
    '/admin/neveras': 'Gestión de Neveras',
    '/admin/accounts': 'Cuentas Globales',
    '/frigorifico': 'Dashboard',
    '/logistica': 'Dashboard',
    '/tienda': 'Inventario de Tienda',
  };

  const currentPageTitle = routeTitles[location.pathname] || '';
  const currentNavItems = user ? (navItemsByRole[user.role] || []) : [];
  const currentCategory = user ? (categoryByRole[user.role] || '') : '';


  // Si no está autenticado y no está cargando, no mostrar sidebar ni header
  if (!isAuthenticated && !isLoading) {
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
        category={currentCategory}
        navItems={currentNavItems}
      />
      <div className="main-content">
        <Header
          onToggleSidebar={toggleSidebar}
          pageTitle={currentPageTitle}
        />
        <main className="page-content">{children}</main>
      </div>

      {/* Modal global de surtido para usuarios de logística */}
      {user?.role === 'logistica' && surtidoEnCurso && (
        <SurtirFlujoModal
          isOpen={isModalOpen}
          onClose={finalizarSurtido}
          idNevera={surtidoEnCurso.idNevera}
          nombreTienda={surtidoEnCurso.nombreTienda}
        />
      )}
    </div>
  );
};

export default RootLayout;