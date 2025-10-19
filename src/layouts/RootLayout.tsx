import React, { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './RootLayout.css';

interface RootLayoutProps {
  children: ReactNode;
  isLoading: boolean;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children, isLoading }) => {
  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div>Loading...</div>
      </div>
    );
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