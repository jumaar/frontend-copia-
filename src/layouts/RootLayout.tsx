import React, { useContext } from 'react';
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './RootLayout.css';
import { AuthContext } from '../contexts/AuthContext';

interface RootLayoutProps {
  children: ReactNode;
  isLoading: boolean;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children, isLoading }) => {
  const auth = useContext(AuthContext);

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
    <div className="root-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default RootLayout;