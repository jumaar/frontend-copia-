import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { superadminNavItems } from '../../shared/layouts/Sidebar/navigation/superadmin.nav';
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
