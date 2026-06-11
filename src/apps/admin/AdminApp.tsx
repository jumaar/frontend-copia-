import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { adminNavItems } from '../../shared/layouts/Sidebar/navigation/admin.nav';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const FinanzasLogisticaScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica/FinanzasLogisticaScreen/FinanzasLogisticaScreen'));
const FrigorificoProductosPage = lazy(() => import('./pages/ProductosAdminPage'));
const CuentasNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/CuentasNeverasScreen/CuentasNeverasScreen'));
const FinanzasTiendaScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/FinanzasTiendaScreen/FinanzasTiendaScreen'));
const FinanzasFrigorificoScreen = lazy(() => import('../../shared/scoped/admin-superadmin-frigorifico-logistica/FinanzasFrigorificoScreen/FinanzasFrigorificoScreen'));

const LogisticaInventarioScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica/LogisticaInventarioScreen/LogisticaInventarioScreen'));
const InventarioNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/InventarioNeverasScreen/InventarioNeverasScreen'));

const adminRouteTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Gestión de Usuarios',
  '/admin/logistica': 'Gestión Logística',
  '/admin/productos': 'Gestión de Productos',
  '/admin/neveras': 'Inventario Neveras',
  '/admin/cuentas-tiendas': 'Cuentas Tiendas',
  '/admin/finanzas-tienda': 'Finanzas Tiendas',
  '/admin/finanzas-logistica': 'Finanzas Logísticas',
  '/admin/finanzas': 'Finanzas',
  '/admin/finanzas-frigorificos': 'Finanzas Frigoríficos',
};

const AdminApp: React.FC = () => {
  return (
    <RoleLayout
      category="Administración"
      navItems={adminNavItems}
      routeTitles={adminRouteTitles}
    >
      <Routes>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="logistica" element={<LogisticaInventarioScreen mode="admin" />} />
        <Route path="productos" element={<FrigorificoProductosPage />} />
        <Route path="neveras" element={<InventarioNeverasScreen mode="admin" />} />
        <Route path="finanzas" element={<div className="management-page"><div className="cuentas-header"><h1>Finanzas</h1><p>En construcción</p></div></div>} />
        <Route path="cuentas-tiendas" element={<CuentasNeverasScreen />} />
        <Route path="finanzas-tienda" element={<FinanzasTiendaScreen />} />
        <Route path="finanzas-logistica" element={<FinanzasLogisticaScreen />} />
        <Route path="finanzas-frigorificos" element={<FinanzasFrigorificoScreen />} />
      </Routes>
    </RoleLayout>
  );
};

export default AdminApp;
