import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { SurtidoProvider } from './contexts/SurtidoContext';
import './logistica.css';
import { logisticaNavItems } from '../../shared/layouts/Sidebar/navigation/logistica.nav';

const SurtidoOverlay = lazy(() => import('./components/SurtidoOverlay'));
const LogisticaDashboardPage = lazy(() => import('./pages/LogisticaDashboardPage'));
const LogisticaGestionPage = lazy(() => import('./pages/LogisticaGestionPage'));
const LogisticaInventarioPage = lazy(() => import('./pages/LogisticaInventarioSelfPage'));
const LogisticaFinanzasPage = lazy(() => import('./pages/LogisticaFinanzasPage'));
const CuentasTiendaPage = lazy(() => import('./pages/CuentasTiendaPage'));
const HistorialTiendaPage = lazy(() => import('./pages/HistorialTiendaPage'));
const CuentasFrigorificoPage = lazy(() => import('./pages/CuentasFrigorificoPage'));

const logisticaRouteTitles: Record<string, string> = {
  '/logistica': 'Dashboard',
  '/logistica/gestion': 'Gestión Frigoríficos',
  '/logistica/inventario': 'Gestión Inventario',
  '/logistica/finanzas': 'Finanzas',
  '/logistica/cuentas-tiendas': 'Cuentas Tiendas',
  '/logistica/historial-tienda': 'Historial Tiendas',
  '/logistica/cuentas-frigorificos': 'Cuentas Frigoríficos',
};

const LogisticaApp: React.FC = () => {
  return (
    <SurtidoProvider>
      <RoleLayout
        category="Logística"
        navItems={logisticaNavItems}
        routeTitles={logisticaRouteTitles}
      >
        <Routes>
          <Route index element={<LogisticaDashboardPage />} />
          <Route path="gestion" element={<LogisticaGestionPage />} />
          <Route path="inventario" element={<LogisticaInventarioPage />} />
          <Route path="finanzas" element={<LogisticaFinanzasPage />} />
          <Route path="cuentas-tiendas" element={<CuentasTiendaPage />} />
          <Route path="historial-tienda" element={<HistorialTiendaPage />} />
          <Route path="cuentas-frigorificos" element={<CuentasFrigorificoPage />} />
        </Routes>
      </RoleLayout>
      <SurtidoOverlay />
    </SurtidoProvider>
  );
};

export default LogisticaApp;
