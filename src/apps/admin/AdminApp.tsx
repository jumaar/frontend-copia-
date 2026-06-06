import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { adminNavItems } from '../../shared/layouts/Sidebar/navigation/admin.nav';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import FridgeManagementPage from './pages/FridgeManagementPage';
import GlobalAccountsPage from './pages/GlobalAccountsPage';
import LogisticaInventarioPage from './pages/InventarioAdminPage';
import FrigorificoProductosPage from './pages/ProductosAdminPage';
import CuentasTiendaPage from './pages/CuentasTiendaAdminPage';
import HistorialTiendaPage from './pages/HistorialTiendaAdminPage';
import CuentasFrigorificoPage from './pages/CuentasFrigorificoPage';
import LogisticaFinanzasPage from './pages/FinanzasAdminPage';

const adminRouteTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Gestión de Usuarios',
  '/admin/logistica': 'Gestión Frigoríficos',
  '/admin/productos': 'Gestión de Productos',
  '/admin/neveras': 'Gestión de Neveras',
  '/admin/accounts': 'Cuentas Globales',
  '/admin/cuentas-tiendas': 'Cuentas Tiendas',
  '/admin/historial-tienda': 'Historial Tiendas',
  '/admin/finanzas-logistica': 'Finanzas Logísticas',
  '/admin/cuentas-frigorificos': 'Cuentas Frigoríficos',
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

export default AdminApp;
