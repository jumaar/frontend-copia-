import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { superadminNavItems } from '../../shared/layouts/Sidebar/navigation/superadmin.nav';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const FinanzasLogisticaScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica/FinanzasLogisticaScreen/FinanzasLogisticaScreen'));
const FrigorificoProductosPage = lazy(() => import('./pages/ProductosAdminPage'));
const CuentasTiendaPage = lazy(() => import('./pages/CuentasTiendaAdminPage'));
const HistorialTiendaPage = lazy(() => import('./pages/HistorialTiendaAdminPage'));
const CuentasFrigorificoPage = lazy(() => import('./pages/CuentasFrigorificoPage'));

const LogisticaInventarioScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica/LogisticaInventarioScreen/LogisticaInventarioScreen'));
const InventarioNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-frigorifico-logistica/InventarioNeverasScreen/InventarioNeverasScreen'));

const superadminRouteTitles: Record<string, string> = {
  '/superadmin/dashboard': 'Dashboard',
  '/superadmin/users': 'Gestión de Usuarios',
  '/superadmin/logistica': 'Gestión Logística',
  '/superadmin/productos': 'Gestión de Productos',
  '/superadmin/neveras': 'Gestión de Neveras',
  '/superadmin/accounts': 'Finanzas',
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
        <Route path="logistica" element={<LogisticaInventarioScreen mode="admin" />} />
        <Route path="productos" element={<FrigorificoProductosPage />} />
        <Route path="neveras" element={<InventarioNeverasScreen mode="admin" />} />
        <Route path="accounts" element={<div className="management-page"><div className="cuentas-header"><h1>Finanzas</h1><p>En construcción</p></div></div>} />
        <Route path="cuentas-tiendas" element={<CuentasTiendaPage />} />
        <Route path="historial-tienda" element={<HistorialTiendaPage />} />
        <Route path="finanzas-logistica" element={<FinanzasLogisticaScreen />} />
        <Route path="cuentas-frigorificos" element={<CuentasFrigorificoPage />} />
      </Routes>
    </RoleLayout>
  );
};

export default SuperAdminApp;
