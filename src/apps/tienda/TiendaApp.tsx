import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { tiendaNavItems } from '../../shared/layouts/Sidebar/navigation/tienda.nav';

const TiendaDashboardPage = lazy(() => import('./pages/TiendaDashboardPage'));
const InventarioNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/InventarioNeverasScreen/InventarioNeverasScreen'));
const CuentasNeverasScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/CuentasNeverasScreen/CuentasNeverasScreen'));
const FinanzasTiendaScreen = lazy(() => import('../../shared/scoped/admin-superadmin-logistica-tienda/FinanzasTiendaScreen/FinanzasTiendaScreen'));

const tiendaRouteTitles: Record<string, string> = {
  '/tienda': 'Dashboard',
  '/tienda/inventario': 'Inventario Neveras',
  '/tienda/cuentas': 'Mis Cuentas',
  '/tienda/finanzas': 'Finanzas',
};

const TiendaApp: React.FC = () => {
  return (
    <RoleLayout
      category="Tienda"
      navItems={tiendaNavItems}
      routeTitles={tiendaRouteTitles}
    >
      <Routes>
        <Route index element={<TiendaDashboardPage />} />
        <Route path="inventario" element={<InventarioNeverasScreen mode="tienda" />} />
        <Route path="cuentas" element={<CuentasNeverasScreen />} />
        <Route path="finanzas" element={<FinanzasTiendaScreen />} />
      </Routes>
    </RoleLayout>
  );
};

export default TiendaApp;
