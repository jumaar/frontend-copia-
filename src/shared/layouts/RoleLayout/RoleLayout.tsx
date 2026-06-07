import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Alert from '../../components/Alert/Alert';
import type { NavItem } from '../Sidebar';
import { useAuth } from '../../../contexts/AuthContext';
import './RoleLayout.css';

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

interface RoleLayoutProps {
  children: React.ReactNode;
  category: string;
  navItems: NavItem[];
  routeTitles?: Record<string, string>;
}

const RoleLayout: React.FC<RoleLayoutProps> = ({
  children,
  category,
  navItems,
  routeTitles = {},
}) => {
  const { isAuthenticated, isLoading, welcomeMessage, dismissWelcomeMessage } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const currentPageTitle = routeTitles[location.pathname] || '';

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
        category={category}
        navItems={navItems}
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

export type { RoleLayoutProps };
export default RoleLayout;
