import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { frigorificoNavItems } from '../../shared/layouts/Sidebar/navigation/frigorifico.nav';
import FrigorificoPage from './pages/FrigorificoPage';
import FrigorificoLogisticaPage from './pages/LogisticaPage';
import FrigorificoProductosPage from './pages/ProductosPage';
import FrigorificoCuentasPage from './pages/CuentasFrigorificoPage';

const frigorificoRouteTitles: Record<string, string> = {
  '/frigorifico': 'Dashboard',
  '/frigorifico/logistica': 'Gestión Frigoríficos',
  '/frigorifico/productos': 'Gestión de Productos',
  '/frigorifico/cuentas': 'Cuentas Globales',
};

const FrigorificoApp: React.FC = () => {
  return (
    <RoleLayout
      category="Frigorífico"
      navItems={frigorificoNavItems}
      routeTitles={frigorificoRouteTitles}
    >
      <Routes>
        <Route index element={<FrigorificoPage />} />
        <Route path="logistica" element={<FrigorificoLogisticaPage />} />
        <Route path="productos" element={<FrigorificoProductosPage />} />
        <Route path="cuentas" element={<FrigorificoCuentasPage />} />
      </Routes>
    </RoleLayout>
  );
};

export default FrigorificoApp;
