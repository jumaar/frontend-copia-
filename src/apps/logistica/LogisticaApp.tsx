import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { SurtidoProvider, useSurtido } from './contexts/SurtidoContext';
import './logistica.css';
import { logisticaNavItems } from '../../shared/layouts/Sidebar/navigation/logistica.nav';

const SurtidoOverlay = lazy(() => import('./components/SurtidoOverlay'));
const LogisticaDashboardPage = lazy(() => import('./pages/LogisticaDashboardPage'));
const LogisticaGestionPage = lazy(() => import('./pages/LogisticaGestionPage'));
const FinanzasLogisticaScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica/FinanzasLogisticaScreen/FinanzasLogisticaScreen'));
const CuentasNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/CuentasNeverasScreen/CuentasNeverasScreen'));
const FinanzasTiendaScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/FinanzasTiendaScreen/FinanzasTiendaScreen'));
const CuentasFrigorificoPage = lazy(() => import('./pages/CuentasFrigorificoPage'));

const LogisticaInventarioScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica/LogisticaInventarioScreen/LogisticaInventarioScreen'));
const InventarioNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/InventarioNeverasScreen/InventarioNeverasScreen'));

const InventarioNeverasWrapper: React.FC = () => {
  const { iniciarSurtido } = useSurtido();
  return <InventarioNeverasScreen mode="logistica" onIniciarSurtido={iniciarSurtido} />;
};

const logisticaRouteTitles: Record<string, string> = {
  '/logistica': 'Dashboard',
  '/logistica/gestion': 'Gestión Frigoríficos',
  '/logistica/inventario': 'Gestión Inventario',
  '/logistica/neveras': 'Gestión de Neveras',
  '/logistica/finanzas': 'Finanzas',
  '/logistica/cuentas-tiendas': 'Cuentas Tiendas',
  '/logistica/finanzas-tienda': 'Finanzas Tiendas',
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
          <Route path="inventario" element={<LogisticaInventarioScreen mode="self" />} />
          <Route path="neveras" element={<InventarioNeverasWrapper />} />
          <Route path="finanzas" element={<FinanzasLogisticaScreen />} />
          <Route path="cuentas-tiendas" element={<CuentasNeverasScreen />} />
          <Route path="finanzas-tienda" element={<FinanzasTiendaScreen />} />
          <Route path="cuentas-frigorificos" element={<CuentasFrigorificoPage />} />
        </Routes>
      </RoleLayout>
      <SurtidoOverlay />
    </SurtidoProvider>
  );
};

export default LogisticaApp;
