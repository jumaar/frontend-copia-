import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { superadminNavItems } from '../../shared/layouts/Sidebar/navigation/superadmin.nav';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const FridgeManagementPage = lazy(() => import('./pages/FridgeManagementPage'));
const GlobalAccountsPage = lazy(() => import('./pages/GlobalAccountsPage'));
const LogisticaInventarioPage = lazy(() => import('./pages/InventarioAdminPage'));
const FrigorificoProductosPage = lazy(() => import('./pages/ProductosAdminPage'));
const CuentasTiendaPage = lazy(() => import('./pages/CuentasTiendaAdminPage'));
const HistorialTiendaPage = lazy(() => import('./pages/HistorialTiendaAdminPage'));
const CuentasFrigorificoPage = lazy(() => import('./pages/CuentasFrigorificoPage'));
const LogisticaFinanzasPage = lazy(() => import('./pages/FinanzasAdminPage'));

const superadminRouteTitles: Record<string, string> = {
  '/superadmin/dashboard': 'Dashboard',
  '/superadmin/users': 'Gestión de Usuarios',
  '/superadmin/logistica': 'Gestión Frigoríficos',
  '/superadmin/productos': 'Gestión de Productos',
  '/superadmin/neveras': 'Gestión de Neveras',
  '/superadmin/accounts': 'Cuentas Globales',
  '/superadmin/cuentas-tiendas': 'Cuentas Tiendas',
  '/superadmin/historial-tienda': 'Historial Tiendas',
  '/superadmin/finanzas-logistica': 'Finanzas Logísticas',
  '/superadmin/cuentas-frigorificos': 'Cuentas Frigoríficos',
};

const SuperAdminApp: React.FC = () => {
  return (
    <RoleLayout
      category="Super Administración"
      navItems={superadminNavItems}
      routeTitles={superadminRouteTitles}
    >
      <Routes>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="logistica" element={<LogisticaInventarioPage />} />
        <Route path="productos" element={<FrigorificoProductosPage />} />
        <Route path="neveras" element={<FridgeManagementPage />} />
        <Route path="accounts" element={<GlobalAccountsPage />} />
        <Route path="cuentas-tiendas" element={<CuentasTiendaPage />} />
        <Route path="historial-tienda" element={<HistorialTiendaPage />} />
        <Route path="finanzas-logistica" element={<LogisticaFinanzasPage />} />
        <Route path="cuentas-frigorificos" element={<CuentasFrigorificoPage />} />
      </Routes>
    </RoleLayout>
  );
};

export default SuperAdminApp;
