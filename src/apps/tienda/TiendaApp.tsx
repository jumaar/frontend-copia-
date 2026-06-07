import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { tiendaNavItems } from '../../shared/layouts/Sidebar/navigation/tienda.nav';

const TiendaDashboardPage = lazy(() => import('./pages/TiendaDashboardPage'));
const TiendaInventarioPage = lazy(() => import('./pages/TiendaInventarioPage'));
const CuentasTiendaPage = lazy(() => import('./pages/TiendaCuentasPage'));
const HistorialTiendaPage = lazy(() => import('./pages/HistorialTiendaPage'));

const tiendaRouteTitles: Record<string, string> = {
  '/tienda': 'Dashboard',
  '/tienda/inventario': 'Inventario Tiendas',
  '/tienda/cuentas': 'Mis Cuentas',
  '/tienda/historial': 'Historial',
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
        <Route path="inventario" element={<TiendaInventarioPage />} />
        <Route path="cuentas" element={<CuentasTiendaPage />} />
        <Route path="historial" element={<HistorialTiendaPage />} />
      </Routes>
    </RoleLayout>
  );
};

export default TiendaApp;
