import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { frigorificoNavItems } from '../../shared/layouts/Sidebar/navigation/frigorifico.nav';

const FrigorificoPage = lazy(() => import('./pages/FrigorificoPage'));
const FrigorificoLogisticaPage = lazy(() => import('./pages/LogisticaPage'));
const FrigorificoProductosPage = lazy(() => import('./pages/ProductosPage'));
const FrigorificoCuentasPage = lazy(() => import('./pages/CuentasFrigorificoPage'));

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
